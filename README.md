# GapFinder AI — Bayesian EdTech Diagnostics & AI Classroom Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Resend](https://img.shields.io/badge/Resend-Email%20API-black.svg?style=flat&logo=resend&logoColor=white)](https://resend.com)
[![Clerk](https://img.shields.io/badge/Clerk-OAuth-6C47FF.svg?style=flat&logo=clerk&logoColor=white)](https://clerk.com)

**GapFinder AI** is an intelligent academic diagnostic platform calibrated for university STEM students. It uncovers conceptual knowledge blindspots using Bayesian Knowledge Tracing (BKT), schedules targeted revision drills, and delivers individualized practice trajectories.

---

## 🚀 Key Highlights & Capabilities

* **Adaptive Diagnostic Engine:**
  - Real-time Bayesian Knowledge Tracing across conceptual topics.
  - Granular mastery scores, difficulty calibrations, and actionable revision drills.
* **Dual Authentication System:**
  - **Direct Clerk Google OAuth:** Seamless 1-click Google authentication with instant workspace linking.
  - **Academic Email Sign Up with Mandatory OTP:** Cryptographically generated 6-digit email OTP verification before account creation.
* **Resend Transactional Email Engine:**
  - Mandatory OTP email delivery using Stitch design system.
  - Zero plaintext storage: SHA-256 HMAC salted hashing in database.
  - 60-second cooldown protection & 5-attempt security lockouts.
  - Automatic personalized **Welcome Card** email sent strictly once upon verified account registration.
* **Stitch Design System Integration:**
  - Faithful pixel-level alignment with Stitch Project Screens (`GapFinder AI — Welcome Dileep Card`).
  - Signature landing page geometric polygon logo with emerald green `#0DFA6C` indicator.
* **Dual Database Architecture:**
  - Production-ready for **PostgreSQL** (`psycopg2`) with automatic seamless fallback to embedded **SQLite** (`gapfinder.db`).

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI application entrypoint & lifespans
│   ├── database.py              # PostgreSQL / SQLite dual connection pool & auto-migrations
│   ├── auth.py                  # JWT creation, password hashing (bcrypt), and current user dependency
│   ├── email_service.py         # Centralized Resend SDK & HTTPS transactional email dispatcher
│   ├── email_templates.py       # Stitch-styled responsive HTML email templates & text fallbacks
│   ├── test_resend_integration.py # Automated test suite for all 13 Resend security checks
│   ├── .env.example             # Example environment variable template
│   └── routers/
│       ├── auth.py              # /send-otp, /verify-otp, /resend-otp, /signup, /login, /webhooks/resend
│       ├── dashboard.py         # Knowledge gaps, telemetry, mastery metrics, and study sessions
│       └── llm.py               # AI explanation, gap diagnostic drill generation
│
├── gapfinder-app/               # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx              # Main router & active view switcher
│   │   ├── components/
│   │   │   ├── LandingPage.jsx      # Marketing platform landing experience
│   │   │   ├── SignInSignUp.jsx     # In-place 3-step auth, OTP boxes, and password creation
│   │   │   ├── WelcomeDileepCard.jsx# Stitch Screen 7f9d11c266b2402b99aa1ad849970414 Welcome Card
│   │   │   ├── Dashboard.jsx        # Diagnostic telemetry & knowledge gap workspace
│   │   │   ├── SSOCallback.jsx      # Clerk OAuth redirect handler
│   │   │   └── ...
│   │   └── ...
│   └── package.json
│
├── .gitignore                   # Excludes secrets, node_modules, and databases
└── README.md                    # Project documentation
```

---

## 🛠️ Quickstart & Local Setup

### 1. Backend Setup (FastAPI)

```bash
# Navigate to repository root
cd Acadza_AI_Intern_Assignment

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS / Linux

# Install dependencies
pip install fastapi uvicorn python-dotenv pydantic psycopg2-binary bcrypt pyjwt requests resend

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Clerk and Resend API keys

# Start FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup (Vite + React)

```bash
# In a new terminal, navigate to the frontend app
cd gapfinder-app

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will be live at `http://127.0.0.1:5173`.

---

## 🧪 Automated Testing

To run the complete 13-point integration test suite verifying Resend OTP verification, cooldowns, tamper detection, and welcome email delivery:

```bash
python backend/test_resend_integration.py
```

---

## 🔒 Security & Privacy Practices

* **No Plaintext Passwords or Codes:** Passwords are encrypted with bcrypt; OTP codes are strictly stored as SHA-256 salted hashes.
* **No Plaintext Codes in Network Payloads:** Verification codes are never returned in JSON API responses or logs.
* **Rate Limiting & Cooldown:** Enforced 60-second cooldown on OTP resend and 5-attempt security lockout.
* **Secrets Sanitization:** All sensitive credentials (`.env`, database files) are strictly ignored in `.gitignore`.

---

## 📄 License & Attribution

Designed and engineered for **GapFinder AI / Acadza AI**. All rights reserved.
