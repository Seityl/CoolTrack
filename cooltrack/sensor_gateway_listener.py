#!/usr/bin/env python3
import socket
import threading
import requests

def get_api_url_from_server():
    try:
        settings_url = 'http://cooltrack.qcgrant.com:8000/api/method/cooltrack.api.v1.get_api_url'
        response = requests.get(settings_url)
        
        if response.status_code == 200:
            data = response.json()['message']
            print(data)
            return data.get('api_url')
        else:
            print(f'Error fetching API URL: {response.status_code} - {response.text}')
            return None
            
    except Exception as e:
        print(f'Failed to get API URL: {e}')
        return None
    
def decode_sensor_data(data_bytes):
    """
    Decodes sensor data, replacing \xa1\xe6 with ℃ before UTF-8 decoding.
    If UTF-8 fails, falls back to Latin-1 (ISO-8859-1).
    """
    try:
        # Replace the Celsius symbol bytes with UTF-8 ℃
        data_bytes = data_bytes.replace(b'\xa1\xe6', '℃'.encode('utf-8'))
        # Try UTF-8 first (now that problematic bytes are replaced)
        text = data_bytes.decode('utf-8')
    except UnicodeDecodeError:
        # Fall back to Latin-1 if other non-UTF-8 bytes exist
        text = data_bytes.decode('latin-1')
    return text

def parse_sensor_data(sensor_data_str):
    """
    Parses the sensor data string into a dictionary.
    """
    parsed = {}
    parts = sensor_data_str.split(',')
    for part in parts:
        if ':' in part:
            key, value = part.split(":", 1)
            parsed[key.strip()] = value.strip()
    return parsed

def handle_client_connection(client_socket):
    try:
        buffer = b""
        while True:
            data = client_socket.recv(1024)
            if not data:
                break
            buffer += data
            print(f"Received raw data: {data}")

            # Process all complete messages (ending with \r\n)
            while b"\r\n" in buffer:
                message, buffer = buffer.split(b"\r\n", 1)
                decoded_str = decode_sensor_data(message).strip()
                print(f"Decoded sensor string: {decoded_str}")

                sensor_dict = parse_sensor_data(decoded_str)
                print(f"Parsed sensor data: {sensor_dict}")

                # Forward the parsed data to ERPNext
                forward_to_erpnext(sensor_dict)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client_socket.close()

def forward_to_erpnext(sensor_data):
    """
    Send the parsed sensor data to ERPNext as form-data.
    """
    try:
        print(f"Sending to ERPNext (form-data): {sensor_data}")
        endpoint = get_api_url_from_server()
        print(f"Endpoint : {endpoint}")
        # ERPNext expects form-data with each field as a key-value pair
        response = requests.post(
            endpoint,
            data=sensor_data,  # Send as form-data (not JSON)
        )

        print(f"Forwarded to ERPNext: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Failed to forward to ERPNext: {e}")

def start_server(host="0.0.0.0", port=8899):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((host, port))
    server.listen(5)
    print(f"Listening on {host}:{port}...")
    while True:
        client_sock, address = server.accept()
        print(f"Accepted connection from {address}")
        client_handler = threading.Thread(
            target=handle_client_connection,
            args=(client_sock,)
        )
        client_handler.start()

if __name__ == "__main__":
    start_server()