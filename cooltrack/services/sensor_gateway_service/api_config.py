import time
import logging
import requests
from typing import Optional

class APIConfig:
    def __init__(self, base_domain:str):
        self.base_domain = base_domain
        self.cached_url = None
        self.cache_timeout = 300  # 5 minutes
        self.last_fetch_time = 0
        
    def get_api_url_from_server(self, force_refresh:bool=False) -> Optional[str]:
        current_time = time.time()
        
        if (not force_refresh and 
            self.cached_url and 
            (current_time - self.last_fetch_time) < self.cache_timeout
        ):
            return self.cached_url
        
        try:
            settings_url = f'https://{self.base_domain}/api/method/cooltrack.api.v1.get_api_url'
            response = requests.get(settings_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json().get('message', {})
                api_url = data.get('api_url')
                if api_url:
                    self.cached_url = api_url
                    self.last_fetch_time = current_time
                    return api_url
            
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to get API URL: {e}')
            
        return None