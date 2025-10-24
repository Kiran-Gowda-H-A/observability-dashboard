# src/auth.py
import bcrypt
import secrets
import logging
from typing import Optional
from src import db

logger = logging.getLogger(__name__)
# Session TTL in seconds (1 hour). Adjust as needed.
SESSION_TTL_SECONDS = 3600

def _ensure_bytes(x) -> bytes:
    """
    Normalize value read from DB into bytes suitable for bcrypt.
    SQLite may return bytes, memoryview, or str depending on how it was stored.
    """
    if x is None:
        return b''
    # memoryview -> bytes
    if isinstance(x, memoryview):
        return bytes(x)
    # bytes -> leave as-is
    if isinstance(x, (bytes, bytearray)):
        return bytes(x)
    # str -> encode
    if isinstance(x, str):
        return x.encode('utf-8')
    # fallback
    return str(x).encode('utf-8')

def hash_password(password: str) -> bytes:
    """
    Hash password using bcrypt and return bytes.
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password: str, hashed: bytes) -> bool:
    """
    Return True if password matches hashed (hashed must be bytes).
    """
    try:
        return bcrypt.checkpw(password.encode('utf-8'), _ensure_bytes(hashed))
    except Exception as e:
        logger.exception("Error while checking password")
        return False

def register_user(email: str, password: str) -> bool:
    """
    Create new user. Returns True on success, False on failure (e.g., duplicate).
    """
    hashed = hash_password(password)
    try:
        db.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', (email, hashed))
        logger.info("Registered new user: %s", email)
        return True
    except Exception as e:
        # Log the exception for debugging (unique constraint, etc.)
        logger.warning("Failed to register user %s: %s", email, e)
        return False

def login_user(email: str, password: str) -> Optional[str]:
    """
    Return session token if credentials valid, else None.
    """
    try:
        row = db.fetchone('SELECT id, password_hash FROM users WHERE email = ?', (email,))
        if not row:
            logger.debug("login_user: user not found: %s", email)
            return None

        stored_hash = row['password_hash']
        if not check_password(password, stored_hash):
            logger.debug("login_user: invalid password for %s", email)
            return None

        token = secrets.token_urlsafe(24)
        # insert session with default timestamp (created_at)
        db.execute('INSERT INTO sessions (token, user_id) VALUES (?, ?)', (token, row['id']))
        logger.info("login_user: issued token for user_id=%s", row['id'])
        return token
    except Exception as e:
        logger.exception("Unexpected error during login for %s", email)
        return None

def validate_token(token: str) -> bool:
    """
    Validate token and ensure it is not expired.
    Uses the sessions.created_at timestamp and SESSION_TTL_SECONDS threshold.
    """
    try:
        # compute age (seconds) using SQLite strftime unix epoch
        q = """
        SELECT token,
               (strftime('%s','now') - strftime('%s', created_at)) AS age
        FROM sessions
        WHERE token = ?
        LIMIT 1
        """
        row = db.fetchone(q, (token,))
        if not row:
            logger.debug("validate_token: token not found")
            return False
        age = row['age']
        # if age is NULL somehow, treat as invalid
        if age is None:
            logger.debug("validate_token: token age is None, invalid")
            return False
        try:
            age = int(age)
        except Exception:
            logger.debug("validate_token: could not parse age=%r", age)
            return False
        if age > SESSION_TTL_SECONDS:
            logger.debug("validate_token: token expired (age=%s seconds)", age)
            # optionally delete expired token
            try:
                db.execute('DELETE FROM sessions WHERE token = ?', (token,))
            except Exception:
                logger.warning("Could not delete expired token")
            return False
        # token exists and is within TTL
        return True
    except Exception as e:
        logger.exception("Error validating token")
        return False
