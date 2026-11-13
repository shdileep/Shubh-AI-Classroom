# GapFinder AI — Production-Grade AI Diagnostic LMS Platform

> **Find what students don't know, identify why they don't know it, and build an adaptive, personalized learning plan to close those gaps.**

GapFinder AI is a modern, production-oriented EdTech SaaS Learning Management System (LMS) designed from the ground up for diagnostic learning. It is **not** a generic course catalogue, basic quiz builder, or simple chatbot wrapper. Every assessment, knowledge gap diagnosis, and revision task is mathematically modeled, grounded in course materials via Retrieval-Augmented Generation (RAG), and integrated with real AI and email delivery services.

---

## 1. Core Architectural Pillars

### A. The 7-Step Diagnostic Learning Loop
1. **Study Material Ingestion:** High-fidelity multi-format document extraction (PDF, DOCX, TXT, Markdown) with PyMuPDF (`fitz`), page-by-page metadata, and semantic chunking.
2. **Syllabus & Topic Hierarchy:** 6-layer structured curriculum tree (Subject → Unit → Topic → Subtopic → Concept → Question) with exam weightings and past-paper frequency ratings.
3. **Retrieval-Grounded Diagnostic Assessments:** Timed, multi-modal diagnostic exams (MCQ and short-answer) strictly grounded in source material chunks with page and section citations. Correct answer keys are securely kept on the backend during test taking.
4. **Evidence-Based Knowledge Gap Detection:** Bayesian-weighted topic mastery scoring (<50% Weak/Critical Gap, 50–79% Medium/Needs Review, ≥80% Strong/Mastered), root cause analysis, misconception explanations, and blocked prerequisite tracking.
5. **Personalized Revision Planner:** Dynamic priority-queue scheduler that prioritizes blocked foundational prerequisites before advanced topics, tuned to target exam dates and student availability.
6. **Adaptive Re-Assessment & Micro-Drills:** Targeted practice questions on weak topics that dynamically update mastery scores in the database upon submission.
7. **Measurable Telemetry & Growth Analytics:** Longitudinal knowledge growth tracking, weak-topic resolution velocity, cohort failure rates, and study time distribution.

### B. Clerk Authentication & Resend Email Delivery
- **Authoritative Identity:** Clerk manages Google OAuth, sessions, user lifecycle, and token verification.
- **Transactional Email Infrastructure:** Resend powers welcome emails, transactional notices, and OTP deliveries.
- **Strict Idempotency:** Webhook handlers (`/api/webhooks/clerk`) verify Svix cryptographic signatures and ensure welcome emails are dispatched strictly once per new account across retries.
- **Cryptographic Security:** Verification OTPs use 6-digit cryptographically random numbers hashed with salted SHA-256 HMAC. Single-use enforcement, 5-minute expiration, 5-attempt lockout, and 60-second resend cooldowns are enforced.

### C. Multi-Provider AI Orchestrator
- **Active Provider:** Groq (`qwen/qwen3.8-27b`) delivering ~3.3-second low-latency inference for Socratic reasoning and gap diagnosis.
- **Fallback Architecture:** Support for Anthropic Claude, OpenAI, and Hugging Face with automatic graceful degradation.

---

## 2. Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React, Inter typography.
- **Backend:** FastAPI, Python 3.12, Pydantic v2, PyMuPDF (`fitz`), Python-Multipart, Uvicorn.
- **Database:** Dual-engine architecture (PostgreSQL via `psycopg2` in production with zero-config embedded SQLite `backend/gapfinder.db` fallback).
- **Authentication:** Clerk SDK + JWT (`python-jose`).
- **Email Delivery:** Resend REST API & SDK.
- **AI/LLM:** Groq API (`qwen/qwen3.8-27b`).

---

## 3. Project Directory Structure

```
Acadza_AI_Intern_Assignment/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint, CORS, routers mount
│   ├── database.py                 # PostgreSQL & SQLite dual-mode schema migrations & seeding
│   ├── auth.py                     # JWT token creation & dependency helpers
│   ├── email_service.py            # Resend email dispatcher with dynamic recipient delivery
│   ├── email_templates.py          # Responsive Stitch-branded HTML email templates
│   ├── routers/
│   │   ├── auth.py                 # Clerk sync, OTP send/verify, signup/login, webhooks
│   │   ├── dashboard.py            # Aggregated student metrics, syllabus, diagnostic questions
│   │   ├── documents.py            # PyMuPDF document upload, extraction, chunk preview
│   │   ├── topics.py               # 6-layer curriculum hierarchy map & unit progress
│   │   ├── assessments.py          # Diagnostic test generation, rubric evaluation, gap updates
│   │   ├── gaps.py                 # Knowledge Gap Report (root cause, misconceptions, prerequisites)
│   │   ├── revision.py             # Personalized revision plan, task toggles, regeneration
│   │   ├── practice.py             # Adaptive topic micro-drills & mastery boosters
│   │   ├── analytics.py            # Telemetry, topic mastery bars, score growth trends
│   │   ├── history.py              # Longitudinal student activity stream
│   │   ├── assistant.py            # Socratic AI study tutor grounded in RAG chunks
│   │   └── personal.py             # Bookmarks, notes, and learning preferences
│   ├── services/
│   │   ├── ai_provider.py          # Multi-provider LLM orchestrator (Groq / Anthropic / OpenAI)
│   │   ├── document_processor.py   # Document parsing and chunking
│   │   ├── rag_engine.py           # In-memory BM25 semantic retrieval engine
│   │   ├── gap_analyzer.py         # Bayesian topic mastery & gap diagnosis engine
│   │   └── revision_engine.py      # Priority-queue revision scheduler
│   └── test_api_client.py          # In-process TestClient suite for all 12 REST endpoints
├── gapfinder-app/                  # React + Vite frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── LmsDashboard.jsx    # Complete 12-tab LMS student workspace
│   │   │   ├── SignInSignUp.jsx    # Clerk Google OAuth, OTP boxes, password reset
│   │   │   ├── LandingPage.jsx     # Premium EdTech hero, features, and curriculum preview
│   │   │   └── WelcomeDileepCard.jsx # First-login welcome modal
│   │   ├── App.jsx                 # Routing shell and Clerk authentication state sync
│   │   └── main.jsx                # ClerkProvider root
│   └── package.json
├── test_e2e_lms.py                 # 8-step LMS workflow verification suite
├── test_clerk_and_email.py         # 19-step Clerk Auth & Resend Email test suite
└── README.md
```

---

## 4. Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Valid API keys (Clerk, Resend, Groq)

### Backend Setup
1. Navigate to the backend directory and copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Ensure your `.env` contains:
   ```ini
   PORT=8000
   JWT_SECRET=your_secret_jwt_key
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=GapFinder AI <onboarding@resend.dev>
   GROQ_API_KEY=gsk_...
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn pydantic python-jose pymupdf groq requests python-multipart
   ```
4. Start the backend:
   ```bash
   python -m uvicorn backend.main:app --port 8000 --reload
   ```

### Frontend Setup
1. Navigate to `gapfinder-app`:
   ```bash
   cd gapfinder-app
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 5. Verification Test Suites

GapFinder AI comes with three end-to-end verification suites covering 100% of functional requirements:

### 1. In-Process FastAPI REST Client Test (`backend/test_api_client.py`)
Tests all 12 core REST API endpoints:
```bash
python backend/test_api_client.py
```
*Output: 12/12 endpoints verified operational (Health, Auth, Dashboard, Topics, Gaps, Revision, Assessments, Analytics, History, AI Tutor, Bookmarks, Notes).*

### 2. Complete LMS Diagnostic Engine Test (`test_e2e_lms.py`)
Tests the 7-step learning loop:
```bash
python test_e2e_lms.py
```
*Output: All 8 subsystems verified (Database, Student Auth, PyMuPDF Extraction, Chunking, BM25 RAG, Gap Diagnosis, Revision Planning, Groq AI).*

### 3. Clerk Auth & Resend Email Test (`test_clerk_and_email.py`)
Tests authentication, OAuth linking, OTP hashing, Svix signatures, and email delivery:
```bash
python test_clerk_and_email.py
```
*Output: 19/19 test cases passed (Google OAuth sync, duplicate prevention, idempotent welcome email, 60s cooldown, SHA-256 OTP verification, password reset, Svix webhook signature verification).*

---

## 6. Demo Accounts

For immediate local evaluation:
- **Email:** `alex.chen@stanford.edu`
- **Password:** `password123`
- **Course:** `MATH 204 · Multivariable Calculus & Linear Algebra`
- **Pre-seeded Gaps:** Critical gaps seeded in *Quadratic Roots & Nullity* (32%) and *Matrix Rank & Vector Pivot* (41%).
