import os
import sys
import json
import base64
import hmac
import hashlib
import secrets
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from pathlib import Path

# Ensure backend directory in sys.path
_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from models import User

# Demo Password used across all demo accounts for testing
# Clearly labeled DEMO ONLY credentials
DEMO_PASSWORD = "DemoPassword123!"

# Secret key for signing authentication tokens
AUTH_SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "landtrace360-auth-secret-key-2026-demo-safety")

# Set of revoked tokens for logout support
_REVOKED_TOKENS = set()

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a unique salt.
    Never stores or persists plain text passwords.
    """
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return key.hex(), salt

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """
    Verifies a plain password against the stored hash and salt using constant-time comparison.
    """
    key, _ = hash_password(plain_password, salt)
    return hmac.compare_digest(key, hashed_password)

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed bearer token containing payload claims and HMAC-SHA256 signature.
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)
    
    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp())
    })
    
    payload_json = json.dumps(to_encode, separators=(',', ':'), sort_keys=True).encode('utf-8')
    payload_b64 = _base64url_encode(payload_json)
    
    signature = hmac.new(
        AUTH_SECRET_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    sig_b64 = _base64url_encode(signature)
    
    return f"{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies token signature, expiry, and revocation status.
    Returns decoded claims or None if invalid.
    """
    if not token or token in _REVOKED_TOKENS:
        return None
    
    parts = token.strip().split('.')
    if len(parts) != 2:
        return None
    
    payload_b64, sig_b64 = parts
    try:
        expected_sig = hmac.new(
            AUTH_SECRET_KEY.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).digest()
        actual_sig = _base64url_decode(sig_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
        
        return payload
    except Exception:
        return None

def revoke_token(token: str) -> bool:
    """Adds a token to the revoked tokens blacklist."""
    if token:
        _REVOKED_TOKENS.add(token.strip())
        return True
    return False

# Initialize pre-computed hashed demo accounts
_demo_owner_hash, _demo_owner_salt = hash_password(DEMO_PASSWORD)
_demo_buyer_hash, _demo_buyer_salt = hash_password(DEMO_PASSWORD)
_demo_investigator_hash, _demo_investigator_salt = hash_password(DEMO_PASSWORD)

DEMO_ACCOUNTS_DEF = [
    {
        "id": "USR-DEMO-OWNER-001",
        "email": "owner@landtrace360.demo",
        "full_name": "Rajesh Kumar (Land Owner)",
        "role": "owner",
        "hashed_password": _demo_owner_hash,
        "salt": _demo_owner_salt,
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": "USR-DEMO-BUYER-002",
        "email": "buyer@landtrace360.demo",
        "full_name": "Priya Sharma (Buyer)",
        "role": "buyer",
        "hashed_password": _demo_buyer_hash,
        "salt": _demo_buyer_salt,
        "is_active": True,
        "created_at": datetime.utcnow()
    },
    {
        "id": "USR-DEMO-INVESTIGATOR-003",
        "email": "investigator@landtrace360.demo",
        "full_name": "Dr. Ananya Iyer (Investigator)",
        "role": "investigator",
        "hashed_password": _demo_investigator_hash,
        "salt": _demo_investigator_salt,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
]

# In-memory users repository (stores demo accounts and newly registered accounts)
IN_MEMORY_USERS: Dict[str, Dict[str, Any]] = {
    u["email"].lower(): u.copy() for u in DEMO_ACCOUNTS_DEF
}

def seed_demo_users_in_db(db) -> None:
    """Seeds demo accounts into PostgreSQL if not already present."""
    if not db:
        return
    try:
        for acc in DEMO_ACCOUNTS_DEF:
            existing = db.query(User).filter(User.email == acc["email"]).first()
            if not existing:
                new_u = User(
                    id=acc["id"],
                    email=acc["email"],
                    full_name=acc["full_name"],
                    role=acc["role"],
                    hashed_password=acc["hashed_password"],
                    salt=acc["salt"],
                    is_active=True,
                    created_at=acc["created_at"]
                )
                db.add(new_u)
        db.commit()
    except Exception as e:
        db.rollback()

def _sanitize_user_dict(user_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Strips password hashes and internal salts from returned user objects."""
    return {
        "id": user_dict.get("id"),
        "email": user_dict.get("email"),
        "full_name": user_dict.get("full_name"),
        "role": user_dict.get("role", "buyer"),
        "is_active": user_dict.get("is_active", True),
        "created_at": str(user_dict.get("created_at", ""))
    }

def register_user(
    db,
    full_name: str,
    email: str,
    password: str,
    role: str = "buyer"
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Registers a new user account with hashed password and role assignment.
    Returns (user_dict, error_message).
    """
    # Validation
    name_clean = full_name.strip()
    if not name_clean:
        return None, "Full name is required."
    
    email_clean = email.strip().lower()
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email_clean):
        return None, "Please enter a valid email address."
    
    if len(password) < 6:
        return None, "Password must be at least 6 characters long."
    
    valid_roles = ["owner", "buyer", "investigator"]
    normalized_role = role.strip().lower()
    if normalized_role not in valid_roles:
        normalized_role = "buyer"
    
    # Check if already exists in DB
    if db:
        try:
            existing_db = db.query(User).filter(User.email == email_clean).first()
            if existing_db:
                return None, "An account with this email address already exists."
        except Exception:
            pass
    
    # Check if exists in memory
    if email_clean in IN_MEMORY_USERS:
        return None, "An account with this email address already exists."
    
    # Hash password with fresh salt
    hashed_pwd, salt = hash_password(password)
    user_id = f"USR-{secrets.token_hex(4).upper()}"
    now = datetime.utcnow()
    
    user_record = {
        "id": user_id,
        "email": email_clean,
        "full_name": name_clean,
        "role": normalized_role,
        "hashed_password": hashed_pwd,
        "salt": salt,
        "is_active": True,
        "created_at": now
    }
    
    # Store in memory
    IN_MEMORY_USERS[email_clean] = user_record
    
    # Store in DB if available
    if db:
        try:
            db_user = User(
                id=user_id,
                email=email_clean,
                full_name=name_clean,
                role=normalized_role,
                hashed_password=hashed_pwd,
                salt=salt,
                is_active=True,
                created_at=now
            )
            db.add(db_user)
            db.commit()
        except Exception as e:
            db.rollback()
    
    return _sanitize_user_dict(user_record), None

def authenticate_user(
    db,
    email: str,
    password: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Validates user credentials against stored hash.
    Returns (user_dict, error_message).
    """
    email_clean = email.strip().lower()
    user_data = None
    
    # 1. Try DB first
    if db:
        try:
            db_u = db.query(User).filter(User.email == email_clean).first()
            if db_u:
                user_data = {
                    "id": db_u.id,
                    "email": db_u.email,
                    "full_name": db_u.full_name,
                    "role": db_u.role,
                    "hashed_password": db_u.hashed_password,
                    "salt": db_u.salt,
                    "is_active": db_u.is_active,
                    "created_at": db_u.created_at
                }
        except Exception:
            pass
            
    # 2. Fall back to in-memory
    if not user_data and email_clean in IN_MEMORY_USERS:
        user_data = IN_MEMORY_USERS[email_clean]
        
    if not user_data:
        return None, "Invalid email or password."
    
    if not user_data.get("is_active", True):
        return None, "This account is inactive. Please contact support."
    
    # Constant-time password verification
    if not verify_password(password, user_data["hashed_password"], user_data["salt"]):
        return None, "Invalid email or password."
    
    return _sanitize_user_dict(user_data), None

def get_user_by_id(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Fetches user profile by ID without secret keys."""
    if not user_id:
        return None
    
    # Try DB
    if db:
        try:
            db_u = db.query(User).filter(User.id == user_id).first()
            if db_u:
                return {
                    "id": db_u.id,
                    "email": db_u.email,
                    "full_name": db_u.full_name,
                    "role": db_u.role,
                    "is_active": db_u.is_active,
                    "created_at": str(db_u.created_at)
                }
        except Exception:
            pass
            
    # Try in-memory
    for u in IN_MEMORY_USERS.values():
        if u.get("id") == user_id:
            return _sanitize_user_dict(u)
            
    return None
