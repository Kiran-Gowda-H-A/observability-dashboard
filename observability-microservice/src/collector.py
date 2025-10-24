import threading, time
import psutil
from src import db

class Collector(threading.Thread):
    def __init__(self, interval=10, cpu_threshold=80.0, mem_threshold=80.0):
        super().__init__(daemon=True)
        self.interval = interval
        self.cpu_threshold = cpu_threshold
        self.mem_threshold = mem_threshold
        self._stop = threading.Event()

    def run(self):
        while not self._stop.is_set():
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory().percent
            db.execute('INSERT INTO metrics (metric_type, value) VALUES (?, ?)', ('cpu', cpu))
            db.execute('INSERT INTO metrics (metric_type, value) VALUES (?, ?)', ('memory', mem))
            if cpu > self.cpu_threshold:
                db.execute('INSERT INTO alerts (alert_type, value) VALUES (?, ?)', ('CPU_HIGH', cpu))
            if mem > self.mem_threshold:
                db.execute('INSERT INTO alerts (alert_type, value) VALUES (?, ?)', ('MEMORY_HIGH', mem))
            time.sleep(self.interval)

    def stop(self):
        self._stop.set()
