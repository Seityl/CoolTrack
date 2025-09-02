import multiprocessing
import os

bind = "0.0.0.0:5000"
backlog = 1024

workers = min(multiprocessing.cpu_count() * 2, 8)
worker_class = "sync"
worker_connections = 1000
timeout = 60
keepalive = 5

max_requests = 2000
max_requests_jitter = 100
preload_app = True

log_dir = "/home/frappe/frappe-bench/apps/cooltrack/cooltrack/logs"
os.makedirs(log_dir, exist_ok=True)

accesslog = f"{log_dir}/push_relay.access.log"
errorlog = f"{log_dir}/push_relay.error.log"
loglevel = "info"
capture_output = True

access_log_format = '%(t)s "%(r)s" %(s)s %(D)s %(b)s'

proc_name = "push_notification_relay"
pidfile = f"{log_dir}/push_relay.pid"

daemon = False
reload = False