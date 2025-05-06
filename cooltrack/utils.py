# Copyright (c) 2025, dev@cogentmedia.co and contributors
# For license information, please see license.txt

import re
import frappe

def parse_value(value):
    if not value:
        return None
    try:
        cleaned_value = re.sub(r"[^\d.-]", "", str(value))
        return float(cleaned_value)
    except ValueError:
        return None

def get_settings():
    return frappe.get_cached_doc('Cool Track Settings')

def get_system_managers():
    return frappe.db.sql_list(
        """
        SELECT name
        FROM `tabUser` u
        WHERE EXISTS (
            SELECT 1
            FROM `tabHas Role`
            WHERE role = 'System Manager'
            AND parent = u.name
        )
        """
    )

def send_approval_notification(doctype, device_id, status):
    try:
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
            
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'send_approval_notification()')
        
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

def test():
    docs = frappe.db.get_all('Notification Log', pluck='name')
    for name in docs:
        frappe.delete_doc('Notification Log', name, force=True)