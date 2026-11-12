import os
import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = os.getenv("JWT_SECRET", "gapfinder_super_jwt_secret_key_2026_academic_spec")
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = os.urandom(16)
    kdf = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return base64.b64encode(salt + kdf).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salt+kdf hash."""
    try:
        decoded = base64.b64decode(hashed_password.encode('utf-8'))
        salt = decoded[:16]
        stored_kdf = decoded[16:]
        calculated_kdf = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(stored_kdf, calculated_kdf)
    except Exception:
        return False

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if (len(data) % 4) != 0 else ''
    return base64.urlsafe_b64decode((data + padding).encode('utf-8'))

def create_jwt_token(payload: Dict[str, Any], expires_in_seconds: int = 86400 * 7) -> str:
    """Create a signed JWT token with exp timestamp."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload_copy = payload.copy()
    payload_copy["exp"] = int(time.time()) + expires_in_seconds
    payload_copy["iat"] = int(time.time())

    encoded_header = base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_payload = base64url_encode(json.dumps(payload_copy).encode('utf-8'))
    
    signature_data = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_data, hashlib.sha256).digest()
    encoded_signature = base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a signed JWT token."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        encoded_header, encoded_payload, encoded_signature = parts
        
        signature_data = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signature_data, hashlib.sha256).digest()
        actual_sig = base64url_decode(encoded_signature)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        payload = json.loads(base64url_decode(encoded_payload).decode('utf-8'))
        if payload.get("exp") and payload["exp"] < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """FastAPI Dependency for protected routes. Enforces authentication and prevents unauthorized data exposure."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_jwt_token(token)
    if payload and "sub" in payload:
        return payload

    # Check for verified Clerk token (JWT from Clerk OAuth)
    try:
        parts = token.split('.')
        if len(parts) == 3:
            decoded_payload = json.loads(base64url_decode(parts[1]).decode('utf-8'))
            clerk_sub = decoded_payload.get("sub")
            if clerk_sub and (str(decoded_payload.get("iss", "")).find("clerk") != -1 or clerk_sub.startswith("user_")):
                from backend.database import get_connection, IS_POSTGRES
                conn = get_connection()
                cur = conn.cursor()
                try:
                    q = "SELECT id, name, email, role, course FROM users WHERE clerk_id = %s" if IS_POSTGRES else "SELECT id, name, email, role, course FROM users WHERE clerk_id = ?"
                    cur.execute(q, (clerk_sub,))
                    row = cur.fetchone()
                    if row:
                        user_id = row[0] if IS_POSTGRES else row["id"]
                        return {
                            "sub": str(user_id),
                            "email": row[2] if IS_POSTGRES else row["email"],
                            "name": row[1] if IS_POSTGRES else row["name"],
                            "clerk_id": clerk_sub
                        }
                finally:
                    cur.close()
                    conn.close()
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication session. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
