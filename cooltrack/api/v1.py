import frappe
from frappe import _
from frappe.utils import now_datetime

from cooltrack.utils import get_settings, parse_value, send_approval_notification, send_system_error_notification

@frappe.whitelist(allow_guest=True)
def get_api_url():
    settings = get_settings()
    if not settings or not settings.api_url:
        frappe.response['http_status_code'] = 400
        return {'error': 'API URL not configured'}
    return {'api_url': settings.api_url}

@frappe.whitelist(allow_guest=True)
def receive_sensor_data(**kwargs):
    settings = get_settings()
    try:
        form_data = frappe.local.form_dict

        if not form_data:
            frappe.log_error('No form data received', 'receive_sensor_data()')
            frappe.response['http_status_code'] = 400
            return {'error': 'No form data received'}

        # Gateway approval check
        if settings.require_gateway_approval:
            gateway = frappe.db.get_value('Sensor Gateway', 
                form_data.get('GW_ID'), 
                ['name', 'approval_status', 'owner'], 
                as_dict=True
            )
            
            if not gateway:
                gateway = frappe.new_doc('Sensor Gateway')
                gateway.update({
                    'name': form_data.get('GW_ID'),
                    'approval_status': 'Pending'
                })
                gateway.insert(ignore_permissions=True)
                
                # Send notification only for new pending gateways
                if settings.require_gateway_approval and settings.send_approval_notifications:
                    send_approval_notification(
                        "gateway", 
                        form_data.get('GW_ID'), 
                        "Pending",
                        gateway.owner or frappe.session.user
                    )
                
                frappe.response['http_status_code'] = 403
                return {
                    'error': 'Gateway not approved',
                }
            
            elif gateway.approval_status != 'Approved':
                frappe.response['http_status_code'] = 403
                return {
                    'error': 'Gateway not approved',
                    'status': gateway.approval_status
                }

        # Sensor approval check
        if settings.require_sensor_approval:
            sensor = frappe.db.get_value('Sensor',
                form_data.get('ID'),
                ['name', 'approval_status', 'owner'],
                as_dict=True
            )
            
            if not sensor:
                sensor = frappe.new_doc('Sensor')
                sensor.update({
                    'gateway_id': form_data.get('GW_ID'),
                    'sensor_type': form_data.get('TYPE'),
                    'sensor_id': form_data.get('ID'),
                    'name': form_data.get('ID'),
                    'approval_status': 'Pending'
                })
                sensor.insert(ignore_permissions=True)
                
                # Send notification only for new pending sensors
                if settings.require_sensor_approval and settings.send_approval_notifications:
                    send_approval_notification(
                        "sensor", 
                        form_data.get('ID'), 
                        "Pending",
                        sensor.owner or frappe.session.user
                    )
                
                frappe.response['http_status_code'] = 403
                return {
                    'error': 'Sensor not approved',
                }
            
            elif sensor.approval_status != 'Approved':
                frappe.response['http_status_code'] = 403
                return {
                    'error': 'Sensor not approved',
                    'status': sensor.approval_status
                }

        # Process sensor data
        temperature = parse_value(form_data.get('T'))
        humidity = parse_value(form_data.get('H'))
        voltage = parse_value(form_data.get('V'))
        rssi = parse_value(form_data.get('RSSI'))

        if not frappe.db.exists('Sensor Type', form_data.get('TYPE')):
            sensor_type = frappe.new_doc('Sensor Type')
            sensor_type.update({
                'name': form_data.get('TYPE'),
                'type_name': form_data.get('TYPE')
            })
            sensor_type.insert(ignore_permissions=True)

        reading = frappe.new_doc('Sensor Read')
        reading.update({
            'sensor_id': form_data.get('ID'),
            'sensor_type': form_data.get('TYPE'),
            'temperature': temperature,
            'humidity': humidity,
            'voltage': voltage,
            'signal_strength': rssi,
            'sequence_number': form_data.get('SN'),
            'gateway_id': form_data.get('GW_ID'),
            'sensor_rssi': parse_value(form_data.get('T_RSSI')),
            'coordinates': f"{form_data.get('E')},{form_data.get('N')}",
            'timestamp': form_data.get('Time', now_datetime())
        })
        reading.insert(ignore_permissions=True)

        return {'message': 'Data received successfully'}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'receive_sensor_data()')
        
        # Send error notification to admins
        if settings.send_approval_notifications:
            send_system_error_notification(str(e))
            
        frappe.response['http_status_code'] = 500
        return {
            'error': str(e)
        }

@frappe.whitelist()
def get_notifications(user_email: str = None):
    if not user_email:
        user_email = frappe.session.user

    if not frappe.db.exists('User', user_email):
        frappe.throw(_('User not found'))

    # Fetch only unread notifications
    notifications = frappe.get_all(
        'Notification Log',
        filters={
            'for_user': user_email,
            'read': 0
        },
        fields=['name','subject', 'email_content as message', 'creation as created_on'],
        order_by='creation desc',
        limit_page_length=50
    )

    return notifications

@frappe.whitelist()
def update_notification(notification: str):
    if not frappe.db.exists('Notification Log', notification):
        frappe.throw(_(f'Notification {notification} not found'))

    notification = frappe.get_doc('Notification Log', notification)
    notification.read = 1
    notification.save(ignore_permissions=True)