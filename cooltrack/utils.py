# Copyright (c) 2025, dev@cogentmedia.co and contributors
# For license information, please see license.txt

import os
import re
import json
import frappe
import logging
import requests
from frappe.utils import now_datetime, add_to_date

def load_env_file(logger: logging, filename: str = '.env.encrypted') -> bool:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(script_dir, filename)

    if not os.path.exists(filepath):
        logger.warning('Environment file not found at: %s', filepath)
        return False

    logger.info('Loading environment from: %s', filepath)

    try:
        with open(filepath, 'r') as f:
            loaded_count = 0
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue

                try:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    os.environ[key] = value
                    loaded_count += 1
                    logger.debug('Loaded environment variable: %s', key)

                except ValueError as e:
                    logger.warning('Skipping invalid line: %.50s... Error: %s', line, e)
                    continue

        logger.info('Successfully loaded %d environment variables', loaded_count)
        return True

    except Exception as e:
        logger.error('Failed to load environment file: %s', e)
        return False

def parse_value(value):
    try:
        cleaned_value = re.sub(r"[^\d.-]", "", str(value))
        return round(float(cleaned_value), 2)
    except ValueError:
        return None

def get_settings():
    return frappe.get_cached_doc('Cool Track Settings')

def get_system_managers():
     return frappe.db.sql_list("""
        SELECT DISTINCT parent 
        FROM `tabHas Role` 
        WHERE role = 'System Manager' 
        AND parent != 'Administrator'
        AND parenttype = 'User'
    """)

def get_base_url():
    return frappe.utils.get_url()

def send_push_notification(user_id='jeriel@cogentmedia.co', title='Test', body='test', data=None, click_action=None):
    """Send push notification using jeriel's API credentials"""
    jeriel_user_id = 'jeriel@cogentmedia.co'
    
    try:
        user = frappe.get_doc('User', jeriel_user_id)

        api_key = user.api_key
        api_secret = user.get_password('api_secret')
        
        auth_header = f'token {api_key}:{api_secret}'
        
    except Exception as e:
        frappe.log_error(f'Failed to get API credentials for {jeriel_user_id}: {str(e)}', 'Push Notification Auth Error')
        return False

    notification_data = data or {}
    base_url = get_base_url()

    if click_action:
        notification_data['click_action'] = click_action

    elif not notification_data.get('click_action'):
        notification_data['click_action'] = base_url
    
    url = f'{base_url}/push/send/user'
    
    headers = {
        'Authorization': auth_header,
        'Content-Type': 'application/json'
    }
    
    params = {
        'project_name': 'cooltrack',
        'site_name': 'badmc.cooltrack.co', 
        'user_id': user_id,
        'title': title,
        'body': body,
        'data': json.dumps(notification_data)
    }
    
    try:
        response = requests.post(url, headers=headers, params=params, timeout=30)
        
        if response.status_code == 200:
            return True
            
        else:
            try:
                error_response = response.json()
                error_msg = error_response.get('exc', {}).get('message', 'Unknown error')

            except:
                error_msg = response.text or f'HTTP {response.status_code}'
            
            frappe.log_error(f'Push notification failed: {error_msg}', 'Push Notification Error')
            return False
            
    except requests.exceptions.RequestException as e:
        frappe.log_error(f'Push notification connection error: {str(e)}', 'Push Notification Connection Error')
        return False

    except Exception as e:
        frappe.log_error(f'Push notification unexpected error: {str(e)}', 'Push Notification Unexpected Error')
        return False

def send_approval_notification(doctype, device_id, status):
    if status != 'Pending':
        return
        
    notification_exists = frappe.db.exists('Notification Log', {
        'document_type': doctype,
        'document_name': device_id,
        'type': 'Alert',
        'read': 0  # Only check unread notifications
    })
    if notification_exists:
        return
        
    system_managers = get_system_managers()
    if not system_managers:
        return
        
    if doctype == "Sensor":
        link = f'/sensors/{device_id}'
    elif doctype == "Sensor Gateway":
        link = f'/gateways/{device_id}'

    subject = f"New {doctype.capitalize()} Requires Approval: {device_id}"
    message = f"""
        <div>
            <p>A new <strong>{doctype}</strong> has been added to the system and requires your approval.</p>
            
            <div style="margin: 1rem 0;">
                <p style="margin-bottom: 0.5rem;"><strong>Details:</strong></p>
                <ul style="margin-left: 1.5rem; padding-left: 0.5rem;">
                    <li><strong>ID:</strong> 
                        <a href="{link}" 
                        target="_self" 
                        style="color: #1a73e8; text-decoration: underline; font-weight: bold;">
                        {device_id}
                        </a>
                    </li>
                </ul>
            </div>

            <p>Please review and approve it at your earliest convenience.</p>
        </div>
    """

    frappe.db.savepoint('sp')
    for manager in system_managers:
        try:
            frappe.get_doc({
                'doctype': 'Notification Log',
                'subject': subject,
                'for_user': manager,
                'type': 'Alert',
                'email_content': message,
                'document_type': doctype,
                'document_name': device_id,
            }).insert(ignore_permissions=True)
            frappe.db.commit()

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error(frappe.get_traceback(), 'send_approval_notification()')
            continue
        
def send_system_error_notification(error_message):
    system_managers = get_system_managers()
    if not system_managers:
        return
        
    subject = 'Sensor Data Processing Error'
    message = f"""
        An error occurred while processing sensor data:
        <br><br>
        <pre>{error_message}</pre>
        <br>
        Please check the error log for details.
    """

    frappe.db.savepoint('sp')
    
    for manager in system_managers:
        try:
            frappe.get_doc({
                'doctype': 'Notification Log',
                'subject': subject,
                'for_user': manager,
                'type': 'Alert',
                'email_content': message
            }).insert(ignore_permissions=True)
            frappe.db.commit()

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error(frappe.get_traceback(), 'send_system_error_notification()')
            continue
    
def create_approval_log(doctype, docname, status, automated=False):
    user = frappe.session.user
    if doctype == "Sensor":
        link = f"/sensors/{docname}"
    elif doctype == "Sensor Gateway":
        link = f"/gateways/{docname}"
    html = f"""
    <div>
        <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
            <tr>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Field</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Value</th>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">Document Type</td>
                <td style="padding: 8px; border: 1px solid #ccc;">{doctype}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">Document ID</td>
                <td style="padding: 8px; border: 1px solid #ccc;">
                    <a href="{link}" style="color: #007bff; text-decoration: none;">
                        {docname}
                    </a>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">Status</td>
                <td style="padding: 8px; border: 1px solid #ccc;">{status}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">User</td>
                <td style="padding: 8px; border: 1px solid #ccc;">{user}</td>
            </tr>
            {"<tr><td style='padding:8px; border:1px solid #ccc;'>Automated</td><td style='padding:8px; border:1px solid #ccc;'>Yes</td></tr>" if automated else ""}
        </table>
    </div>
    """

    frappe.get_doc({
        'doctype': 'Approval Log',
        'data': html
    }).insert(ignore_permissions=True)
    frappe.db.commit()

def check_sensor_gateway_heartbeat():
    current_time = now_datetime()
    threshold_time = add_to_date(current_time, hours=-1)
    
    sensor_gateways = frappe.get_all(
        "Sensor Gateway",
        fields=["name", "last_heartbeat", "status"],
        filters={
            "last_heartbeat": ["<", threshold_time],
            "status": ["!=", "Inactive"]
        }
    )
    
    if not sensor_gateways:
        return      

    for gateway in sensor_gateways:
        frappe.db.set_value('Sensor Gateway', gateway.name, 'status', 'Inactive')

        sensors = frappe.get_all('Sensor', {'gateway_id': gateway.name, 'status': ['!=', 'Inactive']})
        if not sensors:
            continue
        
        for sensor in sensors:
            frappe.db.set_value('Sensor', sensor.name, 'status', 'Inactive')

        frappe.db.commit()

def check_sensor_heartbeat():
    current_time = now_datetime()
    threshold_time = add_to_date(current_time, hours=-1)
    
    sensors = frappe.get_all(
        "Sensor",
        fields=["name"],
        filters={
            "last_heartbeat": ["<", threshold_time],
            "status": "Active"
        }
    )
    if not sensors:
        return      
        
    for sensor in sensors:
        frappe.db.set_value('Sensor', sensor.name, 'status', 'Inactive')
        frappe.db.commit()

def test():
    a = frappe.get_all('Notification Log')
    for d in a:
        frappe.delete_doc('Notification Log', d.name)
        frappe.db.commit()