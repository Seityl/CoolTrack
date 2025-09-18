import os
import time
import logging
import requests
import urllib.parse
from cryptography.fernet import Fernet
from typing import Optional, Dict, Any, Union

class FrappeClient:
    def __init__(self, logger: logging.Logger, base_domain: str = 'https://badmc.cooltrack.co') -> None:
        self.base_domain: str = base_domain
        self.cached_api_url: Optional[str] = None
        self.cache_timeout: int = 300  # 5 minutes
        self.last_fetch_time: float = 0.0

        self.logger = logger

        self.encryption_key: Optional[str] = os.getenv('CONFIG_ENCRYPTION_KEY')

        try:
            self.cipher: Optional[Fernet] = Fernet(self.encryption_key.encode()) if self.encryption_key else None
            self.logger.info('Encryption cipher initialized successfully')
            
        except Exception as e:
            self.logger.error(f'Failed to initialize cipher: {e}')
            self.cipher = None

        self.api_key: Optional[str] = None
        self.api_secret: Optional[str] = None

        self.get_credentials()

        self.session: requests.Session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })

        if self.api_key and self.api_secret:
            self.session.headers.update({
                'Authorization': f'token {self.api_key}:{self.api_secret}'
            })

    def get_credentials(self) -> None:
        encrypted_api_key: Optional[str] = os.getenv('ENCRYPTED_FRAPPE_API_KEY')
        encrypted_api_secret: Optional[str] = os.getenv('ENCRYPTED_FRAPPE_API_SECRET')

        if encrypted_api_key and self.cipher:
            try:
                self.api_key = self.decrypt_credential(encrypted_api_key)
                self.logger.debug('API key loaded from encrypted environment variable')

            except Exception as e:
                self.logger.error(f'Failed to decrypt API key: {e}')

        if encrypted_api_secret and self.cipher:
            try:
                self.api_secret = self.decrypt_credential(encrypted_api_secret)
                self.logger.debug('API secret loaded from encrypted environment variable')

            except Exception as e:
                self.logger.error(f'Failed to decrypt API secret: {e}')

    def decrypt_credential(self, encrypted_data: str) -> str:
        if not self.cipher:
            return encrypted_data  # Return as-is if no encryption

        try:
            decrypted: bytes = self.cipher.decrypt(encrypted_data.encode())
            return decrypted.decode()

        except Exception as e:
            self.logger.error(f'Failed to decrypt credential: {e}')
            raise Exception('Credential decryption failed')

    def get_api_url_from_server(self, force_refresh: bool = False) -> Optional[str]:
        current_time: float = time.time()

        if (
            not force_refresh
            and self.cached_api_url
            and (current_time - self.last_fetch_time) < self.cache_timeout
        ):
            return self.cached_api_url

        try:
            settings_url: str = f'{self.base_domain}/api/method/cooltrack.api.v1.get_api_url'
            response: requests.Response = self.session.get(settings_url, timeout=10)

            if response.status_code == 200:
                json_response: Dict[str, Any] = response.json()
                data: Dict[str, Any] = json_response.get('message', {})
                api_url: Optional[str] = data.get('api_url')
                if api_url:
                    self.cached_api_url = api_url
                    self.last_fetch_time = current_time
                    return api_url

                else:
                    self.logger.warning('API URL not found in response')

            else:
                self.logger.error(f'Failed to get API URL: {response.status_code} - {response.text}')

        except requests.RequestException as e:
            self.logger.error(f'Failed to get API URL: {e}')

        return None

    def forward_sensor_data(self, sensor_data: Dict[str, Any]) -> bool:
        if not self.api_key or not self.api_secret:
            self.logger.error('API credentials not set. Cannot forward sensor data.')
            return False

        try:
            response = self.session.post(self.cached_api_url, json=sensor_data, timeout=10)

            if response.status_code == 200:
                self.logger.info(f'Sensor data successfully sent to {self.cached_api_url}')
                return True

            else:
                self.logger.error(
                    f'Failed to send sensor data to {self.cached_api_url}: '
                    f'{response.status_code} - {response.text}'
                )
                return False

        except requests.RequestException as e:
            self.logger.error(f'Error forwarding sensor data to {self.cached_api_url}: {e}')
            return False

    def get_logged_user(self, auth_header: Optional[str] = None, session_cookie: Optional[str] = None) -> Optional[str]:
        url: str = f'{self.base_domain}/api/method/frappe.auth.get_logged_user'
        headers: Dict[str, str] = {}
        cookies: Dict[str, str] = {}

        if auth_header:
            headers['Authorization'] = auth_header
        if session_cookie:
            cookies['sid'] = session_cookie

        response: requests.Response = self.session.get(url, headers=headers, cookies=cookies, timeout=10)
        if response.status_code == 200:
            return response.json().get('message')
        return None

    def get_single_doc(self, doctype: str) -> Optional[Union[Dict[str, Any], list]]:
        url: str = f'{self.base_domain}/api/resource/{doctype}/{doctype}'
        response: requests.Response = self.session.get(url)
        if response.status_code == 200:
            data = response.json().get('data', [])
            return data if data else None
        return None

    def get_doc(self, doctype: str, name: str) -> Optional[Dict[str, Any]]:
        encoded_name: str = urllib.parse.quote(name, safe='')
        url: str = f'{self.base_domain}/api/resource/{doctype}/{encoded_name}'
        response: requests.Response = self.session.get(url)
        if response.status_code == 200:
            return response.json().get('data')
        return None

    def update_doc(self, doctype: str, name: str, data: Dict[str, Any]) -> bool:
        encoded_name: str = urllib.parse.quote(name, safe='')
        url: str = f'{self.base_domain}/api/resource/{doctype}/{encoded_name}'
        response: requests.Response = self.session.put(url, json=data)
        
        return response.status_code == 200

    def check_user_exists(self, user_id: str) -> bool:
        try:
            user_doc = self.get_doc('User', user_id)
            return user_doc is not None
            
        except Exception:
            return False