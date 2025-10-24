import sqlite3
from pathlib import Path
from typing import Optional, Any, Dict

DB_PATH = Path(__file__).resolve().parent.parent / 'data' / 'observability.db'
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript("""    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_type TEXT,
      value REAL,
      ts TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT,
      value REAL,
      ts TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    return conn

# convenience
_conn = init_db()
def execute(query: str, params: tuple=()):
    cur = _conn.cursor()
    cur.execute(query, params)
    _conn.commit()
    return cur

def fetchall(query: str, params: tuple=()):
    cur = _conn.cursor()
    cur.execute(query, params)
    return cur.fetchall()

def fetchone(query: str, params: tuple=()):
    cur = _conn.cursor()
    cur.execute(query, params)
    return cur.fetchone()
