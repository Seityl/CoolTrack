# Copyright (c) 2025, dev@cogentmedia.co and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from cooltrack.utils import get_settings, send_approval_notification, create_approval_log

class Sensor(Document):
    def after_insert(self):
        settings = get_settings()
        if self.approval_status == 'Pending' and settings.send_approval_notifications:
            send_approval_notification(
                'sensor', 
                self.name, 
                self.owner,
                self.approval_status
            )

    def validate(self):
        if self.approval_status == 'Approved':
            self.update_status('Active')
        if self.approval_status == 'Rejected':
            self.update_status('Inactive')

    # def before_save(self):
    #     if self.approval_status == 'Approved' and self.status == 'Active':
    #         self.last_heartbeat = frappe.utils.now_datetime()
        
    #         if not self.number_of_transmissions:
    #             self.number_of_transmissions = 0

    #         self.number_of_transmissions += 1
    
    def update_status(self, status):
        self.db_set('status', status)
        create_approval_log(self.doctype, self.name, status)

