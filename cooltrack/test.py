#!/usr/bin/env python3
import socket
import struct
import time
from datetime import datetime, timedelta
import logging

def calculate_crc16(data):
    """
    Calculate CRC16 checksum using polynomial 0x1021 (CRC-CCITT)
    """
    crc = 0xFFFF
    for byte in data:
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc = crc << 1
            crc &= 0xFFFF
    return crc

def create_time_calibration_request(gateway_time=None):
    """
    Create time calibration request - EXACTLY 15 bytes
    
    The correct 15-byte format based on server analysis:
    - Position 0: Frame header (0x27)
    - Positions 1-4: Gateway address (4 bytes)  
    - Position 5: Packet type (0x00)
    - Positions 6-7: Length (0x00, 0x06) 
    - Positions 8-13: Time data (6 bytes: year_offset, month, day, hour, minute, second)
    - Positions 14-15: CRC (2 bytes) - but this makes 16 bytes total!
    
    The issue is the server expects CRC at positions 13-14, which means:
    - Positions 8-12: Time data (5 bytes)
    - Positions 13-14: CRC (2 bytes)
    
    Let me construct it this way:
    """
    
    # Use provided time or current time
    if gateway_time is None:
        gateway_time = datetime.now()
    
    # Calculate year offset from 2017
    year_offset = gateway_time.year - 2017
    if year_offset < 0:
        year_offset = 0
    elif year_offset > 255:
        year_offset = 255
    
    # Frame header
    frame_header = 0x27
    
    # Gateway address (4 bytes)
    gateway_addr = [0x00, 0x01, 0x02, 0x03]
    
    # Type: 0x00 (Registration Package)
    packet_type = 0x00
    
    # Length: 0x00 0x06 (server expects this)
    length_h = 0x00
    length_l = 0x06
    
    # Time data - but only 5 bytes to make total = 15
    # Based on server's CRC check at positions 13-14
    time_data = [
        year_offset,           # Year offset from 2017
        gateway_time.month,    # Month (1-12)
        gateway_time.day,      # Day (1-31)
        gateway_time.hour,     # Hour (0-23)
        gateway_time.minute,   # Minute (0-59)
        # Note: Removing seconds to fit in 15 bytes
    ]
    
    # Construct data for CRC calculation (positions 1-12)
    data_for_crc = gateway_addr + [packet_type, length_h, length_l] + time_data
    
    # Calculate CRC16
    crc = calculate_crc16(bytes(data_for_crc))
    crc_h = (crc >> 8) & 0xFF
    crc_l = crc & 0xFF
    
    # Complete frame
    frame = [frame_header] + data_for_crc + [crc_h, crc_l]
    
    print(f"DEBUG: Creating time calibration request:")
    print(f"  Gateway time: {gateway_time}")
    print(f"  Year offset: {year_offset} (year {gateway_time.year})")
    print(f"  Frame breakdown:")
    print(f"    Header (pos 0): 0x{frame_header:02X}")
    print(f"    Gateway addr (pos 1-4): {' '.join(f'0x{b:02X}' for b in gateway_addr)}")
    print(f"    Type (pos 5): 0x{packet_type:02X}")
    print(f"    Length (pos 6-7): 0x{length_h:02X} 0x{length_l:02X}")
    print(f"    Time data (pos 8-12): {' '.join(f'0x{b:02X}' for b in time_data)}")
    print(f"    CRC (pos 13-14): 0x{crc_h:02X} 0x{crc_l:02X}")
    print(f"  Complete frame ({len(frame)} bytes): {' '.join(f'{b:02X}' for b in frame)}")
    
    if len(frame) != 15:
        print(f"ERROR: Frame is {len(frame)} bytes, expected 15!")
        return None
    
    return bytes(frame)

def send_time_calibration_test(host='127.0.0.1', port=8899):
    """
    Test time calibration with a realistic gateway time
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Create a request with the current time
        current_time = datetime.now()
        request = create_time_calibration_request(current_time)
        
        if not request:
            logger.error("Failed to create request")
            return False
        
        # Log the request details
        request_hex = ' '.join(f'{b:02X}' for b in request)
        logger.info(f'Sending {len(request)}-byte time calibration request')
        logger.info(f'Request hex: {request_hex}')
        logger.info(f'Gateway time being sent: {current_time.strftime("%Y-%m-%d %H:%M:%S")}')
        
        # Connect and send
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(10)
            sock.connect((host, port))
            sock.sendall(request)
            logger.info(f'Request sent to {host}:{port}')
            
            # Wait for response
            try:
                response = sock.recv(1024)
                if response:
                    response_hex = ' '.join(f'{b:02X}' for b in response)
                    logger.info(f'Received {len(response)}-byte response: {response_hex}')
                    
                    # Parse the response to see what time the server sent back
                    if len(response) >= 15:
                        parse_time_response(response)
                else:
                    logger.info('No response received')
            except socket.timeout:
                logger.info('No response within timeout')
                
        return True
        
    except Exception as e:
        logger.error(f'Test failed: {e}')
        return False

def parse_time_response(response_bytes):
    """
    Parse the server's time calibration response to see what time it sent
    """
    try:
        if len(response_bytes) < 15:
            print(f"Response too short: {len(response_bytes)} bytes")
            return
        
        # Parse response (same format as request)
        frame_header = response_bytes[0]
        gateway_addr = response_bytes[1:5]
        packet_type = response_bytes[5]
        length_h = response_bytes[6]
        length_l = response_bytes[7]
        time_data = response_bytes[8:13]  # 5 bytes
        crc_bytes = response_bytes[13:15]
        
        # Extract time components
        year_offset = time_data[0]
        month = time_data[1]
        day = time_data[2]
        hour = time_data[3]
        minute = time_data[4]
        
        # Convert year offset to actual year
        actual_year = 2017 + year_offset
        
        server_time = f"{actual_year:04d}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:XX"
        
        print(f"Server response analysis:")
        print(f"  Server time sent: {server_time}")
        print(f"  Time components: year_offset={year_offset} (year {actual_year}), month={month}, day={day}, hour={hour}, minute={minute}")
        
    except Exception as e:
        print(f"Error parsing response: {e}")

def test_multiple_scenarios():
    """
    Test different time scenarios to verify the protocol works
    """
    logger = logging.getLogger(__name__)
    
    scenarios = [
        ("Current time", datetime.now()),
        ("Different hour", datetime.now().replace(hour=10, minute=30)),
        ("Different day", datetime.now().replace(day=15)),
        ("Year 2024", datetime(2024, 6, 15, 14, 30, 0)),
    ]
    
    for name, test_time in scenarios:
        logger.info(f"\n--- Testing scenario: {name} ---")
        logger.info(f"Test time: {test_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        request = create_time_calibration_request(test_time)
        if request:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                    sock.settimeout(5)
                    sock.connect(('127.0.0.1', 8899))
                    sock.sendall(request)
                    
                    response = sock.recv(1024)
                    if response:
                        parse_time_response(response)
                    
                    time.sleep(1)  # Brief pause between tests
                    
            except Exception as e:
                logger.error(f"Failed scenario {name}: {e}")

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logger = logging.getLogger(__name__)
    
    print("🔧 Testing Time Calibration Protocol")
    print("=" * 50)
    
    # Test single scenario
    print("\n1. Single test with current time:")
    send_time_calibration_test()
    
    # Test multiple scenarios
    print("\n2. Multiple scenario tests:")
    test_multiple_scenarios()

if __name__ == '__main__':
    main()