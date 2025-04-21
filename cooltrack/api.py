import frappe
from frappe.utils import now_datetime
import re

@frappe.whitelist(allow_guest=True)
def receive_sensor_data(**kwargs):
    """Receives and processes sensor data sent as form-data."""
    try:
        # Get form-data from the request
        form_data = frappe.local.form_dict

        if not form_data:
            return {"status": "error", "message": "No form data received"}

        # Validate required fields
        # required_fields = ["GW_ID", "TYPE", "ID", "T", "H", "V"]
        # for field in required_fields:
        #     if field not in form_data:
        #         return {"status": "error", "message": f"Missing required field: {field}"}

        # Clean and parse values
        temperature = parse_value(form_data.get("T"))  # "26.7℃" → 26.7
        humidity = parse_value(form_data.get("H"))      # "70.1%" → 70.1
        voltage = parse_value(form_data.get("V"))      # "4.00v" → 4.00
        rssi = parse_value(form_data.get("RSSI"))      # "-90dBm" → -90

        # Create Sensor Reading doc
        doc = frappe.get_doc({
            "doctype": "Sensor Read",
            "sensor_id": form_data.get("ID"),
            "sensor_type": form_data.get("TYPE"),
            "temperature": temperature,
            "humidity": humidity,
            "voltage": voltage,
            "signal_strength": rssi,
            "sequence_number": form_data.get("SN"),
            "gateway_id": form_data.get("GW_ID"),
            "sensor_rssi": parse_value(form_data.get("T_RSSI")),
            "coordinates": f"{form_data.get('E')},{form_data.get('N')}",
            "timestamp": form_data.get("Time", now_datetime())
        })
        doc.insert(ignore_permissions=True)

        return {"status": "success", "message": "Data received", "name": doc.name}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Sensor Gateway Error")
        return {"status": "error", "message": str(e)}

def parse_value(value):
    """Extracts numeric value from strings like '26.7℃', '70.1%', '-90dBm'."""
    if not value:
        return None
    try:
        # Remove non-numeric characters (keep digits, minus, and decimal point)
        return float(re.sub(r"[^\d.-]", "", value))
    except ValueError:
        return None