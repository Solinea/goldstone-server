# settings.py example
import multiprocessing

# listen address
bind = "0.0.0.0:8000"

chdir = "/app"

# worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"

# logs
loglevel = "info"
accesslog = "-"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
errorlog = "-"