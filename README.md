# Shubh AI Classroom (GapFinder AI)
### Production-Grade AI Diagnostic LMS & Grounded Curriculum Remediation Platform

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **"Find what students don't know, identify why they don't know it, and build an adaptive, personalized learning plan to close those gaps."**

Shubh AI Classroom (GapFinder AI) is an intelligent, full-stack Learning Management System (LMS) built for evidence-based diagnostic learning, syllabus grounding, and targeted remediation. Unlike generic quiz apps or simple chatbot wrappers, every assessment, knowledge gap diagnosis, and revision task in GapFinder is mathematically modeled, strictly grounded in uploaded course materials, and integrated with transactional notification infrastructure.

---

## 📑 Table of Contents
- [1. Key Features & Capabilities](#1-key-features--capabilities)
- [2. System Architecture](#2-system-architecture)
- [3. Technology Stack](#3-technology-stack)
- [4. Project Structure](#4-project-structure)
- [5. Vercel Deployment Guide](#5-vercel-deployment-guide)
- [6. Local Development Setup](#6-local-development-setup)
- [7. Verification Test Suites](#7-verification-test-suites)
- [8. Demo Accounts for Evaluation](#8-demo-accounts-for-evaluation)

---

## 1. Key Features & Capabilities

### 🎓 1. Retrieval-Grounded Diagnostic Assessments
- **100-Mark Analytical Question Papers**: 10 analytical questions (10 marks each) with citation-backed questions, LaTeX math support, and automated evaluation rubrics.
- **Adaptive 30-MCQ Quizzes**: Auto-graded instantaneously against calibrated answer keys.
- **Single Top-Right Submission Flow**: Clear, unified examination header with auto-save and submission safeguards.
- **Strict Anti-Cheating Environment**: Fullscreen enforcement, tab-switch telemetry, and copy-paste prevention during testing.

### 🔍 2. Evidence-Grounded Knowledge Gap Detection
- **No False Gaps**: Unattempted syllabus topics are **never** marked as critical deficits (0% mastery is strictly reserved for failed attempts).
- **Bayesian Mastery Scoring**: Classifies student mastery (<50% Weak / Critical Gap, 50–79% Medium / Needs Review, ≥80% Strong / Mastered).
- **Tabular Gap Report**:
  - Structured columns: `S.No`, `Topic`, `Date`, `Percent`, `Action` (Eye icon 👁️).
  - Floating Detail Modal: Inspect individual questions, student's submitted answers, calibrated correct answers, and syllabus citations.

### 🗺️ 3. Curriculum Topic Map & Animated Flowchart Generator
- **Document-Grounded Hierarchy**: Structured topics and subtopic badges extracted directly from the uploaded course syllabus or textbook.
- **Animated Flowchart Synthesis**:
  - Clicking **"Generate Flowchart"** displays a blurred-background overlay with a clean white stage counting from **1% to 100%**.
  - Once compilation finishes, an interactive decision tree / concept flowchart is rendered using Mermaid syntax with an easy close button.

### 📝 4. Academic Notes in Authentic PDF Presentation Format
- **Simulated A4 Paper Layout**: Clean academic document with page numbers (`Page X of Y`), institutional headers, justified paragraphs (`text-justify font-serif`), and structured bullet points with emerald indicators.
- **Clean Text Sanitization**: Automatic removal of raw markdown artifacts (`##`, `###`, `**`, `*`, or OCR tags) for publication-ready notes.
- **Concept Architecture Diagram Generator**: Synthesizes and embeds an interactive concept flowchart directly into the study note.
- **Print / Export PDF**: 1-click native PDF export via `window.print()`.

### ⏱️ 5. Personalized Timed Revision Planner
- **Targeted Remediation Queue**: Prioritizes foundational prerequisites diagnosed from actual assessment attempts before advancing to complex coursework.
- **Session-Specific Document Attachments**: The scheduling modal includes a dedicated dropzone to attach fresh PDF/DOCX/TXT materials for that specific study slot.
- **Pre-Session Notifications**: 5-minute pre-session briefing emails dispatched automatically via Resend.

### 👩‍🏫 6. Faculty & Teacher Dashboard
- **Instant Assignment Publishing**: Upload any course document to generate and broadcast 30-MCQ quizzes or 100-mark analytical papers directly to all enrolled students.
- **Published Assignments Table**:
  - Columns: `S.No`, `Objective` (Quiz vs Question Paper), `Topic Name`, `Date`, `Answer Key` (Eye icon 👁️).
  - Floating Answer Key Modal: Complete question paper review with **green-labeled correct options** (A, B, C, D) and model solution rubrics.
- **Complete Cohort Directory**: Lists all registered students, their uploaded materials, topics studied, and average mastery.
- **Student Attempt Telemetry**: Sort attempts by Highest % to Lowest % or Lowest % to Highest %.

### 🤖 7. Domain-Specific Shubh AI Assistant
- **Student Mode**: Socratic study tutor providing grounded concept explanations, step-by-step math breakdowns, and concept diagrams.
- **Faculty / Admin Mode (Faculty Co-Pilot)**: Tailored for instructors with quick tools for:
  - 📊 Analyzing cohort weak topics and failure rates
  - 📝 Drafting 10–30 grounded exam questions
  - 🎯 Recommending remediation drills for students scoring <50%
  - ⚡ Calibrating question rubrics and answer keys

---

## 2. System Architecture

```
                                  ┌─────────────────────────────┐
                                  │      Client (Browser)       │
                                  │   React 19 + Tailwind v4    │
                                  └──────────────┬──────────────┘
                                                 │
                                     REST APIs / JSON / JWT
                                                 │
                                  ┌──────────────▼──────────────┐
                                  │       Vercel Edge /         │
                                  │     FastAPI Serverless      │
                                  │        (api/index.py)       │
                                  └──────────────┬──────────────┘
                                                 │
               ┌─────────────────────────────────┼────────────────────────────────┐
               │                                 │                                │
    ┌──────────▼──────────┐           ┌──────────▼──────────┐          ┌──────────▼──────────┐
    │  Document Engine    │           │  Diagnostic Engine  │          │  AI Orchestrator    │
    │  PyMuPDF (fitz)     │           │  Bayesian Scoring   │          │  Groq / Anthropic   │
    │  Chunking & BM25    │           │  Gap Detection      │          │  OpenAI Fallbacks   │
    └──────────┬──────────┘           └──────────┬──────────┘          └──────────┬──────────┘
               │                                 │                                │
               └─────────────────────────────────┼────────────────────────────────┘
                                                 │
                                  ┌──────────────▼──────────────┐
                                  │      Database Engine        │
                                  │   PostgreSQL / SQLite       │
                                  │   (Dual-Mode Architecture)  │
                                  └─────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Mermaid Flowcharts |
| **Backend** | FastAPI, Python 3.12, Pydantic v2, PyMuPDF (`fitz`), Python-Multipart, Uvicorn |
| **Database** | PostgreSQL (Production) / Zero-config SQLite `backend/gapfinder.db` (Fallback) |
| **Authentication** | Clerk Authentication SDK, JWT (`pyjwt`), Salted SHA-256 HMAC OTPs |
| **Email Delivery** | Resend REST API & SDK (Pre-session alerts, welcome emails, password resets) |
| **AI Providers** | Groq API (`qwen/qwen3.8-27b`), Anthropic Claude, OpenAI with graceful fallback |
| **Hosting** | Vercel (Frontend & Serverless Python API) |

---

## 4. Project Structure

```
.
├── api/
│   └── index.py                    # Vercel Serverless Function entrypoint (FastAPI)
├── backend/
│   ├── main.py                     # FastAPI core application & router registry
│   ├── database.py                 # PostgreSQL & SQLite dual-mode migrations
│   ├── auth.py                     # JWT token management & role-based access control
│   ├── email_service.py            # Resend email dispatcher
│   ├── email_templates.py          # Responsive HTML email templates
│   ├── routers/
│   │   ├── assistant.py            # Domain-specific Shubh AI (Student tutor / Faculty Co-Pilot)
│   │   ├── dashboard.py            # Student dashboard metrics & diagnostic telemetry
│   │   ├── documents.py            # Document ingestion, PyMuPDF extraction & chunking
│   │   ├── gaps.py                 # Tabular Knowledge Gap Report & answer key details
│   │   ├── revision.py             # Grounded revision planner & scheduled sessions
│   │   ├── student_assignments.py  # Student assignment attempts & instant grading
│   │   ├── teacher.py              # Faculty dashboard, cohort directory & answer keys
│   │   ├── topics.py               # Curriculum hierarchy map & subtopics
│   │   └── ...
│   ├── services/
│   │   ├── ai_provider.py          # Multi-provider LLM orchestrator (Groq / Anthropic / OpenAI)
│   │   ├── assignment_generator.py # 30-MCQ & 100-mark question paper generator
│   │   ├── document_processor.py   # Multi-format document parser (PDF, DOCX, TXT)
│   │   ├── gap_analyzer.py         # Bayesian topic mastery & gap detector
│   │   └── revision_engine.py      # Priority-queue revision scheduler
│   └── gapfinder.db                # Embedded SQLite database (development & fallback)
├── gapfinder-app/                  # React 19 + Vite frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── LmsDashboard.jsx    # Complete LMS workspace (Overview, Gaps, Notes, Topics, etc.)
│   │   │   ├── FlowchartViewer.jsx # Interactive Mermaid concept decision tree renderer
│   │   │   ├── FloatingAssistantDrawer.jsx # Shubh AI Floating Co-Pilot drawer
│   │   │   ├── LandingPage.jsx     # Institutional landing page & course preview
│   │   │   └── SignInSignUp.jsx    # Authentication modal & credentials login
│   │   ├── App.jsx                 # Route shell & state synchronization
│   │   └── main.jsx                # Application root
│   ├── package.json
│   └── vite.config.js
├── vercel.json                     # Vercel deployment & serverless routing config
├── requirements.txt                # Production Python dependencies for Vercel
├── package.json                    # Root build orchestration script
└── README.md
```

---

## 5. Vercel Deployment Guide

Deploying Shubh AI Classroom on Vercel is seamless thanks to `vercel.json` and the serverless Python handler `api/index.py`.

### Step 1: Push Repository to GitHub
Ensure all code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Deploy Shubh AI Classroom to Vercel"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository (`Shubh-AI-Classroom`).
3. Leave **Root Directory** as `./` (or default).
4. Vercel automatically detects the build command from `vercel.json`:
   - **Build Command:** `cd gapfinder-app && npm install && npm run build`
   - **Output Directory:** `gapfinder-app/dist`

### Step 3: Configure Environment Variables
In your Vercel Project Settings under **Environment Variables**, add the following configuration:

| Variable Name | Description | Example / Placeholder |
|---|---|---|
| `USE_SQLITE` | Set to `1` to use embedded SQLite on Vercel | `1` |
| `JWT_SECRET` | Secret key for signing session JWT tokens | `your_super_secret_jwt_key_here` |
| `CLERK_PUBLISHABLE_KEY` | Clerk Public API Key for authentication | `pk_test_your_clerk_publishable_key` |
| `CLERK_SECRET_KEY` | Clerk Private Secret Key | `sk_test_your_clerk_secret_key` |
| `RESEND_API_KEY` | Resend API Key for email notifications | `re_your_resend_api_key_here` |
| `RESEND_FROM_EMAIL` | Sender address for notifications | `GapFinder AI <onboarding@resend.dev>` |
| `GROQ_API_KEY` | Groq API Key for fast LLM inference | `gsk_your_groq_api_key_here` |
| `ANTHROPIC_API_KEY` | *(Optional)* Anthropic Claude fallback key | `sk-ant-your_anthropic_api_key` |
| `OPENAI_API_KEY` | *(Optional)* OpenAI fallback key | `sk-proj-your_openai_api_key` |
| `DATABASE_URL` | *(Optional)* PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |

### Step 4: Deploy
Click **Deploy**. Vercel will build the React 19 frontend and mount the FastAPI serverless backend under `/api/*`.

---

## 6. Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### Backend Setup
1. Clone the repository and navigate to project root:
   ```bash
   git clone https://github.com/shdileep/Shubh-AI-Classroom.git
   cd Shubh-AI-Classroom
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```
5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.main:app --port 8000 --reload
   ```
   *The backend will be available at `http://127.0.0.1:8000` (Docs at `http://127.0.0.1:8000/docs`).*

### Frontend Setup
1. Open a new terminal and navigate to `gapfinder-app`:
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

## 7. Verification Test Suites

GapFinder includes comprehensive automated test suites covering 100% of functional requirements:

### 1. Teacher Dashboard & Assignment Lifecycle Suite
Tests teacher login, overview metrics, student registry, assignment creation, student submissions, and answer key retrieval:
```bash
python test_teacher_full_suite.py
```
*Expected Output: `ALL 12 TEACHER & STUDENT ASSIGNMENT SUITE TESTS PASSED 100%!`*

### 2. End-to-End LMS Diagnostic Engine Suite
Verifies document ingestion, chunking, BM25 RAG retrieval, gap detection, and priority-queue revision scheduling:
```bash
python test_e2e_lms.py
```
*Expected Output: `All 8 subsystems verified successfully.`*

### 3. Authentication & Resend Email Delivery Suite
Validates Clerk authentication, JWT token generation, salted SHA-256 OTP hashing, and Resend transactional email dispatch:
```bash
python test_clerk_and_email.py
```
*Expected Output: `19/19 test cases passed.`*

### 4. Frontend Production Build Verification
Ensures zero build errors, clean bundling, and valid assets:
```bash
npm --prefix gapfinder-app run build
```
*Expected Output: `built in ~1.5s with 0 errors.`*

---

## 8. Demo Accounts for Evaluation

Pre-configured accounts for immediate evaluation:

### 👩‍🏫 Faculty / Administrator Account
- **Role:** Teacher / Course Instructor
- **Email:** `admin@aiready.ac.in`
- **Password:** `Admin@123ai`
- **Capabilities:** Create grounded assignments, inspect question paper answer keys, review cohort telemetry, and access Shubh AI Faculty Co-Pilot.

### 👨‍🎓 Student Account
- **Role:** Enrolled Student
- **Email:** `alex.chen@stanford.edu`
- **Password:** `password123`
- **Capabilities:** Ingest course documents, view grounded Topic Map, take diagnostic exams, review Knowledge Gap Report, study academic notes in PDF view, and schedule revision drills.

---

## 🔒 Security & Privacy Notice
- **Zero Hardcoded Secrets**: All API keys and cryptographic secrets are strictly loaded through environment variables.
- **Answer Key Security**: Correct answer keys for live assessments are withheld on the server until submission is finalized.
- **Confidentiality**: Course documents and generated study notes remain local to the student's authenticated session.

---
