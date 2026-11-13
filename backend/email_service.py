"""
GapFinder AI - Centralized Resend Email Service
Integrates Resend API with Sending Access Key for Transactional Emails.
"""
import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from backend.email_templates import get_otp_email_content, get_welcome_email_content

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)

RESEND_API_KEY = os.getenv("RESEND_API_KEY") or os.getenv("EMAIL_PROVIDER_API_KEY", "")
EMAIL_PROVIDER_TEMPLATE_KEY = os.getenv("EMAIL_PROVIDER_TEMPLATE_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL") or os.getenv("EMAIL_FROM_ADDRESS", "GapFinder AI <onboarding@resend.dev>")
APP_URL = os.getenv("APP_URL", "http://127.0.0.1:5173")
RESEND_API_ENDPOINT = "https://api.resend.com/emails"

logger = logging.getLogger("gapfinder.email_service")

# Initialize official Resend SDK if available
try:
    import resend
    resend.api_key = RESEND_API_KEY
    _HAS_RESEND_SDK = True
except ImportError:
    _HAS_RESEND_SDK = False

def send_email_via_resend(
    to: str, 
    subject: str, 
    html: str, 
    text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches a transactional email via Resend API using server-side credentials.
    Uses official SDK with direct HTTPS fallback.
    """
    to_email = to.strip().lower()
    from_sender = RESEND_FROM_EMAIL

    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY is not configured in backend environment.")
        return {"success": False, "id": None, "error": "RESEND_API_KEY is not configured."}

    # 1. Try via official Resend SDK
    if _HAS_RESEND_SDK:
        try:
            params: resend.Emails.SendParams = {
                "from": from_sender,
                "to": [to_email],
                "subject": subject,
                "html": html,
            }
            if text:
                params["text"] = text

            response = resend.Emails.send(params)
            email_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", None)
            logger.info(f"Resend email dispatched successfully to {to_email}. Email ID: {email_id}")
            return {"success": True, "id": email_id, "error": None}
        except Exception as sdk_err:
            logger.warning(f"Resend SDK attempt note: {sdk_err}. Trying direct HTTPS request...")

    # 2. Resilient Direct HTTPS API fallback (using urllib)
    try:
        payload = {
            "from": from_sender,
            "to": [to_email],
            "subject": subject,
            "html": html
        }
        if text:
            payload["text"] = text

        req = urllib.request.Request(
            RESEND_API_ENDPOINT,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "GapFinder-AI/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            email_id = data.get("id")
            logger.info(f"Direct Resend API dispatched successfully to {to_email}. Email ID: {email_id}")
            return {"success": True, "id": email_id, "error": None}
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8") if http_err.fp else str(http_err)
        try:
            err_json = json.loads(err_body)
            msg = err_json.get("message", err_body)
        except Exception:
            msg = err_body
        logger.error(f"Resend HTTP {http_err.code} Error delivering to {to_email}: {msg}")
        is_sandbox_block = "testing emails to your own email address" in msg
        return {"success": False, "id": None, "error": f"Resend API error: {msg}", "sandbox_restricted": is_sandbox_block}
    except Exception as e:
        logger.error(f"Network error sending email via Resend to {to_email}: {e}")
        return {"success": False, "id": None, "error": f"Network error: {str(e)}"}

def send_otp_email(
    email: str, 
    code: str, 
    purpose: str = "verification", 
    expires_in_minutes: int = 5
) -> Dict[str, Any]:
    """
    Sends the 6-digit OTP verification email via Resend using the Stitch template.
    """
    subject, html_content, text_content = get_otp_email_content(
        email=email,
        code=code,
        purpose=purpose,
        expires_in_minutes=expires_in_minutes,
        app_name="GapFinder AI"
    )
    res = send_email_via_resend(
        to=email,
        subject=subject,
        html=html_content,
        text=text_content
    )
    if res["success"]:
        print(f"[Resend Email Service] ✉️ Real OTP email delivered to {email} (Resend ID: {res['id']})")
    else:
        print(f"[Resend Email Service] ⚠️ Resend OTP delivery failure for {email}: {res['error']}")
    return res

def send_welcome_email(
    name: str, 
    email: str, 
    login_url: str = "http://127.0.0.1:5173/#login"
) -> Dict[str, Any]:
    """
    Sends the welcome greeting email via Resend upon successful registration and verification.
    """
    subject, html_content, text_content = get_welcome_email_content(
        name=name,
        email=email,
        app_name="GapFinder AI",
        login_url=login_url
    )
    res = send_email_via_resend(
        to=email,
        subject=subject,
        html=html_content,
        text=text_content
    )
    if res["success"]:
        print(f"[Resend Email Service] ✉️ Real Welcome email delivered to {email} (Resend ID: {res['id']})")
    else:
        print(f"[Resend Email Service] ⚠️ Resend Welcome email delivery failure for {email}: {res['error']}")
    return res

def send_revision_reminder_email(
    name: str,
    email: str,
    session_title: str,
    scheduled_date: str,
    scheduled_time: str,
    topic_name: str = "Core Concepts"
) -> Dict[str, Any]:
    """
    Sends the 5-minute pre-revision session reminder email via Resend.
    """
    from backend.email_templates import get_revision_reminder_email_content
    subject, html_content, text_content = get_revision_reminder_email_content(
        email=email,
        name=name,
        session_title=session_title,
        scheduled_date=scheduled_date,
        scheduled_time=scheduled_time,
        topic_name=topic_name,
        app_name="GapFinder AI"
    )
    res = send_email_via_resend(
        to=email,
        subject=subject,
        html=html_content,
        text=text_content
    )
    if res["success"]:
        print(f"[Resend Email Service] ⚡ Revision reminder email delivered to {email} (Resend ID: {res['id']})")
    else:
        print(f"[Resend Email Service] ⚠️ Resend revision reminder notice for {email}: {res['error']}")
    return res
