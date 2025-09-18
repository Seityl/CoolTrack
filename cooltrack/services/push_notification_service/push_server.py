import os
import json
import time
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

from flask_cors import CORS
from flask import Flask, request, jsonify

import firebase_admin
from firebase_admin import credentials, messaging

from cooltrack.utils import load_env_file
from cooltrack.services.frappe_client import FrappeClient

def setup_logging():
    log_level = 'DEBUG'
    log_dir = './logs'

    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger('push_server')
    logger.setLevel(getattr(logging, log_level.upper()))
    logger.propagate = False

    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Console handler
    console_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level.upper()))
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # File handler (info)
    info_file = os.path.join(log_dir, 'push_server.log')
    file_handler = RotatingFileHandler(
        info_file, mode='a', maxBytes=50*1024*1024, backupCount=100, encoding='utf-8'
    )
    file_handler.setLevel(getattr(logging, log_level.upper()))
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # File handler (errors only)
    error_file = os.path.join(log_dir, 'push_server.error.log')
    error_handler = RotatingFileHandler(
        error_file, mode='a', maxBytes=50*1024*1024, backupCount=100, encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    logger.addHandler(error_handler)

    # Reduce noise from urllib3 & requests
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('urllib3').propagate = False
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('requests').propagate = False

    logger.info(f'Logging initialized. Info: {info_file}, Errors: {error_file}')
    return logger

logger = setup_logging()

load_env_file(logger)

# -------------------------------
# Flask App Setup
# -------------------------------
app = Flask(__name__)

CORS(
    app,
    origins=['badmc.cooltrack.co'],
    allow_headers=['Content-Type', 'Authorization'],
    methods=['GET', 'POST', 'OPTIONS'],
    supports_credentials=True
)

# -------------------------------
# Globals
# -------------------------------
firebase_app = None
CREDENTIALS = {}
app_initialized = False
frappe_client = None

# -------------------------------
# Firebase Helper
# -------------------------------
def get_firebase_app():
    global firebase_app
    if firebase_app:
        return firebase_app

    service_account_data = CREDENTIALS.get('firebase_service_account_key')
    if not service_account_data:
        raise RuntimeError('Firebase service account key missing in credentials')

    cred = credentials.Certificate(service_account_data)
    firebase_app = firebase_admin.initialize_app(cred)
    app.logger.info('Firebase initialized successfully')
    return firebase_app

# -------------------------------
# Frappe Credentials
# -------------------------------
def get_credentials():
    if frappe_client.api_key and frappe_client.api_secret:
        try:
            settings = frappe_client.get_single_doc('Push Notification Settings')
            if settings:
                creds = {
                    'api_key': frappe_client.api_key,
                    'api_secret': frappe_client.api_secret,
                    'badge_icon': settings.get('badge_icon'),
                    'vapid_public_key': settings.get('vapid_public_key'),
                    'firebase_config': json.loads(settings.get('firebase_config')),
                    'firebase_service_account_key': json.loads(settings.get('firebase_service_account_key'))
                }
                return creds
                
        except Exception as e:
            app.logger.warning(f'Failed to fetch Push Notification Settings: {e}')
            
    app.logger.warning('Frappe API credentials not set')
    return {}

# -------------------------------
# App Initialization
# -------------------------------
def initialize_app():
    global CREDENTIALS, app_initialized, frappe_client

    if app_initialized:
        return

    if not frappe_client:
        frappe_client = FrappeClient(logger=logger)

    try:
        CREDENTIALS = get_credentials()
        app.logger.info(f'Credentials loaded: {bool(CREDENTIALS)}')
        if CREDENTIALS.get('firebase_service_account_key'):
            get_firebase_app()
            
        app_initialized = True
        
    except Exception as e:
        app.logger.error(f'App initialization failed: {e}')
        app_initialized = False

# -------------------------------
# Ensure Initialization on Requests
# -------------------------------
@app.before_request
def ensure_initialized():
    if not app_initialized:
        initialize_app()

# -------------------------------
# Auth & Device Token Helpers
# -------------------------------
def validate_frappe_auth(auth_header: str):
    try:
        if auth_header.startswith('token '):
            return frappe_client.get_logged_user(auth_header=auth_header)
            
        else:  # Session Cookie
            return frappe_client.get_logged_user(session_cookie=auth_header)
            
    except Exception as e:
        app.logger.error(f"Auth validation error: {e}")
        return None

def get_user_device_tokens_data(user_id):
    try:
        if not frappe_client.check_user_exists(user_id):
            return {}
            
        user_doc = frappe_client.get_doc('User', user_id)
        tokens_json = user_doc.get('device_tokens_json') if user_doc else '{}'
        return json.loads(tokens_json) if tokens_json else {}
        
    except Exception as e:
        app.logger.error(f'Error getting device tokens for {user_id}: {e}')
        return {}

def save_user_device_tokens_data(user_id, tokens_data):
    try:
        if not frappe_client.check_user_exists(user_id):
            return False

        update_data = {'device_tokens_json': json.dumps(tokens_data, default=str)}
        return frappe_client.update_doc('User', user_id, update_data)
        
    except Exception as e:
        app.logger.error(f'Error saving device tokens for {user_id}: {e}')
        return False

def get_user_device_tokens(project_name, site_name, user_id):
    tokens_data = get_user_device_tokens_data(user_id)
    key = f'{project_name}_{site_name}'
    active_tokens = [t['fcm_token'] for t in tokens_data.get(key, []) if t.get('is_active', True)]
    return active_tokens

def add_user_device_token(project_name, site_name, user_id, fcm_token):
    tokens_data = get_user_device_tokens_data(user_id)
    key = f'{project_name}_{site_name}'
    if key not in tokens_data:
        tokens_data[key] = []

    existing = next((t for t in tokens_data[key] if t['fcm_token'] == fcm_token), None)
    now_iso = datetime.now().isoformat()
    if existing:
        existing['last_used'] = now_iso
        existing['is_active'] = True
        result = 'updated'

    else:
        tokens_data[key].append({
            'fcm_token': fcm_token,
            'created_at': now_iso,
            'last_used': now_iso,
            'is_active': True
        })
        result = 'added'
        
    success = save_user_device_tokens_data(user_id, tokens_data)
    return result if success else 'error'

# -------------------------------
# Endpoints
# -------------------------------
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200

    frappe_status = 'not_available'

    try:
        if frappe_client.get_single_doc('Push Notification Settings'):
            frappe_status = 'api_connected'

    except Exception as e:
        frappe_status = f'api_error: {e}'

    firebase_status = 'initialized' if firebase_app else 'not_available'
    
    return jsonify({
        'frappe_status': frappe_status,
        'firebase_status': firebase_status,
        'initialized': app_initialized,
        'credentials_loaded': bool(CREDENTIALS)
    })

@app.route('/get-config', methods=['GET', 'OPTIONS'])
def get_config():
    if request.method == 'OPTIONS':
        return '', 200

    if not CREDENTIALS.get('firebase_config') or not CREDENTIALS.get('vapid_public_key'):
        return jsonify({'error': 'Firebase config or VAPID key missing'}), 500
        
    return jsonify({
        'vapid_public_key': CREDENTIALS['vapid_public_key'],
        'config': CREDENTIALS['firebase_config'],
        'badge_icon': CREDENTIALS.get('badge_icon')
    })

@app.route('/token/add', methods=['POST', 'OPTIONS'])
def add_token():
    if request.method == 'OPTIONS':
        return '', 200

    project_name = request.args.get('project_name')
    site_name = request.args.get('site_name')
    fcm_token = request.args.get('fcm_token')
    user_id = request.args.get('user_id')

    if not all([project_name, user_id, fcm_token]):
        return jsonify({'exc': {'status_code': 400, 'message': 'Missing required parameters'}}), 400

    auth_header = request.headers.get('Cookie')
    if not auth_header:
        return jsonify({'exc': {'status_code': 401, 'message': 'Cookie header required'}}), 401

    authenticated_user = validate_frappe_auth(auth_header)
    if not authenticated_user:
        return jsonify({'exc': {'status_code': 401, 'message': 'Frappe authentication failed'}}), 401

    result = add_user_device_token(project_name, site_name, user_id, fcm_token)
    if result == 'error':
        return jsonify({'exc': {'status_code': 500, 'message': 'Internal error'}}), 500

    return jsonify({'message': {'success': 200, 'message': f'User Token {result}'}})

@app.route('/send/user', methods=['POST', 'OPTIONS'])
def send_notification_to_user():
    if request.method == 'OPTIONS':
        return '', 200

    project_name = request.args.get('project_name')
    site_name = request.args.get('site_name')
    user_id = request.args.get('user_id')
    title = request.args.get('title')
    body = request.args.get('body')

    if not all([project_name, site_name, user_id, title, body]):
        return jsonify({'exc': {'status_code': 400, 'message': 'Missing required parameters'}}), 400

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'exc': {'status_code': 401, 'message': 'Authorization header required'}}), 401

    authenticated = validate_frappe_auth(auth_header)
    if not authenticated:
        return jsonify({'exc': {'status_code': 401, 'message': 'Frappe authentication failed'}}), 401

    data_param = request.args.get('data', '{}')
    try:
        data = json.loads(data_param)

    except:
        data = {}

    registration_tokens = get_user_device_tokens(project_name, site_name, user_id)
    if not registration_tokens:
        return jsonify({'exc': {'status_code': 404, 'message': f'{user_id} not subscribed to notifications'}}), 404

    try:
        firebase_app = get_firebase_app()
        hardcoded_icon = 'https://badmc.cooltrack.co/public/icons/icon-256x256.png'
        hardcoded_badge = 'https://badmc.cooltrack.co/public/icons/icon-256x256.png'
        message = messaging.MulticastMessage(
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon=hardcoded_icon,
                    badge=hardcoded_badge,
                    tag='cooltrack-notification',
                    require_interaction=True,
                    silent=False,
                    vibrate=[200, 100, 200]
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=data.get('click_action', 'https://badmc.cooltrack.co/')
                ),
                headers={'TTL': '86400', 'Urgency': 'high'}
            ),
            data={
                'click_action': data.get('click_action', 'https://badmc.cooltrack.co/'),
                'icon': hardcoded_icon,
                'badge': hardcoded_badge,
                'timestamp': str(int(time.time() * 1000)),
                'user_id': user_id,
                'project_name': project_name,
                'type': 'cooltrack-notification',
                'tag': 'cooltrack-notification'
            },
            tokens=registration_tokens
        )
        response = messaging.send_each_for_multicast(message, app=firebase_app)
        return jsonify({
            'message': {
                'success': 200,
                'message': f'{response.success_count} notifications sent to {user_id}',
                'success_count': response.success_count,
                'failure_count': response.failure_count
            }
        })
        
    except Exception as e:
        app.logger.error(f'Firebase messaging error: {e}')
        return jsonify({'exc': {'status_code': 500, 'message': f'Firebase error: {str(e)}'}}), 500

# -------------------------------
# Error Handlers
# -------------------------------
@app.errorhandler(404)
def not_found(error):
    return jsonify({'exc': {'status_code': 404, 'message': 'Endpoint not found'}}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Internal server error: {error}')
    return jsonify({'exc': {'status_code': 500, 'message': 'Internal server error'}}), 500

# -------------------------------
# Initialize app at import time
# -------------------------------
try:
    initialize_app()
    app.logger.info(f'Push Notification App initialized: {app_initialized}, Credentials loaded: {bool(CREDENTIALS)}')

except Exception as e:
    app.logger.error(f'Failed to initialize app at startup: {e}')

if __name__ != "__main__":
    gunicorn_logger = logging.getLogger('gunicorn.error')
    for handler in logger.handlers:  # attach handlers to gunicorn logger
        gunicorn_logger.addHandler(handler)

    gunicorn_logger.setLevel(logger.level)