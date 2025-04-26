# Copyright (c) 2025, dev@cogentmedia.co and contributors
# For license information, please see license.txt

import re

import frappe
from frappe.utils import get_link_to_form, now_datetime, format_datetime

def parse_value(value):
    if not value:
        return None
    try:
        # Remove non-numeric characters (keep digits, minus, and decimal point)
        return float(re.sub(r"[^\d.-]", "", value))
    except ValueError:
        return None

def get_settings():
    return frappe.get_cached_doc('Cool Track Settings')

def send_approval_notification(device_type, device_id, owner, status):
    try:
        if status != "Pending":
            return
            
        # notification_exists = frappe.db.exists("Notification Log", {
        #     "document_type": "Sensor Gateway" if device_type == "gateway" else "Sensor",
        #     "document_name": device_id,
        #     "email_content": message,
        #     "subject": subject,
        #     "type": "Alert",
        #     "read": 0  # Only check unread notifications
        # })
        
        # if notification_exists:
        #     return
            
        system_managers = frappe.db.sql_list("""
            SELECT name
            FROM `tabUser`
            WHERE name != 'Administrator'
            AND EXISTS (
                SELECT 1
                FROM `tabHas Role`
                WHERE role = 'System Manager'
                AND parent = `tabUser`.name
            )
        """)
        
        if not system_managers:
            return
            
        doc_link = get_link_to_form(
            "Sensor Gateway" if device_type == "gateway" else "Sensor", 
            device_id
        )
        
        subject = f"New {device_type.capitalize()} Requires Approval: {device_id}"
        message = f"""
            <p>A new <strong>{device_type}</strong> has been created and requires your approval.</p>
            <p><strong>Details:</strong></p>
            <ul style="margin-left: 1rem;">
                <li><strong>ID:</strong> {doc_link}</li>
            </ul>
            <p>Please review and approve it at your earliest convenience.</p>
        """
        
        for manager in system_managers:
            try:
                frappe.get_doc({
                    "doctype": "Notification Log",
                    "subject": subject,
                    "for_user": manager,
                    "type": "Alert",
                    "email_content": message,
                    "document_type": "Sensor Gateway" if device_type == "gateway" else "Sensor",
                    "document_name": device_id,
                }).insert(ignore_permissions=True)
                frappe.db.commit()
            except Exception as e:
                frappe.log_error(frappe.get_traceback(), 'send_approval_notification()')
                continue
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'send_approval_notification()')
        
def send_system_error_notification(error_message):
    system_managers = frappe.db.sql_list("""
        SELECT name
        FROM `tabUser`
        WHERE name != 'Administrator'
        AND EXISTS (
            SELECT 1
            FROM `tabHas Role`
            WHERE role = 'System Manager'
            AND parent = `tabUser`.name
        )
    """)

    
    if not system_managers:
        return
        
    subject = "Sensor Data Processing Error"
    message = f"""
        An error occurred while processing sensor data:
        <br><br>
        <pre>{error_message}</pre>
        <br>
        Please check the error log for details.
    """
    
    for manager in system_managers:
        try:
            frappe.get_doc({
                "doctype": "Notification Log",
                "subject": subject,
                "for_user": manager,
                "type": "Alert",
                "email_content": message,
            }).insert(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(frappe.get_traceback(), 'send_system_error_notification()')
            continue
    
def create_approval_log(doctype: str, docname: str, status: str):
    current_time = now_datetime()
    formatted_time = format_datetime(current_time, "MMMM DD, YYYY hh:mm A")

    html = f"""
    <div>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Document Type:</strong> {doctype}</p>
        <p><strong>Document:</strong> <a href="/app/{doctype.lower().replace(' ', '-')}/{docname}">{docname}</a></p>
        <p><strong>Timestamp:</strong> {formatted_time}</p>
    </div>
    """

    frappe.get_doc({
        "doctype": "Approval Log",
        "data": html
    }).insert(ignore_permissions=True)