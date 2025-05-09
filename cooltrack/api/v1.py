import frappe
from frappe import _
from frappe.utils import now_datetime

from cooltrack.utils import get_settings, parse_value, send_system_error_notification

@frappe.whitelist(allow_guest=True)
def get_api_url():
    settings = get_settings()
    if not settings or not settings.api_url:
        frappe.response['http_status_code'] = 400
        return frappe._dict({'error': 'API URL not configured'})
    return frappe._dict({'api_url': settings.api_url})

@frappe.whitelist(allow_guest=True)
def receive_sensor_data(**kwargs):
    settings = get_settings()

    try:
        form_data = frappe.local.form_dict

        if not form_data:
            frappe.local.response['http_status_code'] = 400
            return frappe._dict({'error': 'No form data received'})

        gateway_id = form_data.get('GW_ID')
        sensor_id = form_data.get('ID')
        sensor_type_name = form_data.get('TYPE')

        gateway_approval_status = 'Pending' if settings.require_gateway_approval else 'Approved'
        sensor_approval_status = 'Pending' if settings.require_sensor_approval else 'Approved'

        gateway_name = frappe.db.get_value('Sensor Gateway', {'gateway_id': gateway_id})
        if gateway_name:
            gateway_doc = frappe.get_doc('Sensor Gateway', gateway_name)
            gateway_doc.save(ignore_permissions=True)
        else:
            gateway_doc = frappe.new_doc('Sensor Gateway')
            gateway_doc.gateway_id = gateway_id
            gateway_doc.approval_status = gateway_approval_status
            gateway_doc.insert(ignore_permissions=True)

        frappe.db.commit()

        gateway_doc.run_method('before_save')
        frappe.db.commit()
        
        if gateway_doc.approval_status != 'Approved':
            frappe.local.response['http_status_code'] = 403
            return frappe._dict({'error': 'Gateway not approved'})

        # Ensure Sensor Type exists
        if sensor_type_name and not frappe.db.exists('Sensor Type', sensor_type_name):
            sensor_type = frappe.new_doc('Sensor Type')
            sensor_type.name = sensor_type_name
            sensor_type.type_name = sensor_type_name
            sensor_type.insert(ignore_permissions=True)
            frappe.db.commit()

        sensor_name = frappe.db.get_value('Sensor', {'sensor_id': sensor_id})
        if sensor_name:
            sensor_doc = frappe.get_doc('Sensor', sensor_name)
            sensor_doc.last_temperature = parse_value(form_data.get('T'))
            sensor_doc.save(ignore_permissions=True)
        else:
            sensor_doc = frappe.new_doc('Sensor')
            sensor_doc.sensor_id = sensor_id
            sensor_doc.sensor_type = sensor_type_name
            sensor_doc.gateway_id = gateway_id
            sensor_doc.approval_status = sensor_approval_status
            sensor_doc.last_temperature = parse_value(form_data.get('T'))
            sensor_doc.insert(ignore_permissions=True)

        frappe.db.commit()

        sensor_doc.run_method("before_save")
        frappe.db.commit()

        if sensor_doc.approval_status != 'Approved':
            frappe.local.response['http_status_code'] = 403
            return frappe._dict({'error': 'Sensor not approved'})

        # Process Sensor Reading
        reading = frappe.new_doc('Sensor Read')
        reading.update({
            'sensor_id': sensor_id,
            'sensor_type': sensor_type_name,
            'temperature': parse_value(form_data.get('T')),
            'humidity': parse_value(form_data.get('H')),
            'voltage': parse_value(form_data.get('V')),
            'signal_strength': parse_value(form_data.get('RSSI')),
            'sensor_rssi': parse_value(form_data.get('T_RSSI')),
            'sequence_number': form_data.get('SN'),
            'gateway_id': gateway_id,
            'coordinates': f"{form_data.get('E')},{form_data.get('N')}" if form_data.get('E') and form_data.get('N') else None,
            'timestamp': form_data.get('Time') or now_datetime()
        })
        reading.insert(ignore_permissions=True)
        frappe.db.commit()

        return frappe._dict({'message': 'Data received successfully'})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'receive_sensor_data()')
        send_system_error_notification(str(e))
        frappe.local.response['http_status_code'] = 500
        return {'error': str(e)}
        
@frappe.whitelist()
def get_notifications(user_email:str=None):
    if not user_email:
        user_email = frappe.session.user
    if not frappe.db.exists('User', user_email):
        frappe.throw(_(f'User {user_email} not found'))
    notifications = frappe.db.get_all(
        'Notification Log',
        filters={
            'for_user': user_email,
            'read': 0
        },
        fields=['name', 'subject', 'email_content as message', 'creation as created_on'],
        order_by='creation desc'
    )
    return notifications

@frappe.whitelist()
def update_notification(notification: str):
    if not frappe.db.exists('Notification Log', notification):
        frappe.throw(_(f'Notification {notification} not found'))
    notification = frappe.get_doc('Notification Log', notification)
    notification.read = 1
    notification.save(ignore_permissions=True)