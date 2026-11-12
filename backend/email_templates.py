"""
GapFinder AI - Resend Transactional Email Templates
Exact alignment with Stitch Project 6168294121474996000 design specifications.
"""
from typing import Tuple

def resolve_first_name(name: str) -> str:
    if not name:
        return "Student"
    parts = name.strip().split()
    if len(parts) > 1 and parts[0].lower() == "galla":
        return parts[1]
    return parts[0] or "Student"

def get_otp_email_content(
    email: str, 
    code: str, 
    purpose: str = "verification",
    expires_in_minutes: int = 5, 
    app_name: str = "GapFinder AI"
) -> Tuple[str, str, str]:
    """
    Returns (subject, html_content, text_content) for OTP verification email.
    """
    first_name = resolve_first_name(email.split("@")[0].capitalize())
    
    if purpose == "password_reset":
        subject = f"{code} is your {app_name} password reset code"
        title = "Reset Your Password"
        subheading = "Forgot your password? Don't worry, here is your verification code."
        explanation = f"We received a request to reset the password for your {app_name} account ({email}). Enter the 6-digit code below to set a new password and restore your access."
    else:
        subject = f"{code} is your {app_name} verification code"
        title = "Confirm Your Email Address"
        subheading = f"Welcome to {app_name}. Please verify your email to get started."
        explanation = f"Thank you for registering with {app_name} ({email}). Enter the 6-digit verification code below to verify your student email and activate your workspace."

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{ margin: 0; padding: 32px 16px; background-color: #F5F2EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C2024; -webkit-font-smoothing: antialiased; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #FAF8F5; border: 1px solid #ECE6DC; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(13,17,23,0.06); }}
    .top-bar {{ height: 6px; width: 100%; background: linear-gradient(90deg, #0D1117 0%, #0a2d21 50%, #0dfa6c 100%); }}
    .content {{ padding: 36px 32px; }}
    .header {{ margin-bottom: 24px; }}
    .logo-badge {{ display: inline-flex; align-items: center; gap: 8px; }}
    .brand-title {{ font-family: Georgia, serif; font-style: italic; font-size: 22px; color: #0D1117; font-weight: 600; vertical-align: middle; }}
    .ai-pill {{ background: #0D1117; color: #FAF8F5; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px; vertical-align: middle; margin-left: 6px; display: inline-block; }}
    .white-card {{ background: #ffffff; border: 1px solid #ECE6DC; border-radius: 18px; padding: 28px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); text-align: left; }}
    .greeting {{ font-family: Georgia, serif; font-size: 26px; color: #0b0f10; margin: 0 0 6px 0; font-weight: normal; }}
    .subgreeting {{ font-family: Georgia, serif; font-style: italic; font-size: 15px; color: #57534E; margin: 0 0 14px 0; }}
    .body-text {{ font-size: 13.5px; line-height: 1.6; color: #57534E; margin: 0 0 20px 0; }}
    .otp-box {{ background: #FAF8F5; border: 2px solid #0D1117; border-radius: 14px; padding: 18px; text-align: center; margin: 22px 0; }}
    .otp-code {{ font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #0D1117; display: block; }}
    .otp-caption {{ font-size: 11px; color: #78716C; margin-top: 8px; font-weight: 500; }}
    .signature-div {{ border-top: 1px solid #E7E5E4; padding-top: 16px; margin-top: 20px; }}
    .sig-warmly {{ font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #78716C; margin-bottom: 2px; }}
    .sig-team {{ font-family: Georgia, serif; font-size: 14px; font-weight: 600; color: #0b0f10; }}
    .bottom-realm {{ background: #F5F1EB; border: 1px solid #E4DCcf; border-radius: 16px; padding: 18px; margin-bottom: 18px; text-align: left; }}
    .realm-title {{ font-family: Georgia, serif; font-size: 15px; color: #0D1117; font-weight: 600; margin: 0 0 2px 0; }}
    .realm-desc {{ font-size: 11.5px; color: #78716C; margin: 0; }}
    .footer {{ font-size: 11px; color: #8A857D; text-align: center; border-top: 1px solid #ECE6DC; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="top-bar"></div>
    <div class="content">
      <div class="header">
        <span class="brand-title">{app_name}</span>
        <span class="ai-pill">AI</span>
      </div>

      <div class="white-card">
        <h1 class="greeting">Hi {first_name},</h1>
        <p class="subgreeting">{subheading}</p>
        <p class="body-text">{explanation}</p>

        <div class="otp-box">
          <span class="otp-code">{code}</span>
          <div class="otp-caption">Valid for {expires_in_minutes} minutes &middot; Do not share this code</div>
        </div>

        <p class="body-text" style="font-size: 12px; margin-bottom: 0;">
          If you did not initiate this request, you can safely ignore this email. Your account remains protected.
        </p>

        <div class="signature-div">
          <div class="sig-warmly">Warmly,</div>
          <div class="sig-team">The {app_name} Team</div>
        </div>
      </div>

      <div class="bottom-realm">
        <h4 class="realm-title">{app_name} Security</h4>
        <p class="realm-desc">Encrypted authentication &middot; Bayesian diagnostic telemetry ready.</p>
      </div>

      <div class="footer">
        Sent to {email} &nbsp;&middot;&nbsp; Documentation &nbsp;&middot;&nbsp; Support &nbsp;&middot;&nbsp; &copy; 2026 {app_name}
      </div>
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Hi {first_name},

{subheading}

Your {app_name} 6-digit verification code is: {code}

This code will expire in {expires_in_minutes} minutes. Do not share this code with anyone.

If you did not request this verification, please disregard this message.

Warmly,
The {app_name} Team
Sent to {email} | (c) 2026 {app_name}
"""
    return subject, html_content, text_content

def get_welcome_email_content(
    name: str, 
    email: str, 
    app_name: str = "GapFinder AI", 
    login_url: str = "http://127.0.0.1:5173/#login"
) -> Tuple[str, str, str]:
    """
    Returns (subject, html_content, text_content) for newly registered welcome email.
    """
    first_name = resolve_first_name(name)
    subject = f"Welcome to {app_name}, {first_name}! Your workspace is ready"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{ margin: 0; padding: 32px 16px; background-color: #F5F2EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C2024; -webkit-font-smoothing: antialiased; }}
    .container {{ max-width: 580px; margin: 0 auto; background: #FAF8F5; border: 1px solid #ECE6DC; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(13,17,23,0.06); }}
    .top-bar {{ height: 6px; width: 100%; background: linear-gradient(90deg, #0D1117 0%, #0a2d21 50%, #0dfa6c 100%); }}
    .content {{ padding: 36px 32px; }}
    .header {{ margin-bottom: 24px; }}
    .brand-title {{ font-family: Georgia, serif; font-style: italic; font-size: 22px; color: #0D1117; font-weight: 600; vertical-align: middle; }}
    .ai-pill {{ background: #0D1117; color: #FAF8F5; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px; vertical-align: middle; margin-left: 6px; display: inline-block; }}
    .white-card {{ background: #ffffff; border: 1px solid #ECE6DC; border-radius: 18px; padding: 28px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); text-align: left; }}
    .greeting {{ font-family: Georgia, serif; font-size: 28px; color: #0b0f10; margin: 0 0 6px 0; font-weight: normal; }}
    .subgreeting {{ font-family: Georgia, serif; font-style: italic; font-size: 16px; color: #57534E; margin: 0 0 16px 0; }}
    .body-text {{ font-size: 13.5px; line-height: 1.65; color: #57534E; margin: 0 0 18px 0; }}
    .signature-div {{ border-top: 1px solid #E7E5E4; padding-top: 16px; margin-top: 22px; }}
    .sig-warmly {{ font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #78716C; margin-bottom: 2px; }}
    .sig-team {{ font-family: Georgia, serif; font-size: 15px; font-weight: 600; color: #0b0f10; }}
    .bottom-realm {{ background: #F5F1EB; border: 1px solid #E4DCcf; border-radius: 16px; padding: 20px; margin-bottom: 18px; text-align: left; display: block; }}
    .realm-title {{ font-family: Georgia, serif; font-size: 16px; color: #0D1117; font-weight: 600; margin: 0 0 2px 0; }}
    .realm-desc {{ font-size: 12px; color: #78716C; margin: 0 0 14px 0; }}
    .btn {{ display: inline-block; background: #0D1117; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; }}
    .footer {{ font-size: 11px; color: #8A857D; text-align: center; border-top: 1px solid #ECE6DC; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="top-bar"></div>
    <div class="content">
      <div class="header">
        <span class="brand-title">{app_name}</span>
        <span class="ai-pill">AI</span>
      </div>

      <div class="white-card">
        <h1 class="greeting">Hi {first_name},</h1>
        <p class="subgreeting">Welcome to your personalized learning workspace.</p>
        <p class="body-text">
          Thank you for choosing {app_name} as your academic companion. We are genuinely excited to support you on every step of your learning path, helping uncover hidden conceptual gaps, master foundational topics, and turn challenging coursework into measurable academic confidence.
        </p>
        <p class="body-text">
          Your diagnostic telemetry and personalized Bayesian revision drills are calibrated and ready for your academic journey.
        </p>

        <div class="signature-div">
          <div class="sig-warmly">Warmly,</div>
          <div class="sig-team">The {app_name} Team</div>
        </div>
      </div>

      <div class="bottom-realm">
        <div style="margin-bottom: 12px;">
          <h4 class="realm-title">{app_name}</h4>
          <p class="realm-desc">Diagnostics and review ready.</p>
        </div>
        <a href="{login_url}" class="btn" target="_blank">Enter Workspace &rarr;</a>
      </div>

      <div class="footer">
        Account registered: {email} &nbsp;&middot;&nbsp; Documentation &nbsp;&middot;&nbsp; Support &nbsp;&middot;&nbsp; &copy; 2026 {app_name}
      </div>
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Hi {first_name},

Welcome to your personalized learning workspace!

Thank you for choosing {app_name} as your academic companion. We are genuinely excited to support you on every step of your learning path, helping uncover hidden conceptual gaps, master foundational topics, and turn challenging coursework into measurable academic confidence.

Your diagnostic telemetry is calibrated and ready.

Launch your workspace: {login_url}

Warmly,
The {app_name} Team
Registered email: {email} | (c) 2026 {app_name}
"""
    return subject, html_content, text_content
