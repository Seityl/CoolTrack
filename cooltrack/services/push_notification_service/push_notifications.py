import os
import json
import time
import logging
import requests
import urllib.parse
from datetime import datetime
from cryptography.fernet import Fernet

from flask_cors import CORS
from flask import Flask, request, jsonify

import firebase_admin
from firebase_admin import credentials, messaging

def load_env_file(filename='.env.encrypted'):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(script_dir, filename)
    
    if not os.path.exists(filepath):
        print(f'Environment file not found at: {filepath}')
        return False
    
    print(f'Loading environment from: {filepath}')
    
    try:
        with open(filepath, 'r') as f:
            loaded_count = 0
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    try:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        
                        # Remove quotes if present
                        if (value.startswith('"') and value.endswith('"')) or \
                           (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        
                        # Handle multiline values
                        if key == 'FIREBASE_CONFIG' and value.startswith('{'):
                            # Read until we have a complete JSON
                            json_lines = [value]
                            if not value.rstrip().endswith('}'):
                                for next_line in f:
                                    json_lines.append(next_line.strip())
                                    if next_line.strip().endswith('}'):
                                        break
                                value = '\n'.join(json_lines)
                        
                        os.environ[key] = value
                        loaded_count += 1
                        print(f'Loaded: {key}')
                        
                    except ValueError as e:
                        print(f'Skipping invalid line: {line[:50]}... Error: {e}')
                        continue
        
        print(f'Successfully loaded {loaded_count} environment variables')
        return True
        
    except Exception as e:
        print(f'Failed to load environment file: {e}')
        return False

if load_env_file():
    print('Environment variables loaded successfully')
    
    # Show what was loaded
    encryption_key = os.getenv('CONFIG_ENCRYPTION_KEY')
    if encryption_key:
        print(f'Encryption enabled: {encryption_key[:10]}...')
    
    frappe_site = os.getenv('FRAPPE_SITE')
    if frappe_site:
        print(f'Frappe site: {frappe_site}')
    
    # Count encrypted credentials
    encrypted_count = sum([
        bool(os.getenv('ENCRYPTED_FRAPPE_API_KEY')),
        bool(os.getenv('ENCRYPTED_FRAPPE_API_SECRET'))
    ])

    print(f'Encrypted credentials: {encrypted_count}/2')

# Initialize Flask app
app = Flask(__name__)

# Enable CORS
CORS(
    app, 
    origins=['*'], 
    allow_headers=['Content-Type', 'Authorization'], 
    methods=['GET', 'POST', 'OPTIONS'],
    supports_credentials=True
)

# Globals
firebase_app = None
CREDENTIALS = {}
app_initialized = False

class FrappeAPIClient:
    def __init__(self):
        self.logger = app.logger
        self.encryption_key = os.getenv('CONFIG_ENCRYPTION_KEY')
        try:
            self.cipher = Fernet(self.encryption_key.encode())
            self.logger.info('Encryption cipher initialized successfully')

        except Exception as e:
            self.logger.error(f'Failed to initialize cipher: {e}')
            self.cipher = None

        self.get_credentials()
        
        self.site_url = os.getenv('FRAPPE_SITE').rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })

        if self.api_key and self.api_secret:
            self.session.headers.update({
                'Authorization': f'token {self.api_key}:{self.api_secret}'
            })

    def get_credentials(self):
        encrypted_api_key = os.getenv('ENCRYPTED_FRAPPE_API_KEY')
        encrypted_api_secret = os.getenv('ENCRYPTED_FRAPPE_API_SECRET')

        if encrypted_api_key and self.cipher:
            try:
                self.api_key = self.decrypt_credential(encrypted_api_key)
                self.logger.debug('API key loaded from encrypted environment variable')

            except Exception as e:
                self.logger.error(f'Failed to decrypt API key: {e}')
        
        if encrypted_api_secret and self.cipher:
            try:
                self.api_secret = self.decrypt_credential(encrypted_api_secret)
                self.logger.debug('API secret loaded from encrypted environment variable')

            except Exception as e:
                self.logger.error(f'Failed to decrypt API secret: {e}')

    def decrypt_credential(self, encrypted_data):
        if not self.cipher:
            return encrypted_data  # Return as-is if no encryption
        
        try:
            decrypted = self.cipher.decrypt(encrypted_data.encode())
            return decrypted.decode()

        except Exception as e:
            self.logger.error(f'Failed to decrypt credential: {e}')
            raise Exception('Credential decryption failed')

    def get_logged_user(self, auth_header=None, session_cookie=None):
        url = f'{self.site_url}/api/method/frappe.auth.get_logged_user'
        headers = {}
        cookies = {}
        
        if auth_header:
            headers['Authorization'] = auth_header
        if session_cookie:
            cookies['sid'] = session_cookie
            
        response = self.session.get(url, headers=headers, cookies=cookies, timeout=10)
        if response.status_code == 200:
            return response.json().get('message')
        return None
    
    def get_single_doc(self, doctype):
        url = f'{self.site_url}/api/resource/{doctype}/{doctype}'
        response = self.session.get(url)
        if response.status_code == 200:
            data = response.json().get('data', [])
            return data if data else None
        return None
    
    def get_doc(self, doctype, name):
        encoded_name = urllib.parse.quote(name, safe='')
        url = f'{self.site_url}/api/resource/{doctype}/{encoded_name}'
        response = self.session.get(url)
        if response.status_code == 200:
            return response.json().get('data')
        return None
    
    def update_doc(self, doctype, name, data):
        encoded_name = urllib.parse.quote(name, safe='')
        url = f'{self.site_url}/api/resource/{doctype}/{encoded_name}'
        response = self.session.put(url, json=data)
        return response.status_code == 200
    
    def check_user_exists(self, user_id):
        try:
            user_doc = self.get_doc('User', user_id)
            return user_doc is not None
        except:
            return False

def get_firebase_app():
    global firebase_app
    if firebase_app is None:
        try:
            service_account_data = None
            
            if CREDENTIALS.get('firebase_service_account_key'):
                service_account_data = CREDENTIALS['firebase_service_account_key']
                app.logger.info('Firebase config loaded')
            
            if not service_account_data:
                app.logger.error('No Firebase credentials available')
                raise Exception('No Firebase credentials available')
            
            # Initialize Firebase
            cred = credentials.Certificate(service_account_data)
            firebase_app = firebase_admin.initialize_app(cred)
            app.logger.info('Firebase initialized successfully')
                
        except Exception as e:
            app.logger.error(f'Firebase initialization failed: {e}')
            raise e
    
    return firebase_app

def get_credentials():
    frappe_client = FrappeAPIClient()

    # Validate we have minimum required credentials
    if frappe_client.api_key and frappe_client.api_secret:
        app.logger.info('Frappe credentials loaded successfully')
        
        try:
            settings = frappe_client.get_single_doc('Push Notification Settings')
            if settings:
                app.logger.info('Successfully fetched settings from Frappe')
                
                creds = {
                    'api_key': frappe_client.api_key,
                    'api_secret': frappe_client.api_secret,
                    'badge_icon': settings.get('badge_icon'),
                    'vapid_public_key': settings.get('vapid_public_key'),
                    'firebase_config': json.loads(settings.get('firebase_config')),
                    'firebase_service_account_key': json.loads(settings.get('firebase_service_account_key'))
                }
                
                app.logger.info('Credentials successfully combined from Frappe')

                return creds

        except Exception as e:
            app.logger.warning(f'Failed to fetch from Frappe: {e}')

    else:
        app.logger.warning('Frappe credentials found')
            
def initialize_app():
    global CREDENTIALS, app_initialized
    
    if app_initialized:
        return
    
    try:
        CREDENTIALS = get_credentials()
        app.logger.info('Credentials loaded successfully')
        
        # Initialize Firebase
        try:
            get_firebase_app()
            app.logger.info('Firebase initialized successfully')

        except Exception as e:
            app.logger.warning(f'Firebase initialization failed: {e}')
            
        app_initialized = True
        
    except Exception as e:
        app.logger.error(f'App initialization failed: {e}')
        app_initialized = False

def ensure_initialized():
    if not app_initialized:
        initialize_app()

def validate_frappe_auth(auth_header):
    try:
        app.logger.info(f"Attempting auth validation")
        app.logger.info(f"Auth header type: {auth_header.split(' ')[0] if ' ' in auth_header else 'direct'}")
        
        frappe_client = FrappeAPIClient()
        
        if auth_header.startswith('token '):
            return frappe_client.get_logged_user(auth_header=auth_header)

        else: # Session Cookie
            return frappe_client.get_logged_user(session_cookie=auth_header)
            
    except Exception as e:
        app.logger.error(f"Exception in auth validation: {str(e)}")
        import traceback
        app.logger.error(f"Full traceback: {traceback.format_exc()}")
        return None

def get_user_device_tokens_data(user_id):
    try:
        frappe_client = FrappeAPIClient()
        
        if not frappe_client.check_user_exists(user_id):
            app.logger.warning(f'User {user_id} does not exist')
            return {}
        
        user_doc = frappe_client.get_doc('User', user_id)
        if not user_doc:
            return {}
        
        tokens_json = user_doc.get('device_tokens_json')
        if not tokens_json:
            return {}
        
        return json.loads(tokens_json)
        
    except Exception as e:
        app.logger.error(f'Error getting device tokens data for {user_id}: {e}')

def save_user_device_tokens_data(user_id, tokens_data):
    try:
        frappe_client = FrappeAPIClient()
        
        if not frappe_client.check_user_exists(user_id):
            app.logger.warning(f'User {user_id} does not exist')
            return False
        
        update_data = {
            'device_tokens_json': json.dumps(tokens_data, default=str)
        }
        
        success = frappe_client.update_doc('User', user_id, update_data)
        if success:
            app.logger.info(f'Device tokens saved for user {user_id}')
            return True

        else:
            app.logger.error(f'Failed to update user document for {user_id}')
            return False
            
    except Exception as e:
        app.logger.error(f'Error saving device tokens data for {user_id}: {e}')
        return True

def get_user_device_tokens(project_name, site_name, user_id):
    try:
        key = f'{project_name}_{site_name}'
        tokens_data = get_user_device_tokens_data(user_id)

        if key not in tokens_data:
            return []
        
        active_tokens = []
        for token_info in tokens_data[key]:
            if token_info.get('is_active', True):
                active_tokens.append(token_info['fcm_token'])
        
        return active_tokens

    except Exception as e:
        app.logger.error(f'Error getting device tokens for {user_id}: {e}')
        return []

def add_user_device_token(project_name, site_name, user_id, fcm_token):
    try:
        tokens_data = get_user_device_tokens_data(user_id)
        key = f'{project_name}_{site_name}'
        
        if key not in tokens_data:
            tokens_data[key] = []
        
        # Check if token already exists
        existing_token = None
        for token_info in tokens_data[key]:
            if token_info['fcm_token'] == fcm_token:
                existing_token = token_info
                break
        
        current_time = datetime.now().isoformat()
        
        if existing_token:
            existing_token['last_used'] = current_time
            existing_token['is_active'] = True
            result = 'updated'

        else:
            # Add new token
            new_token = {
                'fcm_token': fcm_token,
                'created_at': current_time,
                'last_used': current_time,
                'is_active': True
            }
            tokens_data[key].append(new_token)
            result = 'added'
        
        if save_user_device_tokens_data(user_id, tokens_data):
            app.logger.info(f'Token {result} for user {user_id}')
            return result

        else:
            return 'error'
            
    except Exception as e:
        app.logger.error(f'Error adding device token for {user_id}: {e}')
        return 'error'

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
        
    ensure_initialized()
    
    # Check Frappe API connection
    frappe_status = 'not_available'
    site_name = os.getenv('FRAPPE_SITE')
    
    try:
        frappe_client = FrappeAPIClient()
        test_result = frappe_client.get_single_doc('Push Notification Settings')
        if test_result is not None:
            frappe_status = 'api_connected'
        else:
            frappe_status = 'api_query_failed'

    except Exception as e:
        frappe_status = f'api_error: {str(e)}'
    
    # Check Firebase status
    firebase_status = 'not_available'
    try:
        firebase_app = get_firebase_app()
        if firebase_app:
            firebase_status = 'initialized'

    except Exception as e:
        firebase_status = f'error: {str(e)}'
    
    # Security status summary
    encryption_enabled = bool(os.getenv('CONFIG_ENCRYPTION_KEY'))
    encrypted_creds = sum([
        bool(os.getenv('ENCRYPTED_FRAPPE_API_KEY')),
        bool(os.getenv('ENCRYPTED_FRAPPE_API_SECRET'))
    ])
    
    return jsonify({
        'status': 'healthy', 
        'message': 'Push notification relay is running',
        'frappe_mode': 'api_calls',
        'frappe_status': frappe_status,
        'site_name': site_name,
        'firebase_status': firebase_status,
        'initialized': app_initialized,
        'credentials_loaded': bool(CREDENTIALS),
        'security': {
            'encryption_enabled': encryption_enabled,
            'encrypted_credentials_count': encrypted_creds
        }
    })

@app.route('/security-status', methods=['GET', 'OPTIONS'])
def security_status():
    if request.method == 'OPTIONS':
        return '', 200
        
    ensure_initialized()
    
    status = {
        'encryption_enabled': bool(os.getenv('CONFIG_ENCRYPTION_KEY')),
        'secure_credentials': {
            'api_key_encrypted': bool(os.getenv('ENCRYPTED_FRAPPE_API_KEY')),
            'api_secret_encrypted': bool(os.getenv('ENCRYPTED_FRAPPE_API_SECRET'))
        },
        'credentials_loaded': bool(CREDENTIALS),
        'firebase_initialized': firebase_app is not None,
        'app_initialized': app_initialized
    }
    
    # Calculate security score
    security_score = 0
    if status['encryption_enabled']:
        security_score += 30
    
    encrypted_count = sum(status['secure_credentials'].values())
    security_score += (encrypted_count * 30)  # Up to 60 points for 2 encrypted creds
    
    if status['credentials_loaded'] and status['firebase_initialized']:
        security_score += 10
    
    status['security_score'] = min(security_score, 100)
    
    if security_score >= 90:
        status['security_level'] = 'Excellent'
    elif security_score >= 70:
        status['security_level'] = 'Good'
    elif security_score >= 50:
        status['security_level'] = 'Fair'
    else:
        status['security_level'] = 'Poor'
    
    return jsonify(status)

@app.route('/get_config', methods=['GET', 'OPTIONS'])
def get_config():
    if request.method == 'OPTIONS':
        return '', 200
    
    ensure_initialized()
    
    # Validate that we have the required config
    if not CREDENTIALS.get('firebase_config'):
        app.logger.error('No Firebase config available')
        return jsonify({'error': 'Firebase config not available'}), 500
    
    if not CREDENTIALS.get('vapid_public_key'):
        app.logger.error('No VAPID public key available')
        return jsonify({'error': 'VAPID public key not available'}), 500
    
    config_response = {
        'vapid_public_key': CREDENTIALS.get('vapid_public_key'),
        'config': CREDENTIALS.get('firebase_config'),
        'badge_icon': CREDENTIALS.get('badge_icon')
    }
    
    app.logger.info(f"Returning config: vapid_key_present={bool(config_response['vapid_public_key'])}, firebase_config_present={bool(config_response['config'])}")
    
    return jsonify(config_response)

@app.route('/token/add', methods=['POST', 'OPTIONS'])
def add_token():
    if request.method == 'OPTIONS':
        return '', 200
    
    ensure_initialized()
    
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
    
    # if authenticated_user != user_id:
    #     app.logger.warning(f'User mismatch: authenticated={authenticated_user}, requested={user_id}')
    #     return jsonify({'exc': {'status_code': 403, 'message': 'User mismatch'}}), 403
    
    app.logger.debug(f'Add Token Request - Project: {project_name}, Site Name: {site_name}, User: {user_id}')
    
    result = add_user_device_token(project_name, site_name, user_id, fcm_token)
    
    if result == 'user_not_found':
        return jsonify({'exc': {'status_code': 404, 'message': 'User not found'}}), 404
    elif result == 'error':
        return jsonify({'exc': {'status_code': 500, 'message': 'Internal error'}}), 500
    elif result == 'updated':
        return jsonify({'message': {'success': 200, 'message': 'User Token updated'}})
    else:  # added
        return jsonify({'message': {'success': 200, 'message': 'User Token added'}})

@app.route('/send/user', methods=['POST', 'OPTIONS'])
def send_notification_to_user():
    if request.method == 'OPTIONS':
        return '', 200
    
    ensure_initialized()
    
    project_name = request.args.get('project_name')
    site_name = request.args.get('site_name')
    user_id = request.args.get('user_id')
    title = request.args.get('title')
    body = request.args.get('body')
    
    if not all([project_name, user_id, title, body]):
        return jsonify({'exc': {'status_code': 400, 'message': 'Missing required parameters'}}), 400
    
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'exc': {'status_code': 401, 'message': 'Authorization header required'}}), 401
    
    authenticated = validate_frappe_auth(auth_header)
    
    if not authenticated:
        return jsonify({'exc': {'status_code': 401, 'message': 'Frappe authentication required'}}), 401
    
    # Parse additional data
    data_param = request.args.get('data', '{}')
    try:
        data = json.loads(data_param)

    except json.JSONDecodeError as e:
        app.logger.error(f'Invalid JSON data: {data_param}, Error: {e}')
        data = {}
    
    app.logger.debug(f'User Notification Request - User: {user_id}, Title: {title}')
    
    # Get tokens from user document via API
    registration_tokens = get_user_device_tokens(project_name, site_name, user_id)
    
    if not registration_tokens:
        app.logger.info(f'No active tokens found for user {user_id}')
        return jsonify({'exc': {'status_code': 404, 'message': f'{user_id} not subscribed to push notifications'}}), 404
    
    # Create Firebase message
    try:
        # Get Firebase app
        firebase_app = get_firebase_app()
        
        # HARDCODED ICON URLs FOR TESTING
        hardcoded_icon = 'https://badmc.cooltrack.co/public/icons/badge-72x72.png'
        hardcoded_badge = 'https://badmc.cooltrack.co/public/icons/badge-72x72.png'
        
        app.logger.info(f'Using hardcoded icon: {hardcoded_icon}')
        app.logger.info(f'Using hardcoded badge: {hardcoded_badge}')
        
        # Web push message with hardcoded icons
        message = messaging.MulticastMessage(
            # Only use webpush for web notifications
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,
                    icon=None,     # HARDCODED
                    badge=None,   # HARDCODED
                    tag=data.get('tag', 'test-notification'),
                    require_interaction=data.get('require_interaction', False),
                    silent=data.get('silent', False)
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=data.get('click_action', 'https://badmc.cooltrack.co/')
                ),
                headers={
                    'TTL': '86400',
                    'Urgency': data.get('urgency', 'normal')
                }
            ),
            
            # Data that goes to service worker
            data={
                'click_action': data.get('click_action', 'https://badmc.cooltrack.co/'),
                'icon': 'https://badmc.cooltrack.co/public/icons/icon-256x256.png',     # HARDCODED
                'badge': 'https://badmc.cooltrack.co/public/icons/icon-256x256.png',   # HARDCODED
                'timestamp': str(int(time.time() * 1000)),
                'user_id': user_id,
                'project_name': project_name,
                'type': data.get('type', 'test_notification'),
                'tag': data.get('tag', 'test-notification')
            },
            
            tokens=registration_tokens
        )
        
        response = messaging.send_each_for_multicast(message, app=firebase_app)
        app.logger.info(f'Successfully sent {response.success_count} notifications to {user_id}')
        
        # Log any failures
        if response.failure_count > 0:
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    app.logger.warning(f'Failed to send to token {idx}: {resp.exception}')
        
        return jsonify({
            'message': {
                'success': 200, 
                'message': f'{response.success_count} Notification sent to {user_id}',
                'success_count': response.success_count,
                'failure_count': response.failure_count,
                'hardcoded_icon': hardcoded_icon,
                'hardcoded_badge': hardcoded_badge,
                'note': 'Using hardcoded icon URLs for testing'
            }
        })
        
    except Exception as e:
        app.logger.error(f'Firebase messaging error: {e}')
        return jsonify({'exc': {'status_code': 500, 'message': f'Firebase error: {str(e)}'}}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'exc': {'status_code': 404, 'message': 'Endpoint not found'}}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Internal server error: {error}')
    return jsonify({'exc': {'status_code': 500, 'message': 'Internal server error'}}), 500

if __name__ == '__main__':
    print('\nStarting Push Notification Relay Server...')

    print('Initializing app...')
    initialize_app()
    
    # Show final security status
    encryption_key = os.getenv('CONFIG_ENCRYPTION_KEY')
    if encryption_key:
        print('Encryption enabled')
        encrypted_count = sum([
            bool(os.getenv('ENCRYPTED_FRAPPE_API_KEY')),
            bool(os.getenv('ENCRYPTED_FRAPPE_API_SECRET'))
        ])
        print(f'{encrypted_count}/2 credentials encrypted')
        
    else:
        print('Encryption not enabled')
    
    print('\nAvailable Endpoints:')
    print('Health check: http://localhost:5000/health')
    print('Security status: http://localhost:5000/security-status')
    print('Get Firebase Config: http://localhost:5000/push/get_config')
    print('Add Token To User: http://localhost:5000/token/add')
    print('Send Notification To User: http://localhost:5000/send/user')
    
    print('\nQuick Test Commands:')
    print('curl http://localhost:5000/health')
    print('curl http://localhost:5000/security-status')
    
    app.run(host='0.0.0.0', port=5000, debug=True)

else:
    # Production server
    try:
        # Setup logging
        gunicorn_logger = logging.getLogger('gunicorn.error')
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)

    except Exception as e:
        logging.basicConfig(level=logging.INFO)
        app.logger.info('Using fallback logging configuration')
    
    initialize_app()