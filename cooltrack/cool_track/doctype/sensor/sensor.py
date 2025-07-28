# Copyright (c) 2025, dev@cogentmedia.co and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import now
from frappe.model.document import Document

from cooltrack.utils import get_settings, send_approval_notification, create_approval_log

class Sensor(Document):
    def after_insert(self):
        self.send_notification()
        self.update_status()

    def validate(self):
        settings = get_settings()
        original_approval_status = frappe.db.get_value(self.doctype, self.name, 'approval_status')
        if self.approval_status != original_approval_status and settings.log_approval_activities:
            automated = not settings.require_gateway_approval
            create_approval_log(self.doctype, self.name, self.approval_status, automated=automated)

        original_calibration_offset = frappe.db.get_value(self.doctype, self.name, 'calibration_offset')
        if self.calibration_offset != original_calibration_offset:
            self.last_calibration = now()
            
    def before_save(self):
        self.update_status()

        if self.approval_status == 'Approved' and self.status == 'Active':
            if not self.number_of_transmissions:
                self.number_of_transmissions = 0
            
            self.number_of_transmissions += 1

    def update_status(self):
        if self.approval_status == 'Approved' and self.status != 'Active':
            self.db_set('status', 'Active')

        if self.approval_status == 'Rejected' and self.status != 'Inactive':
            self.db_set('status', 'Inactive')

    def send_notification(self):
        settings = get_settings()
        if self.approval_status == 'Pending' and settings.send_approval_notifications:
            send_approval_notification(
                self.doctype, 
                self.name, 
                self.approval_status
            )