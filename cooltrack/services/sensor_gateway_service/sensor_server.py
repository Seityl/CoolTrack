import os
import sys
import time
import signal
import socket
import logging
import requests
import threading
from datetime import datetime
from logging.handlers import RotatingFileHandler

from ..frappe_client import FrappeClient
from .activity_monitor import ActivityMonitor
from .time_sync_manager import TimeSyncManager

def setup_logging():
    log_level = 'DEBUG'
    log_dir = './logs'
    log_file = 'sensor_server.log'
    max_log_size = 50 * 1024 * 1024
    backup_count = 100
    
    log_file_path = os.path.join(log_dir, log_file)
    
    logger = logging.getLogger(__name__)
    logger.setLevel(getattr(logging, log_level))
    
    logger.propagate = False
    
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s')
    file_formatter = logging.Formatter('%(asctime)s - %(message)s')
    
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level))
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    try:
        os.makedirs(log_dir, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file_path, 
            maxBytes=max_log_size, 
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(getattr(logging, log_level))
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
        logger.info(f'File logging initialized: {log_file_path}')
        file_handler.flush()
        
    except Exception as e:
        error_msg = f'⚠️ Could not setup file logging: {e}'
        logger.error(error_msg)
    
    urllib3_logger = logging.getLogger('urllib3')
    urllib3_logger.setLevel(logging.WARNING)
    urllib3_logger.propagate = False
    
    requests_logger = logging.getLogger('requests')
    requests_logger.setLevel(logging.WARNING)
    requests_logger.propagate = False
    
    return logger

def load_env_file(logger: logging, filename: str = '.env.encrypted') -> bool:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.abspath(os.path.join(script_dir, '../../'))
    filepath = os.path.join(parent_dir, filename)

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

class SensorServer:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.running = False
        self.client_threads = []
        self.server_socket = None
        self.shutdown_called = False
        self._synced_gateways_lock = threading.Lock()

        # Logging
        self.logger = logging.getLogger(__name__)

        # Configuration
        self.max_clients = 3
        self.retry_delay = 5
        self.retry_attempts = 3
        self.gateway_name = 'BADMC' # Name set on the gateway
        self.connection_timeout = 3600

        # API Configuration
        self.frappe_client = FrappeClient(logger=self.logger)

        # Activity Monitoring
        self.restart_requested = False
        self.enable_auto_restart = True
        self.activity_monitor = ActivityMonitor(logger=self.logger, inactivity_timeout=3600)

        # Time Sync Configuration
        self.synced_gateways = set() # Track which gateways have been synced to avoid repeated syncing
        self.enable_time_sync = True  # Enable automatic time sync
        self.time_sync_manager = TimeSyncManager(logger=self.logger)
        
    def is_gateway_connection_request(self, data):
        if not data:
            return False

        try:
            expected = self.gateway_name.encode()
            if expected in data:
                self.logger.info(f'DETECTED: Gateway connection request (contains {self.gateway_name})')
                return True

        except Exception:
            pass

        return False

    def handle_gateway_connection(self, client_socket, client_id, data):
        """Handle initial gateway connection and perform time sync"""
        try:
            gateway_name = data.decode('utf-8', errors='ignore').strip()
            self.logger.info(f'GATEWAY: Connected - {gateway_name} from {client_id}')
            
            # Only sync time once per gateway per session
            if self.enable_time_sync and client_id not in self.synced_gateways:
                self.logger.info(f'TIME SYNC: Starting sync with gateway {client_id}')
                
                # Small delay to ensure gateway is ready
                time.sleep(0.5)
                
                if self.time_sync_manager.send_time_sync(client_socket, client_id):
                    self.synced_gateways.add(client_id)
                    self.logger.info(f'TIME SYNC: Completed for gateway {client_id}')

                else:
                    self.logger.warning(f'TIME SYNC: Failed for gateway {client_id}')
                    
            elif client_id in self.synced_gateways:
                self.logger.info(f'TIME SYNC: Gateway {client_id} already synced this session')
            
            if self.enable_auto_restart:
                self.activity_monitor.update_activity()
                
        except Exception as e:
            self.logger.error(f'GATEWAY: Error handling connection from {client_id}: {e}')

    def clean_corrupted_sensor_data(self, data_str):
        if f'{self.gateway_name}' in data_str and 'GW_ID:' in data_str: # Has to start with the name set on the gateway
            gw_id_index = data_str.find('GW_ID:') # Extract the sensor data part after gateway name
            if gw_id_index != -1:
                cleaned_data = data_str[gw_id_index:]
                self.logger.info(f'Cleaned corrupted data: {data_str[:20]}... -> {cleaned_data[:20]}...')
                return cleaned_data

        return data_str

    def is_valid_sensor_data(self, data_str):
        data_str = data_str.strip()
        self.logger.debug(f'Validating sensor data: {repr(data_str)}')
        
        # Clean data first if corrupted
        data_str = self.clean_corrupted_sensor_data(data_str)
        
        # Reject empty or very short data
        if len(data_str) < 10:
            self.logger.debug('Rejected: Too short')
            return False
        
        # Reject HTTP requests
        http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH']
        if any(data_str.startswith(method + ' ') for method in http_methods):
            self.logger.debug('Rejected: HTTP method detected')
            return False
            
        # Reject for HTTP headers
        http_headers = [
            'Host:', 'User-Agent:', 'Accept:', 'Accept-Language:', 'Accept-Encoding:',
            'Connection:', 'Content-Type:', 'Content-Length:', 'Authorization:',
            'Cookie:', 'Cache-Control:', 'Pragma:', 'Referer:'
        ]
        if any(data_str.startswith(header) for header in http_headers):
            self.logger.debug('Rejected: HTTP header detected')
            return False
            
        # Reject for HTML content
        if data_str.startswith('<') or 'html' in data_str.lower():
            self.logger.debug('Rejected: HTML content detected')
            return False
        
        # Must contain gateway id
        if 'GW_ID:' not in data_str:
            self.logger.debug('Rejected: No GW_ID found')
            return False
            
        # Must contain type field
        if 'TYPE:' not in data_str:
            self.logger.debug('Rejected: No TYPE field found')
            return False
            
        # Must contain id field
        if 'ID:' not in data_str:
            self.logger.debug('Rejected: No ID field found')
            return False
            
        # Must be comma-separated key:value pairs
        if ',' not in data_str or ':' not in data_str:
            self.logger.debug('Rejected: No comma-separated key:value pairs found')
            return False
            
        # Check for valid sensor types
        valid_types = ['TMP']  # Add other types here as needed
        type_found = False
        for part in data_str.split(','):
            if part.strip().startswith('TYPE:'):
                sensor_type = part.split(':', 1)[1].strip()
                self.logger.debug(f'Found sensor type: {sensor_type}')
                if sensor_type in valid_types:
                    type_found = True
                    break
                    
        if not type_found:
            self.logger.debug('Rejected: No valid sensor type found')
            return False
        
        self.logger.debug('Validation passed: Valid sensor data')
        return True

    def parse_sensor_data(self, sensor_data_str):
        # Clean data first if corrupted
        sensor_data_str = self.clean_corrupted_sensor_data(sensor_data_str)
        
        parsed = {}
        parts = sensor_data_str.split(',')
        
        for part in parts:
            if ':' in part:
                key, value = part.split(":", 1)
                key = key.strip()
                value = value.strip()
                
                if key and value:
                    try:
                        if '.' in value and value.replace('.', '').replace('-', '').isdigit():
                            parsed[key] = float(value)

                        elif value.replace('-', '').isdigit():
                            parsed[key] = int(value)
                            
                        else:
                            parsed[key] = value
                            
                    except (ValueError, AttributeError):
                        parsed[key] = value
        
        # Add server timestamp
        server_time = time.strftime('%Y-%m-%d %H:%M:%S')
        parsed['_received_at'] = server_time
        
        # Fallback if gateway time is suspicious
        gateway_time = parsed.get('Time', '')
        if gateway_time:
            try:
                gateway_dt = datetime.strptime(gateway_time, '%Y-%m-%d %H:%M:%S')
                server_dt = datetime.strptime(server_time, '%Y-%m-%d %H:%M:%S')
                
                time_diff = abs((gateway_dt - server_dt).days)
                
                # If difference is over a year, use server time. Gateway time resets to 2021 when it loses power.
                if time_diff > 365:
                    self.logger.warning(f'Gateway time {gateway_time} is {time_diff} days off from server time, using server time')
                    parsed['_original_gateway_time'] = gateway_time
                    parsed['Time'] = server_time
                    parsed['_time_corrected'] = True

                else:
                    parsed['_time_corrected'] = False
                    
            except (ValueError, TypeError) as e:
                self.logger.error(f"Error parsing gateway time '{gateway_time}': {e}, using server time")
                parsed['_original_gateway_time'] = gateway_time
                parsed['Time'] = server_time
                parsed['_time_corrected'] = True
        
        return parsed

    def handle_client_connection(self, client_socket, address):
        client_id = f'{address[0]}:{address[1]}'
        self.logger.info(f'Handling connection from {client_id}')

        if self.enable_auto_restart:
            self.activity_monitor.update_activity()

        try:
            client_socket.settimeout(self.connection_timeout)
            buffer = b''
            gateway_handshake_done = False
            
            while self.running:
                try:
                    data = client_socket.recv(1024)
                    if not data:
                        self.logger.info(f'Client {client_id} disconnected')
                        self.synced_gateways.discard(client_id) # Remove from synced gateways when disconnected
                        break

                    if self.enable_auto_restart:
                        self.activity_monitor.update_activity()
                        
                    self.logger.debug(f'Received raw data from {client_id}: {data}')
                    self.logger.debug(f'Raw data hex from {client_id}: {data.hex()}')
                    
                    # Check for gateway connection request
                    if self.is_gateway_connection_request(data):
                        if not gateway_handshake_done:
                            self.handle_gateway_connection(client_socket, client_id, data)
                            gateway_handshake_done = True

                        continue
                    
                    buffer += data

                    while b'\r\n' in buffer:
                        message, buffer = buffer.split(b'\r\n', 1)
                        
                        if message:
                            try:
                                # Decode sensor data
                                decoded_str = self.decode_sensor_data(message).strip()
                                self.logger.debug(f'Decoded string from {client_id}: {repr(decoded_str)}')
                                
                                if not decoded_str:
                                    continue

                                # Check if this might be a late gateway identification
                                if self.gateway_name in decoded_str and not gateway_handshake_done:
                                    self.logger.info(f'LATE GATEWAY DETECTION: Found {self.gateway_name} in sensor data')
                                    self.handle_gateway_connection(client_socket, client_id, message)
                                    gateway_handshake_done = True
                                    continue

                                # Validate sensor data
                                if not self.is_valid_sensor_data(decoded_str):
                                    self.logger.info(f'Ignoring non-sensor data from {client_id}: {decoded_str[:100]}...')
                                    continue

                                self.logger.info(f'Valid sensor data from {client_id}: {decoded_str}')
                                
                                # Parse with time correction
                                sensor_dict = self.parse_sensor_data(decoded_str)
                                sensor_dict['_client_id'] = client_id
                                
                                self.logger.info(f'Parsed sensor data from {client_id}: {sensor_dict}')
                                
                                if self.enable_auto_restart:
                                    self.activity_monitor.update_activity()
                                    
                                self.forward_to_erpnext(sensor_dict, client_id)
                                
                            except Exception as e:
                                self.logger.error(f'Error processing message from {client_id}: {e}')
                                self.logger.error(f'Raw message that caused error: {message}')
                                
                except socket.timeout:
                    continue
                
                except socket.error as e:
                    self.logger.error(f'Socket error for {client_id}: {e}')
                    break
                    
        except Exception as e:
            self.logger.error(f'Error handling client {client_id}: {e}')

        finally:
            try:
                client_socket.close()
                self.synced_gateways.discard(client_id) # Remove from synced gateways when connection closes
                self.logger.info(f'Closed connection to {client_id}')

            except:
                pass

    def decode_sensor_data(self, data_bytes: bytes) -> str:
        try:
            self.logger.debug(f'Decoding bytes: {data_bytes}')
            self.logger.debug(f'Bytes as hex: {data_bytes.hex()}')

            start_idx = 0
            for marker in (b'GW_ID', b'%X', b'GW:'):
                idx = data_bytes.find(marker)
                if idx != -1:
                    start_idx = idx
                    break

            processed = data_bytes[start_idx:]
            processed = processed.replace(b'\xa1\xe6', '℃'.encode('utf-8'))

            try:
                text = processed.decode('utf-8')
                text = text.replace('â\x84\x83', '℃').replace('\xa0', ' ')
                self.logger.debug(f'Successfully decoded as UTF-8: {repr(text)}')
                return text

            except UnicodeDecodeError:
                text = processed.decode('latin-1')
                text = text.replace('â\x84\x83', '℃').replace('\xa0', ' ')
                self.logger.debug(f'Successfully decoded as latin-1: {repr(text)}')
                return text

        except Exception as e:
            self.logger.error(f'Failed to decode sensor data: {e}')
            self.logger.error(f'Original bytes: {data_bytes}')
            return repr(data_bytes)

    def forward_to_erpnext(self, sensor_data, client_id):
        for attempt in range(self.retry_attempts):
            try:
                endpoint = self.frappe_client.get_api_url_from_server()
                if not endpoint:
                    self.logger.error(f'No API endpoint available for {client_id}')
                    return False
                
                success = self.frappe_client.forward_sensor_data(sensor_data)
                if success:
                    if self.enable_auto_restart:
                        self.activity_monitor.update_activity()

                    return True

                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay)
                    
            except Exception as e:
                self.logger.error(f'Error forwarding data from {client_id} (attempt {attempt + 1}): {e}')
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay)
                
        return False

    def start_server(self):
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            
            try:
                self.server_socket.bind((self.host, self.port))
                self.logger.info(f"Bound to {self.host}:{self.port}")

            except OSError as e:
                if e.errno == 98:  # Address already in use
                    self.logger.error(f'Port {self.port} is already in use. Another instance may be running.')
                    raise

                else:
                    self.logger.error(f'Failed to bind to {self.host}:{self.port}: {e}')
                    raise
            
            self.server_socket.listen(self.max_clients)
            self.running = True

            if self.enable_auto_restart:
                self.activity_monitor.start_monitoring(self.request_restart)
                self.logger.info('Auto-restart enabled')
            
            self.logger.info(f'Sensor server listening on {self.host}:{self.port}')
            self.logger.info(f'Max clients: {self.max_clients}, Connection timeout: {self.connection_timeout}s')
            
            test_url = self.frappe_client.get_api_url_from_server()
            if test_url:
                self.logger.info(f'API endpoint ready: {test_url}')

            else:
                self.logger.warning('Could not fetch API endpoint - will retry when data arrives')
            
            while self.running:
                try:
                    client_sock, address = self.server_socket.accept()
                    self.logger.info(f'Accepted connection from {address}')
                    
                    active_threads = [t for t in self.client_threads if t.is_alive()]
                    if len(active_threads) >= self.max_clients:
                        self.logger.warning(f'Max clients ({self.max_clients}) reached, rejecting {address}')
                        client_sock.close()
                        continue
                    
                    client_handler = threading.Thread(
                        target=self.handle_client_connection,
                        args=(client_sock, address),
                        daemon=True
                    )
                    client_handler.start()
                    self.client_threads.append(client_handler)
                    
                except socket.error as e:
                    if self.running:
                        self.logger.error(f'Socket error: {e}')
                    break

                except Exception as e:
                    self.logger.error(f'Unexpected error accepting connections: {e}')
                    
        except Exception as e:
            self.logger.error(f'Failed to start server: {e}')
            raise

        finally:
            self.shutdown()

    def request_restart(self):
        self.logger.info('Restart requested due to inactivity')
        self.restart_requested = True
        self.shutdown()

    def shutdown(self):
        if self.shutdown_called:
            return
            
        self.shutdown_called = True
        self.logger.info('Shutting down sensor server...')
        self.running = False

        if self.enable_auto_restart:
            self.activity_monitor.stop_monitor()

        if self.server_socket:
            try:
                self.server_socket.close()
                
            except:
                pass
                
        active_threads = [t for t in self.client_threads if t.is_alive()]
        if active_threads:
            self.logger.info(f'Waiting for {len(active_threads)} client connections to close...')
            
            for thread in active_threads:
                thread.join(timeout=5)
                
        self.logger.info('Server shutdown complete')

def main():
    logger = setup_logging()
    
    logger.info('Starting Sensor Server...')

    load_env_file(logger)
    
    def is_port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('0.0.0.0', port))
                return False

            except OSError:
                return True
    
    port = 8899

    if is_port_in_use(port):
        logger.error(f'Port {port} is already in use. Please check for existing processes:')
        logger.error(f'Run: sudo netstat -tulpn | grep :{port}')
        logger.error(f'Or: sudo lsof -i :{port}')
        logger.error('Kill the existing process or use a different port.')
        sys.exit(1)
    
    server = SensorServer(host='0.0.0.0', port=port)

    def signal_handler(signum, frame):
        signal_name = signal.Signals(signum).name
        logger.info(f'Received {signal_name} signal, shutting down gracefully...')
        server.shutdown()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # Termination signal
    
    try:
        server.start_server()
        
    except KeyboardInterrupt:
        logger.info('Received keyboard interrupt')
        
    except Exception as e:
        logger.error(f'Server error: {e}')
        
    finally:
        server.shutdown()

if __name__ == '__main__':
    main()