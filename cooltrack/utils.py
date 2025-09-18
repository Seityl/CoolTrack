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

def send_push_notification(user_id, title, body, data=None, click_action=None):
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
        'Sensor Gateway',
        fields=['name', 'last_heartbeat', 'status'],
        filters={
            'last_heartbeat': ['<', threshold_time],
            'status': ['!=', 'Inactive']
        }
    )
    if not sensor_gateways:
        return      

    for gateway in sensor_gateways:
        frappe.db.set_value('Sensor Gateway', gateway.name, 'status', 'Inactive')
        send_disconnection_alert('Sensor Gateway', gateway.name)

        sensors = frappe.get_all('Sensor', {'gateway_id': gateway.name, 'status': ['!=', 'Inactive']})
        if not sensors:
            continue
        
        for sensor in sensors:
            frappe.db.set_value('Sensor', sensor.name, 'status', 'Inactive')
            send_disconnection_alert('Sensor', sensor.name)

        frappe.db.commit()

def check_sensor_heartbeat():
    current_time = now_datetime()
    threshold_time = add_to_date(current_time, hours=-1)
    
    sensors = frappe.get_all(
        'Sensor',
        fields=['name'],
        filters={
            'last_heartbeat': ['<', threshold_time],
            'status': 'Active'
        }
    )
    if not sensors:
        return      
        
    for sensor in sensors:
        frappe.db.set_value('Sensor', sensor.name, 'status', 'Inactive')
        send_disconnection_alert('Sensor', sensor.name)
        frappe.db.commit()

def send_disconnection_alert(doctype, device_id):
    system_managers = get_system_managers()
    if not system_managers:
        return

    base_url = get_base_url()

    # Determine the link based on doctype
    if doctype == 'Sensor':
        link = f'/sensors/{device_id}'
        click_action = f'{base_url}/sensors/{device_id}'

    elif doctype == 'Sensor Gateway':
        link = f'/gateways/{device_id}'
        click_action = f'{base_url}/gateways/{device_id}'

    subject = f'{doctype} Disconnected: {device_id}'
    
    # HTML message for email and system notifications
    message = f"""
        <div>
            <div style="margin: 1rem 0;">
                <p style="margin-bottom: 0.5rem;"><strong>Details:</strong></p>
                <ul style="margin-left: 1.5rem; padding-left: 0.5rem;">
                    <li><strong>Device ID:</strong> 
                        <a href="{link}" 
                        target="_self" 
                        style="color: #dc3545; text-decoration: underline; font-weight: bold;">
                        {device_id}
                        </a>
                    </li>
                    <li><strong>Status:</strong> Inactive</li>
                    <li><strong>Time:</strong> {frappe.utils.now()}</li>
                </ul>
            </div>
        </div>
    """
    
    # Push notification body
    push_body = f'{doctype} {device_id} has disconnected.'
    
    # Push notification data
    push_data = {
        'device_id': device_id,
        'doctype': doctype,
        'status': 'disconnected',
        'timestamp': frappe.utils.now(),
        'priority': 'high'
    }

    frappe.db.savepoint('send_disconnection_alert')

    for manager in system_managers:
        try:
            # Create system notification
            frappe.get_doc({
                'doctype': 'Notification Log',
                'subject': subject,
                'for_user': manager,
                'type': 'Alert',
                'email_content': message,
                'document_type': doctype,
                'document_name': device_id,
            }).insert(ignore_permissions=True)
            
            # Send email notification
            frappe.sendmail(
                recipients=[manager],
                subject=subject,
                message=message,
                as_markdown=False
            )
            
            # Send push notification
            send_push_notification(
                user_id=manager,
                title=subject,
                body=push_body,
                data=push_data,
                click_action=click_action
            )
            
            frappe.db.commit()

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error(frappe.get_traceback(), 'send_disconnection_alert()')
            continue

def send_reconnection_alert(doctype, device_id):
    system_managers = get_system_managers()
    if not system_managers:
        return

    base_url = get_base_url()

    # Determine the link based on doctype
    if doctype == 'Sensor':
        link = f'/sensors/{device_id}'
        click_action = f'{base_url}/sensors/{device_id}'

    elif doctype == 'Sensor Gateway':
        link = f'/gateways/{device_id}'
        click_action = f'{base_url}/gateways/{device_id}'

    subject = f'{doctype} Reconnected: {device_id}'

    # HTML message for email and system notifications
    message = f"""
        <div>
            <div style="margin: 1rem 0;">
                <p style="margin-bottom: 0.5rem;"><strong>Details:</strong></p>
                <ul style="margin-left: 1.5rem; padding-left: 0.5rem;">
                    <li><strong>Device ID:</strong> 
                        <a href="{link}" 
                        target="_self" 
                        style="color: #28a745; text-decoration: underline; font-weight: bold;">
                        {device_id}
                        </a>
                    </li>
                    <li><strong>Status:</strong> Active</li>
                    <li><strong>Time:</strong> {frappe.utils.now()}</li>
                </ul>
            </div>
        </div>
    """

    # Push notification body
    push_body = f'{doctype} {device_id} has reconnected.'

    # Push notification data
    push_data = {
        'device_id': device_id,
        'doctype': doctype,
        'status': 'reconnected',
        'timestamp': frappe.utils.now(),
        'priority': 'high'
    }

    frappe.db.savepoint('send_reconnection_alert')

    for manager in system_managers:
        try:
            notification_exists = frappe.db.exists('Notification Log', {
                'document_type': doctype,
                'document_name': device_id,
                'for_user': manager,
                'type': 'Alert',
                'subject': ['like', f'%{doctype}%Reconnected%{device_id}%'],
                'read': 0  # Only check unread notifications
            })
            
            if notification_exists:
                continue  # Skip this user, they already have an unread notification
            
            # Create system notification
            frappe.get_doc({
                'doctype': 'Notification Log',
                'subject': subject,
                'for_user': manager,
                'type': 'Alert',
                'email_content': message,
                'document_type': doctype,
                'document_name': device_id,
            }).insert(ignore_permissions=True)

            # Send email notification
            frappe.sendmail(
                recipients=[manager],
                subject=subject,
                message=message,
                as_markdown=False
            )

            # Send push notification
            send_push_notification(
                user_id=manager,
                title=subject,
                body=push_body,
                data=push_data,
                click_action=click_action
            )

            frappe.db.commit()

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error(frappe.get_traceback(), 'send_reconnection_alert()')
            continue

def send_temperature_threshold_alert(sensor_id, sensor_name, max_temp, threshold, duration_minutes):
    system_managers = get_system_managers()
    recipients = system_managers
    # recipients = system_managers + ['ste@badmc.org']

    link = f'/sensors/{sensor_id}'
    hours = duration_minutes // 60
    minutes = duration_minutes % 60
    duration_text = f'{hours}h {minutes}m' if hours > 0 else f'{minutes}m'

    subject = f'Temperature Alert: {sensor_name}'

    # HTML message for email and system notifications
    message = f"""
        <div>
            <p><strong style="color: #dc3545;">CRITICAL TEMPERATURE ALERT</strong></p>
            <ul style="margin-left: 1.5rem;">
                <li><strong>Sensor:</strong> <a href="{link}" target="_self" style="color: #dc3545; text-decoration: underline;">{sensor_name}</a></li>
                <li><strong>Max Temperature:</strong> {max_temp}°C</li>
                <li><strong>Threshold:</strong> {threshold}°C</li>
                <li><strong>Duration Above Threshold:</strong> {duration_text}</li>
                <li><strong>Time:</strong> {frappe.utils.now()}</li>
            </ul>
        </div>
    """

    push_body = f'{threshold}°C exceeded for {duration_text}.'
    push_data = {
        'sensor_id': sensor_id,
        'status': 'temperature_threshold_exceeded',
        'max_temp': max_temp,
        'duration_minutes': duration_minutes,
        'timestamp': frappe.utils.now(),
        'priority': 'high'
    }

    # Check if we should send email based on last_email_alert field
    should_send_email = False
    try:
        current_time = frappe.utils.now_datetime()
        last_email_alert = frappe.db.get_value('Sensor', sensor_id, 'last_email_alert')
        
        if not last_email_alert:
            # No previous email alert, send email
            should_send_email = True
            
        else:
            # Check if 20+ minutes have passed since last email alert
            last_email_time = last_email_alert
            if isinstance(last_email_time, str):
                last_email_time = frappe.utils.get_datetime(last_email_time)
            
            time_diff_minutes = (current_time - last_email_time).total_seconds() / 60
            if time_diff_minutes >= 20:
                should_send_email = True
        
        # Update last_email_alert if we're going to send email
        if should_send_email:
            frappe.db.set_value('Sensor', sensor_id, 'last_email_alert', current_time)
            
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'check_email_alert_timing')
        # If there's an error checking the sensor doc, default to not sending email
        should_send_email = False

    frappe.db.savepoint('send_temperature_threshold_alert')

    for recipient in recipients:
        try:
            notification_exists = frappe.db.exists('Notification Log', {
                'document_type': 'Sensor',
                'document_name': sensor_id,
                'type': 'Alert',
                'for_user': recipient,
                'subject': ['like', f'Temperature Alert%{sensor_name}%'],
                'read': 0  # Only check unread notifications
            })
            
            # Create system notification
            frappe.get_doc({
                'doctype': 'Notification Log',
                'subject': subject,
                'for_user': recipient,
                'type': 'Alert',
                'email_content': message,
                'document_type': 'Sensor',
                'document_name': sensor_id,
            }).insert(ignore_permissions=True)

            # Send push notification
            send_push_notification(
                user_id=recipient,
                title=subject,
                body=push_body,
                data=push_data,
                click_action=f'{get_base_url()}{link}'
            )

            # Send email
            if not notification_exists and should_send_email:
                frappe.sendmail(
                    recipients=[recipient],
                    subject=subject,
                    message=message,
                    as_markdown=False
                )

            frappe.db.commit()

        except Exception:
            frappe.db.rollback()
            frappe.log_error(frappe.get_traceback(), 'send_temperature_threshold_alert')
            continue

def check_temperature_threshold_violation(doc, method=None):
    if doc.max_acceptable_temperature == None:
        return
        
    if doc.status != 'Active':
        return

    # Check if alerts are disabled for this time period
    current_time = frappe.utils.now_datetime()
    if doc.alerts_disabled_start and doc.alerts_disabled_end:
        alerts_disabled_start = doc.alerts_disabled_start
        alerts_disabled_end = doc.alerts_disabled_end
        
        # Check if current time is within the disabled period
        if alerts_disabled_start <= current_time <= alerts_disabled_end:
            return

    one_month_ago = add_to_date(now_datetime(), days=-30)

    recent_readings = frappe.get_all(
        'Sensor Read',
        fields=['temperature', 'timestamp'],
        filters={
            'sensor_id': doc.sensor_id,
            'creation': ['>=', one_month_ago]
        },
        order_by='timestamp desc'
    )
    
    if not recent_readings:
        return
    
    valid_readings = []
    for reading in recent_readings:
        try:
            temp_value = float(reading.temperature)

            reading_time = reading.timestamp
            if isinstance(reading_time, str):
                reading_time = frappe.utils.get_datetime(reading_time)

            valid_readings.append({
                'temperature': temp_value,
                'timestamp': reading_time
            })
            
        except (ValueError, TypeError):
            continue
    
    if not valid_readings:
        return
    
    threshold_exceeded_duration = check_threshold_duration(
        valid_readings, 
        doc.max_acceptable_temperature
    )
    
    if is_outside_working_hours(current_time):
        required_duration = doc.threshold_exceeded_duration

    else:
        required_duration = 60  # minutes
    
    if threshold_exceeded_duration >= required_duration:
        send_temperature_threshold_alert(
            doc.sensor_id,
            doc.sensor_name,
            doc.last_temperature,
            doc.max_acceptable_temperature,
            threshold_exceeded_duration
        )

def is_outside_working_hours(timestamp):
    weekday = timestamp.weekday()  # 0=Monday, 6=Sunday
    hour = timestamp.hour
    
    # Weekend (Saturday=5, Sunday=6)
    if weekday >= 5:
        return True
    
    # Weekday outside 8am-5pm (8-17 in 24hr format)
    if hour < 8 or hour >= 17:
        return True
    
    return False

def check_threshold_duration(readings, max_temp):
    if not readings:
        return 0
    
    readings.sort(key=lambda x: x['timestamp'], reverse=True)
    
    last_violation_time = None
    first_violation_time = None
    
    for reading in readings:
        if reading['temperature'] > max_temp:
            if last_violation_time is None:
                last_violation_time = reading['timestamp']
                first_violation_time = reading['timestamp']
                
            else:
                first_violation_time = reading['timestamp']
                
        elif reading['temperature'] <= max_temp:
            # Temperature is within acceptable range, stop counting
            break
    
    if last_violation_time and first_violation_time:
        duration_seconds = (last_violation_time - first_violation_time).total_seconds()
        return duration_seconds / 60  # Convert to minutes

    return 0

def creat_alert_status_log(sensor_id, alerts_enabled):
    frappe.db.savepoint('creat_alert_status_log')
    try:
        user = frappe.session.user
        status = 'Enabled' if alerts_enabled else 'Disabled'
        link = f'/sensors/{sensor_id}'
        html = f"""
            <div>
                <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Field</th>
                        <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Value</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;">Document Type</td>
                        <td style="padding: 8px; border: 1px solid #ccc;">Sensor</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;">Document ID</td>
                        <td style="padding: 8px; border: 1px solid #ccc;">
                            <a href="{link}" style="color: #007bff; text-decoration: none;">
                                {sensor_id}
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;">Alert Status</td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{status}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;">User</td>
                        <td style="padding: 8px; border: 1px solid #ccc;">{user}</td>
                    </tr>
                </table>
            </div>
        """

        frappe.get_doc({
            'doctype': 'Approval Log',
            'data': html
        }).insert(ignore_permissions=True)
        frappe.db.commit()
        
    except Exception as e:
        frappe.log_error(f'Failed to create alert status log for sensor {sensor_id}: {str(e)}', 'Alert Status Log Error')
        frappe.db.rollback()