# Copyright (c) 2025, dev@cogentmedia.co and contributors
# For license information, please see license.txt

import re

import frappe
from frappe.utils import get_link_to_form

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

def send_approval_notification(device_type, device_id, status, owner):
    if status == "Rejected":
        return
        
    notification_exists = frappe.db.exists("Notification Log", {
        "document_type": "Sensor Gateway" if device_type == "gateway" else "Sensor",
        "document_name": device_id,
        "type": "Approval Required",
        "read": 0  # Only check unread notifications
    })
    
    if notification_exists:
        return
        
    system_managers = frappe.db.sql_list("""
        SELECT DISTINCT parent 
        FROM `tabHas Role` 
        WHERE role='System Manager' AND parent != 'Administrator'
    """)
    
    if not system_managers:
        return
        
    doc_link = get_link_to_form(
        "Sensor Gateway" if device_type == "gateway" else "Sensor", 
        device_id
    )
    
    subject = f"New {device_type.capitalize()} Requires Approval: {device_id}"
    message = f"""
        A new {device_type} has been created and requires approval.
        <br><br>
        <strong>Details:</strong>
        <ul>
            <li>Name: {doc_link}</li>
            <li>Created By: {owner}</li>
            <li>Status: {status}</li>
        </ul>
        <br>
        Please review and approve at your earliest convenience.
    """
    
    for manager in system_managers:
        frappe.get_doc({
            "doctype": "Notification Log",
            "subject": subject,
            "for_user": manager,
            "type": "Alert",
            "email_content": message,
            "document_type": "Sensor Gateway" if device_type == "gateway" else "Sensor",
            "document_name": device_id,
            "from_user": owner,
            "priority": "High",
            "channel": "System Notification"
        }).insert(ignore_permissions=True)

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
        if not frappe.db.exists('User', manager):
            continue
        frappe.get_doc({
            "doctype": "Notification Log",
            "subject": subject,
            "for_user": manager,
            "type": "Alert",
            "email_content": message,
            "priority": "High"
        }).insert(ignore_permissions=True)