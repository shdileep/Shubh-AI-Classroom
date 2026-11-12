import os
import time
import secrets
import hashlib
import hmac
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from backend.database import get_connection, IS_POSTGRES
from backend.auth import hash_password, verify_password, create_jwt_token, get_current_user
from backend.email_service import send_otp_email, send_welcome_email
from backend.email_templates import resolve_first_name

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_SALT = os.getenv("JWT_SECRET", "gapfinder_super_secret_jwt_key_2026")
DEFAULT_APP_NAME = "GapFinder AI"
DEFAULT_LOGIN_URL = "http://127.0.0.1:5173/#login"

def hash_otp(email: str, otp: str) -> str:
    """Computes a secure SHA-256 HMAC-style hash of the OTP and email with secret salt."""
    raw = f"{email.lower().strip()}:{otp.strip()}:{OTP_SALT}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def normalize_email(email: str) -> str:
    cleaned = email.strip().lower()
    if not cleaned or "@" not in cleaned or "." not in cleaned.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid academic or personal email address is required."
        )
    return cleaned

# =============================================================================
# REQUEST & RESPONSE MODELS
# =============================================================================

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    course: Optional[str] = "MATH 204 · Multivariable Calculus"

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

class SendOtpRequest(BaseModel):
    email: str
    purpose: Optional[str] = "signup_verification"

class ResendOtpRequest(BaseModel):
    email: str
    purpose: Optional[str] = "signup_verification"

class VerifyOtpRequest(BaseModel):
    email: str
    code: str
    purpose: Optional[str] = None

class ClerkSyncRequest(BaseModel):
    clerk_id: str
    email: str
    name: Optional[str] = "Student"
    avatar_url: Optional[str] = None
    course: Optional[str] = "MATH 204 · Multivariable Calculus"

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]
    message: str
    is_new_user: Optional[bool] = False

class GreetingEmailRequest(BaseModel):
    email: str
    name: str
    course: Optional[str] = "MATH 204 · Multivariable Calculus"

# =============================================================================
# 1. SEND OTP ENDPOINT (Resend API + Database Hashing)
# =============================================================================
@router.post("/send-otp")
def send_otp(req: SendOtpRequest):
    req_email = normalize_email(req.email)
    purpose = (req.purpose or "signup_verification").strip()
    now = time.time()

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Check active cooldown to prevent spam & abuse
        q_cooldown = (
            "SELECT cooldown_until FROM email_verifications WHERE email = %s AND purpose = %s ORDER BY id DESC LIMIT 1"
            if IS_POSTGRES else
            "SELECT cooldown_until FROM email_verifications WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1"
        )
        cur.execute(q_cooldown, (req_email, purpose))
        last_row = cur.fetchone()
        if last_row:
            cooldown_until = last_row[0] if IS_POSTGRES else last_row["cooldown_until"]
            if cooldown_until and cooldown_until > now:
                remaining_s = max(1, int(cooldown_until - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {remaining_s} seconds before requesting a new code."
                )

        # Invalidate any previously unverified OTPs for this email and purpose
        q_inval = (
            "UPDATE email_verifications SET verified = -1 WHERE email = %s AND purpose = %s AND verified = 0"
            if IS_POSTGRES else
            "UPDATE email_verifications SET verified = -1 WHERE email = ? AND purpose = ? AND verified = 0"
        )
        cur.execute(q_inval, (req_email, purpose))

        # Generate cryptographically secure random 6-digit OTP
        raw_code = f"{secrets.randbelow(900000) + 100000}"
        hashed_code = hash_otp(req_email, raw_code)
        expires_at = now + 300.0       # 5 minutes expiry
        cooldown_until = now + 60.0    # 60 seconds resend cooldown

        # Insert record into database
        if IS_POSTGRES:
            q_insert = """
                INSERT INTO email_verifications (email, otp_hash, purpose, expires_at, attempts, cooldown_until, verified, delivery_status)
                VALUES (%s, %s, %s, %s, 0, %s, 0, 'sending')
                RETURNING id;
            """
            cur.execute(q_insert, (req_email, hashed_code, purpose, expires_at, cooldown_until))
            verif_id = cur.fetchone()[0]
        else:
            q_insert = """
                INSERT INTO email_verifications (email, otp_hash, purpose, expires_at, attempts, cooldown_until, verified, delivery_status)
                VALUES (?, ?, ?, ?, 0, ?, 0, 'sending');
            """
            cur.execute(q_insert, (req_email, hashed_code, purpose, expires_at, cooldown_until))
            verif_id = cur.lastrowid
        conn.commit()

        # Dispatch real transactional OTP email via Resend
        dispatch_res = send_otp_email(
            email=req_email,
            code=raw_code,
            purpose=purpose,
            expires_in_minutes=5
        )

        resend_email_id = dispatch_res.get("id")
        delivery_status = "sent" if dispatch_res.get("success") else "failed"

        # Update delivery telemetry in database
        q_update = (
            "UPDATE email_verifications SET resend_email_id = %s, delivery_status = %s WHERE id = %s"
            if IS_POSTGRES else
            "UPDATE email_verifications SET resend_email_id = ?, delivery_status = ? WHERE id = ?"
        )
        cur.execute(q_update, (resend_email_id, delivery_status, verif_id))
        conn.commit()

        if not dispatch_res.get("success"):
            err_msg = dispatch_res.get("error", "Email delivery failed.")
            if "You can only send testing emails to your own email address" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Resend Sandbox Mode: In test mode (onboarding@resend.dev), emails can only be delivered to your registered Resend account email (dileepgalla200056@gmail.com). To send OTPs to any student email address, please add and verify your custom domain at https://resend.com/domains and update RESEND_FROM_EMAIL in backend/.env."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Email delivery failed: {err_msg}"
            )

        # Security: DO NOT leak the plaintext OTP code in response or logs
        return {
            "status": "success",
            "message": f"Verification code sent to {req_email}",
            "cooldown_seconds": 60,
            "expires_in_seconds": 300,
            "email_dispatched": dispatch_res.get("success", False),
            "resend_email_id": resend_email_id
        }
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 2. RESEND OTP ENDPOINT (Strict 60s cooldown enforcement)
# =============================================================================
@router.post("/resend-otp")
def resend_otp(req: ResendOtpRequest):
    req_email = normalize_email(req.email)
    purpose = (req.purpose or "signup_verification").strip()
    now = time.time()

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Check cooldown
        q_cooldown = (
            "SELECT cooldown_until FROM email_verifications WHERE email = %s AND purpose = %s ORDER BY id DESC LIMIT 1"
            if IS_POSTGRES else
            "SELECT cooldown_until FROM email_verifications WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1"
        )
        cur.execute(q_cooldown, (req_email, purpose))
        last_row = cur.fetchone()
        if last_row:
            cooldown_until = last_row[0] if IS_POSTGRES else last_row["cooldown_until"]
            if cooldown_until and cooldown_until > now:
                remaining_s = max(1, int(cooldown_until - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {remaining_s} seconds before resending code."
                )

        # Invalidate prior OTPs
        q_inval = (
            "UPDATE email_verifications SET verified = -1 WHERE email = %s AND purpose = %s AND verified = 0"
            if IS_POSTGRES else
            "UPDATE email_verifications SET verified = -1 WHERE email = ? AND purpose = ? AND verified = 0"
        )
        cur.execute(q_inval, (req_email, purpose))

        # Generate new cryptographically secure 6-digit OTP
        raw_code = f"{secrets.randbelow(900000) + 100000}"
        hashed_code = hash_otp(req_email, raw_code)
        expires_at = now + 300.0
        cooldown_until = now + 60.0

        if IS_POSTGRES:
            q_insert = """
                INSERT INTO email_verifications (email, otp_hash, purpose, expires_at, attempts, cooldown_until, verified, delivery_status)
                VALUES (%s, %s, %s, %s, 0, %s, 0, 'sending')
                RETURNING id;
            """
            cur.execute(q_insert, (req_email, hashed_code, purpose, expires_at, cooldown_until))
            verif_id = cur.fetchone()[0]
        else:
            q_insert = """
                INSERT INTO email_verifications (email, otp_hash, purpose, expires_at, attempts, cooldown_until, verified, delivery_status)
                VALUES (?, ?, ?, ?, 0, ?, 0, 'sending');
            """
            cur.execute(q_insert, (req_email, hashed_code, purpose, expires_at, cooldown_until))
            verif_id = cur.lastrowid
        conn.commit()

        # Send via Resend
        dispatch_res = send_otp_email(
            email=req_email,
            code=raw_code,
            purpose=purpose,
            expires_in_minutes=5
        )

        resend_email_id = dispatch_res.get("id")
        delivery_status = "sent" if dispatch_res.get("success") else "failed"

        q_update = (
            "UPDATE email_verifications SET resend_email_id = %s, delivery_status = %s WHERE id = %s"
            if IS_POSTGRES else
            "UPDATE email_verifications SET resend_email_id = ?, delivery_status = ? WHERE id = ?"
        )
        cur.execute(q_update, (resend_email_id, delivery_status, verif_id))
        conn.commit()

        if not dispatch_res.get("success"):
            err_msg = dispatch_res.get("error", "Email delivery failed.")
            if "You can only send testing emails to your own email address" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Resend Sandbox Mode: In test mode (onboarding@resend.dev), emails can only be delivered to your registered Resend account email (dileepgalla200056@gmail.com). To send OTPs to any student email address, please add and verify your custom domain at https://resend.com/domains and update RESEND_FROM_EMAIL in backend/.env."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Email delivery failed: {err_msg}"
            )

        return {
            "status": "success",
            "message": f"New verification code sent to {req_email}",
            "cooldown_seconds": 60,
            "expires_in_seconds": 300,
            "email_dispatched": dispatch_res.get("success", False),
            "resend_email_id": resend_email_id
        }
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 3. VERIFY OTP ENDPOINT (Max 5 attempts, Hash Check, Single-use Invalidation)
# =============================================================================
@router.post("/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    req_email = normalize_email(req.email)
    raw_code = (req.code or "").strip()
    now = time.time()

    if len(raw_code) != 6 or not raw_code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code must be exactly 6 digits."
        )

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Fetch latest active unverified entry
        q_find = (
            "SELECT id, otp_hash, expires_at, attempts, purpose FROM email_verifications WHERE email = %s AND verified = 0 ORDER BY id DESC LIMIT 1"
            if IS_POSTGRES else
            "SELECT id, otp_hash, expires_at, attempts, purpose FROM email_verifications WHERE email = ? AND verified = 0 ORDER BY id DESC LIMIT 1"
        )
        cur.execute(q_find, (req_email,))
        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active verification request found. Please request a new verification code."
            )

        if IS_POSTGRES:
            rec_id, stored_hash, expires_at, attempts, purpose = row
        else:
            rec_id = row["id"]
            stored_hash = row["otp_hash"]
            expires_at = row["expires_at"]
            attempts = row["attempts"]
            purpose = row["purpose"]

        # Check maximum failed attempts (Lockout after 5 failed attempts)
        if attempts >= 5:
            # Invalidate record
            q_lock = (
                "UPDATE email_verifications SET verified = -1 WHERE id = %s"
                if IS_POSTGRES else
                "UPDATE email_verifications SET verified = -1 WHERE id = ?"
            )
            cur.execute(q_lock, (rec_id,))
            conn.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many incorrect attempts. For your security, this verification code has expired. Please request a new code."
            )

        # Check expiration (5 minutes)
        if now > expires_at:
            q_expire = (
                "UPDATE email_verifications SET verified = -1 WHERE id = %s"
                if IS_POSTGRES else
                "UPDATE email_verifications SET verified = -1 WHERE id = ?"
            )
            cur.execute(q_expire, (rec_id,))
            conn.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a fresh code."
            )

        # Constant-time comparison of SHA-256 hash
        expected_hash = hash_otp(req_email, raw_code)
        if not stored_hash or not hmac.compare_digest(stored_hash, expected_hash):
            new_attempts = attempts + 1
            q_inc = (
                "UPDATE email_verifications SET attempts = %s WHERE id = %s"
                if IS_POSTGRES else
                "UPDATE email_verifications SET attempts = ? WHERE id = ?"
            )
            cur.execute(q_inc, (new_attempts, rec_id))
            conn.commit()

            remaining = 5 - new_attempts
            if remaining <= 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many incorrect attempts. This code has been invalidated. Please request a new code."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining} attempt{'s' if remaining > 1 else ''} remaining."
            )

        # Successful verification: Mark as verified, clear hash to prevent replay attack
        q_success = (
            "UPDATE email_verifications SET verified = 1, verified_at = %s, otp_hash = NULL WHERE id = %s"
            if IS_POSTGRES else
            "UPDATE email_verifications SET verified = 1, verified_at = ?, otp_hash = NULL WHERE id = ?"
        )
        cur.execute(q_success, (now, rec_id))
        conn.commit()

        return {
            "status": "success",
            "verified": True,
            "message": "Verification code confirmed successfully."
        }
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 4. SIGN UP ENDPOINT (Mandatory OTP Verification + Automatic Welcome Email)
# =============================================================================
@router.post("/signup", response_model=AuthResponse)
def signup(req: SignUpRequest):
    req_name = req.name.strip()
    req_email = normalize_email(req.email)
    
    if not req_name or len(req_name) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check if email is already registered
        query_email = "SELECT id FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id FROM users WHERE email = ?"
        cur.execute(query_email, (req_email,))
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with email '{req_email}' already exists. Please sign in."
            )

        # Check if username/name is already taken
        query_name = "SELECT id FROM users WHERE name = %s" if IS_POSTGRES else "SELECT id FROM users WHERE name = ?"
        cur.execute(query_name, (req_name,))
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Username '{req_name}' is already taken. Please choose another name."
            )

        # MANDATORY EMAIL OTP VERIFICATION CHECK:
        # Email must be verified within the last 15 minutes (900 seconds)
        now = time.time()
        q_verify_check = (
            "SELECT id, verified_at FROM email_verifications WHERE email = %s AND verified = 1 AND verified_at > %s ORDER BY id DESC LIMIT 1"
            if IS_POSTGRES else
            "SELECT id, verified_at FROM email_verifications WHERE email = ? AND verified = 1 AND verified_at > ? ORDER BY id DESC LIMIT 1"
        )
        cur.execute(q_verify_check, (req_email, now - 900.0))
        verif_row = cur.fetchone()
        if not verif_row:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification is mandatory before registration. Please verify your email with the 6-digit OTP code first."
            )

        # Hash password and insert user with email_verified = True/1
        pwd_hash = hash_password(req.password)
        if IS_POSTGRES:
            insert_user = """
                INSERT INTO users (name, email, password_hash, role, course, email_verified, welcome_email_sent)
                VALUES (%s, %s, %s, 'student', %s, TRUE, FALSE)
                RETURNING id, name, email, role, course, created_at;
            """
            cur.execute(insert_user, (req_name, req_email, pwd_hash, req.course))
            new_user_row = cur.fetchone()
            user_id = new_user_row[0]
            user_data = {
                "id": user_id,
                "name": new_user_row[1],
                "email": new_user_row[2],
                "role": new_user_row[3],
                "course": new_user_row[4],
            }
        else:
            insert_user = """
                INSERT INTO users (name, email, password_hash, role, course, email_verified, welcome_email_sent)
                VALUES (?, ?, ?, 'student', ?, 1, 0);
            """
            cur.execute(insert_user, (req_name, req_email, pwd_hash, req.course))
            user_id = cur.lastrowid
            user_data = {
                "id": user_id,
                "name": req_name,
                "email": req_email,
                "role": "student",
                "course": req.course,
            }

        # Seed initial knowledge gaps for the new user
        initial_gaps = [
            ("Quadratic Roots & Nullity", 32, "High", "Critical Gap"),
            ("Matrix Rank & Vector Pivot", 41, "High", "Needs Review"),
            ("Jordan Canonical Form", 45, "High", "Needs Review"),
            ("Orthogonal Projections", 68, "Medium", "In Progress"),
            ("Vector Subspaces", 71, "Medium", "In Progress"),
            ("Linear Systems & Solvability", 96, "Low", "Mastered"),
            ("Matrix Determinants", 94, "Low", "Mastered"),
        ]
        
        for topic, score, prio, stat in initial_gaps:
            if IS_POSTGRES:
                cur.execute(
                    "INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, topic, score, prio, stat)
                )
            else:
                cur.execute(
                    "INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status) VALUES (?, ?, ?, ?, ?)",
                    (user_id, topic, score, prio, stat)
                )

        conn.commit()

        # AUTOMATIC WELCOME EMAIL (Dispatched strictly once upon account creation)
        welcome_res = send_welcome_email(
            name=req_name,
            email=req_email,
            login_url=DEFAULT_LOGIN_URL
        )
        if welcome_res.get("success"):
            resend_id = welcome_res.get("id")
            q_welc = (
                "UPDATE users SET welcome_email_sent = TRUE, welcome_email_resend_id = %s WHERE id = %s"
                if IS_POSTGRES else
                "UPDATE users SET welcome_email_sent = 1, welcome_email_resend_id = ? WHERE id = ?"
            )
            cur.execute(q_welc, (resend_id, user_id))
            conn.commit()

        token = create_jwt_token({
            "sub": str(user_id),
            "email": user_data["email"],
            "name": user_data["name"]
        })

        return AuthResponse(
            token=token,
            user=user_data,
            message="Account created successfully",
            is_new_user=True
        )
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 5. LOGIN ENDPOINT
# =============================================================================
@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    req_email = normalize_email(req.email)
    
    conn = get_connection()
    cur = conn.cursor()
    try:
        query = "SELECT id, name, email, password_hash, role, course FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id, name, email, password_hash, role, course FROM users WHERE email = ?"
        cur.execute(query, (req_email,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. No account found with that email address."
            )

        if IS_POSTGRES:
            user_id, name, email, pwd_hash, role, course = row
        else:
            user_id = row["id"]
            name = row["name"]
            email = row["email"]
            pwd_hash = row["password_hash"]
            role = row["role"]
            course = row["course"]

        if not verify_password(req.password, pwd_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Incorrect password."
            )

        token = create_jwt_token({
            "sub": str(user_id),
            "email": email,
            "name": name
        })

        return AuthResponse(
            token=token,
            user={
                "id": user_id,
                "name": name,
                "email": email,
                "role": role,
                "course": course
            },
            message="Sign in successful",
            is_new_user=False
        )
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 6. FORGOT & RESET PASSWORD ENDPOINTS (Verified with OTP)
# =============================================================================
@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    req_email = normalize_email(req.email)
    conn = get_connection()
    cur = conn.cursor()
    try:
        query = "SELECT id, name FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id, name FROM users WHERE email = ?"
        cur.execute(query, (req_email,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address. Please verify or create an account."
            )
        return {
            "status": "success",
            "message": f"Password reset verified for {req_email}.",
            "email": req_email
        }
    finally:
        cur.close()
        conn.close()

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    req_email = normalize_email(req.email)
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Check user exists
        query = "SELECT id FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id FROM users WHERE email = ?"
        cur.execute(query, (req_email,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="No account registered with this email address.")
        user_id = row[0] if IS_POSTGRES else row["id"]

        # Ensure OTP verification was completed for this email within the last 15 minutes
        now = time.time()
        q_verif = (
            "SELECT id FROM email_verifications WHERE email = %s AND verified = 1 AND verified_at > %s ORDER BY id DESC LIMIT 1"
            if IS_POSTGRES else
            "SELECT id FROM email_verifications WHERE email = ? AND verified = 1 AND verified_at > ? ORDER BY id DESC LIMIT 1"
        )
        cur.execute(q_verif, (req_email, now - 900.0))
        verif_row = cur.fetchone()
        if not verif_row:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email OTP verification is required before resetting your password."
            )
        verif_id = verif_row[0] if IS_POSTGRES else verif_row["id"]

        # Update password hash
        new_hash = hash_password(req.new_password)
        update_query = "UPDATE users SET password_hash = %s WHERE id = %s" if IS_POSTGRES else "UPDATE users SET password_hash = ? WHERE id = ?"
        cur.execute(update_query, (new_hash, user_id))

        # Invalidate the verification record so it cannot be reused
        q_close = (
            "UPDATE email_verifications SET verified = 2 WHERE id = %s"
            if IS_POSTGRES else
            "UPDATE email_verifications SET verified = 2 WHERE id = ?"
        )
        cur.execute(q_close, (verif_id,))
        conn.commit()

        return {
            "status": "success",
            "message": "Password successfully updated. You may now sign in with your new credentials."
        }
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 7. CLERK SYNC ENDPOINT (With First-Time Google OAuth Welcome Email)
# =============================================================================
@router.post("/clerk-sync", response_model=AuthResponse)
def clerk_sync(req: ClerkSyncRequest):
    req_clerk_id = req.clerk_id.strip()
    req_email = normalize_email(req.email)
    req_name = (req.name or "Student").strip()
    req_course = req.course or "MATH 204 · Multivariable Calculus"

    if not req_clerk_id:
        raise HTTPException(status_code=400, detail="Clerk user ID is required")

    conn = get_connection()
    cur = conn.cursor()
    is_new_user = False
    welcome_needed = False
    try:
        # 1. Check if user already exists with this clerk_id
        q_clerk = "SELECT id, name, email, role, course, welcome_email_sent FROM users WHERE clerk_id = %s" if IS_POSTGRES else "SELECT id, name, email, role, course, welcome_email_sent FROM users WHERE clerk_id = ?"
        cur.execute(q_clerk, (req_clerk_id,))
        row = cur.fetchone()

        if row:
            user_id = row[0] if IS_POSTGRES else row["id"]
            user_name = row[1] if IS_POSTGRES else row["name"]
            user_email = row[2] if IS_POSTGRES else row["email"]
            user_role = row[3] if IS_POSTGRES else row["role"]
            user_course = row[4] if IS_POSTGRES else row["course"]
            welcome_sent = row[5] if IS_POSTGRES else row.get("welcome_email_sent", 0)
            is_new_user = False
        else:
            # 2. Check if user exists with matching email
            q_email = "SELECT id, name, email, role, course, welcome_email_sent FROM users WHERE email = %s" if IS_POSTGRES else "SELECT id, name, email, role, course, welcome_email_sent FROM users WHERE email = ?"
            cur.execute(q_email, (req_email,))
            email_row = cur.fetchone()

            if email_row:
                user_id = email_row[0] if IS_POSTGRES else email_row["id"]
                user_name = email_row[1] if IS_POSTGRES else email_row["name"]
                user_email = email_row[2] if IS_POSTGRES else email_row["email"]
                user_role = email_row[3] if IS_POSTGRES else email_row["role"]
                user_course = email_row[4] if IS_POSTGRES else email_row["course"]
                welcome_sent = email_row[5] if IS_POSTGRES else email_row.get("welcome_email_sent", 0)
                # Link clerk_id and mark email_verified = True
                u_clerk = "UPDATE users SET clerk_id = %s, email_verified = TRUE WHERE id = %s" if IS_POSTGRES else "UPDATE users SET clerk_id = ?, email_verified = 1 WHERE id = ?"
                cur.execute(u_clerk, (req_clerk_id, user_id))
                conn.commit()
                is_new_user = False
            else:
                # 3. Create new user for this Clerk Google account
                is_new_user = True
                welcome_needed = True
                q_name = "SELECT id FROM users WHERE name = %s" if IS_POSTGRES else "SELECT id FROM users WHERE name = ?"
                cur.execute(q_name, (req_name,))
                if cur.fetchone():
                    req_name = f"{req_name} ({req_email.split('@')[0]})"

                pwd_hash = "clerk_google_oauth_verified"
                if IS_POSTGRES:
                    ins = """
                        INSERT INTO users (name, email, password_hash, role, course, clerk_id, email_verified, welcome_email_sent)
                        VALUES (%s, %s, %s, 'student', %s, %s, TRUE, FALSE)
                        RETURNING id, name, email, role, course;
                    """
                    cur.execute(ins, (req_name, req_email, pwd_hash, req_course, req_clerk_id))
                    new_user = cur.fetchone()
                    user_id = new_user[0]
                    user_name = new_user[1]
                    user_email = new_user[2]
                    user_role = new_user[3]
                    user_course = new_user[4]
                else:
                    ins = """
                        INSERT INTO users (name, email, password_hash, role, course, clerk_id, email_verified, welcome_email_sent)
                        VALUES (?, ?, ?, 'student', ?, ?, 1, 0);
                    """
                    cur.execute(ins, (req_name, req_email, pwd_hash, req_course, req_clerk_id))
                    user_id = cur.lastrowid
                    user_name = req_name
                    user_email = req_email
                    user_role = "student"
                    user_course = req_course

                # Seed initial knowledge gaps for the new Google student
                initial_gaps = [
                    ("Quadratic Roots & Nullity", 32, "High", "Critical Gap"),
                    ("Matrix Rank & Vector Pivot", 41, "High", "Needs Review"),
                    ("Jordan Canonical Form", 45, "High", "Needs Review"),
                    ("Orthogonal Projections", 68, "Medium", "In Progress"),
                    ("Vector Subspaces", 71, "Medium", "In Progress"),
                    ("Linear Systems & Solvability", 96, "Low", "Mastered"),
                    ("Matrix Determinants", 94, "Low", "Mastered"),
                ]
                for topic, score, prio, stat in initial_gaps:
                    if IS_POSTGRES:
                        cur.execute(
                            "INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status) VALUES (%s, %s, %s, %s, %s)",
                            (user_id, topic, score, prio, stat)
                        )
                    else:
                        cur.execute(
                            "INSERT INTO knowledge_gaps (user_id, topic, mastery_score, priority, status) VALUES (?, ?, ?, ?, ?)",
                            (user_id, topic, score, prio, stat)
                        )
                conn.commit()

        # Send welcome email via Resend if new user and not yet sent
        if welcome_needed:
            w_res = send_welcome_email(
                name=user_name,
                email=user_email,
                login_url=DEFAULT_LOGIN_URL
            )
            if w_res.get("success"):
                w_id = w_res.get("id")
                q_up = (
                    "UPDATE users SET welcome_email_sent = TRUE, welcome_email_resend_id = %s WHERE id = %s"
                    if IS_POSTGRES else
                    "UPDATE users SET welcome_email_sent = 1, welcome_email_resend_id = ? WHERE id = ?"
                )
                cur.execute(q_up, (w_id, user_id))
                conn.commit()

        token = create_jwt_token({
            "sub": str(user_id),
            "email": user_email,
            "name": user_name,
            "clerk_id": req_clerk_id
        })

        return AuthResponse(
            token=token,
            user={
                "id": user_id,
                "name": user_name,
                "email": user_email,
                "role": user_role,
                "course": user_course,
                "clerk_id": req_clerk_id,
                "avatar_url": req.avatar_url
            },
            message="Google OAuth session authenticated.",
            is_new_user=is_new_user
        )
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 8. RESEND WEBHOOK ENDPOINT (Delivery Tracking & Status Ingestion)
# =============================================================================
@router.post("/webhooks/resend")
async def resend_webhook(request: Request):
    """
    Receives Resend Webhook delivery events:
    - email.sent
    - email.delivered
    - email.delivery_delayed
    - email.bounced
    - email.failed
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("type", "unknown")
    event_data = payload.get("data", {})
    email_id = event_data.get("email_id") or event_data.get("id")

    if not email_id:
        return {"status": "ignored", "reason": "No email_id in event"}

    print(f"[Resend Webhook] 🔔 Received event: {event_type} for Email ID: {email_id}")

    conn = get_connection()
    cur = conn.cursor()
    try:
        # Update delivery_status in email_verifications
        q = (
            "UPDATE email_verifications SET delivery_status = %s WHERE resend_email_id = %s"
            if IS_POSTGRES else
            "UPDATE email_verifications SET delivery_status = ? WHERE resend_email_id = ?"
        )
        cur.execute(q, (event_type, email_id))
        conn.commit()
        return {"status": "success", "event": event_type, "email_id": email_id}
    finally:
        cur.close()
        conn.close()

# =============================================================================
# 9. BACKWARD COMPATIBILITY & USER PROFILE
# =============================================================================
@router.post("/send-greeting-email")
def send_greeting_email(req: GreetingEmailRequest):
    req_email = normalize_email(req.email)
    req_name = req.name.strip()
    res = send_welcome_email(
        name=req_name,
        email=req_email,
        login_url=DEFAULT_LOGIN_URL
    )
    return {
        "status": "success",
        "message": f"Warm greeting email delivered to {req_email}",
        "recipient": req_name,
        "email": req_email,
        "resend_id": res.get("id"),
        "success": res.get("success", False)
    }

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["sub"]
    conn = get_connection()
    cur = conn.cursor()
    try:
        query = "SELECT id, name, email, role, course, created_at, email_verified, welcome_email_sent FROM users WHERE id = %s" if IS_POSTGRES else "SELECT id, name, email, role, course, created_at, email_verified, welcome_email_sent FROM users WHERE id = ?"
        cur.execute(query, (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        if IS_POSTGRES:
            return {
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "role": row[3],
                "course": row[4],
                "created_at": str(row[5]),
                "email_verified": bool(row[6]),
                "welcome_email_sent": bool(row[7])
            }
        else:
            return {
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "role": row["role"],
                "course": row["course"],
                "created_at": str(row["created_at"]),
                "email_verified": bool(row.get("email_verified", 0)),
                "welcome_email_sent": bool(row.get("welcome_email_sent", 0))
            }
    finally:
        cur.close()
        conn.close()
