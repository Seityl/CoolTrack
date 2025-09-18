import socket
import logging
from typing import Optional
from datetime import datetime

class TimeSyncManager:
    def __init__(self, logger: logging.Logger):
        self.logger = logger
        
    def crc16_ccitt(self, data: list[int], initial: int = 0x0000) -> int:
        """Calculate CRC-16 CCITT checksum"""
        crc: int = initial
        for byte in data:
            crc ^= (byte << 8)
            for _ in range(8):
                if crc & 0x8000:
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF
                else:
                    crc = (crc << 1) & 0xFFFF
        return crc
    
    def generate_time_sync_command(self, dt: Optional[datetime] = None) -> bytes:
        """Generate time sync command for current date/time or specified datetime"""
        if dt is None:
            dt = datetime.now()
            
        # Command structure: 27000000FF000006[??][MM][DD][HH][mm]00[CRC]
        # Where ?? = 0x08 (unknown field), MM = month, DD = day, HH = hour, mm = minute
        base_data: list[int] = [
            0x27, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x06,   # Header
            0x08,                                             # Unknown field
            dt.month,                                         # Month
            dt.day,                                           # Day
            dt.hour,                                          # Hour (24-hour format)
            dt.minute,                                        # Minute
            0x00                                              # Separator
        ]
        
        # Calculate CRC
        crc: int = self.crc16_ccitt(base_data, 0x0000)
        
        # Add CRC to command (high byte first, then low byte)
        command: list[int] = base_data + [(crc >> 8) & 0xFF, crc & 0xFF]
        
        # Convert to bytes
        command_bytes: bytes = bytes(command)
        command_hex: str = command_bytes.hex().upper()
        
        time_str: str = dt.strftime('%Y-%m-%d %H:%M:%S')
        self.logger.info(f'TIME SYNC: Generated command for {time_str}')
        self.logger.info(f'TIME SYNC: Command hex: {command_hex}')
        return command_bytes
    
    def send_time_sync(self, client_socket: socket.socket, client_id: str) -> bool:
        """Send time sync command to gateway"""
        try:
            command: bytes = self.generate_time_sync_command()
            client_socket.send(command)
            
            self.logger.info(f'TIME SYNC: Successfully sent to gateway {client_id}')
            return True
            
        except Exception as e:
            self.logger.error(f'TIME SYNC: Failed to send to {client_id}: {e}')
            return False