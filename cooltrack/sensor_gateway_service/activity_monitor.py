import time
import logging
import threading

class ActivityMonitor:
    def __init__(self, inactivity_timeout):
        self.inactivity_timeout = inactivity_timeout
        self.last_activity_time = time.time()
        self.activity_lock = threading.Lock()
        self.monitor_thread = None
        self.stop_monitoring = threading.Event()
        self.restart_callback = None
        self.logger = logging.getLogger(__name__)
        
    def update_activity(self):
        with self.activity_lock:
            self.last_activity_time = time.time()
    
    def get_seconds_since_last_activity(self):
        with self.activity_lock:
            return time.time() - self.last_activity_time
    
    def start_monitoring(self, restart_callback):
        self.restart_callback = restart_callback
        self.stop_monitoring.clear()
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.logger.warning('Activity monitor already running')
            return
            
        self.monitor_thread = threading.Thread(
            target=self._monitor_activity,
            daemon=True,
            name='ActivityMonitor'
        )
        self.monitor_thread.start()
        self.logger.info(f'Activity monitor started (timeout: {self.inactivity_timeout}s)')
    
    def stop_monitor(self):
        self.stop_monitoring.set()
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
            self.logger.info('Activity monitor stopped')
    
    def _monitor_activity(self):
        check_interval = 60  # Check every minute
        
        while not self.stop_monitoring.is_set():
            try:
                seconds_inactive = self.get_seconds_since_last_activity()
                
                # Log status every 15 minutes if inactive
                if seconds_inactive > 0 and seconds_inactive % 900 == 0:
                    minutes_inactive = int(seconds_inactive / 60)
                    self.logger.info(f'No activity for {minutes_inactive} minutes')
                
                # Check if we've exceeded the inactivity timeout
                if seconds_inactive >= self.inactivity_timeout:
                    minutes_inactive = int(seconds_inactive / 60)
                    self.logger.warning(f'Server inactive for {minutes_inactive} minutes, triggering restart')
                    
                    if self.restart_callback:
                        self.restart_callback()

                    break
                
                # Wait for next check or stop signal
                self.stop_monitoring.wait(timeout=check_interval)
                
            except Exception as e:
                self.logger.error(f'Error in activity monitor: {e}')
                time.sleep(check_interval)