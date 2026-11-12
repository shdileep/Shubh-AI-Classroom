# GapFinder AI — EdTech Platform

> **Stitch Project:** GapFinder AI EdTech Platform  
> **Project ID:** `6168294121474996000`  
> **Tech Stack:** React 19, Tailwind CSS v4, Vite, Lucide Icons

This project contains both the **exact downloaded raw files** (HTML and high-resolution screenshots/images) from Google Stitch, and a **modern, fully-interconnected React JSX + Tailwind CSS application** seamlessly connecting all 7 project screens.

---

## 📱 Stitch Screens Catalog & Mapping

| Screen # | Screen ID | Title / Prompt | Screen Type | Dimensions | Downloaded Assets |
|---|---|---|---|---|---|
| **1** | `213653d414db45a392d00fbff5679013` | GapFinder AI — Soft Ivory & Midnight Black Edition | **DESIGN** (Landing Page) | 2560 × 8172 | `screen_1_landing_page.html`<br>`screen_1_soft_ivory_midnight.jpg` |
| **2** | `a6988a19effe438dbfe9f2b93e89519a` | Authentic modern university student sitting with books and laptop in warm sunlit study space | **IMAGE** (Editorial Portrait) | 896 × 1200 | `screen_2_student_campus_study.png` |
| **3** | `9a55e7d0975e46c0a976c0856fa32de5` | GapFinder AI — Sign In & Sign Up | **DESIGN** (Auth Screen) | 2560 × 2048 | `screen_3_signin_signup.html`<br>`screen_3_signin_signup.jpg` |
| **4** | `c913e28acc294df9af932ac78cf59ce8` | GapFinder AI — Student LMS Overview Dashboard | **DESIGN** (LMS Dashboard) | 2560 × 3622 | `screen_4_student_lms_dashboard.html`<br>`screen_4_student_lms_dashboard.png` |
| **5** | `46ddeef031b64efaaef52059fb47e269` | Focused college student writing in notebook next to laptop in modern library | **IMAGE** (Editorial Study) | 896 × 1200 | `screen_5_student_writing_library.png` |
| **6** | `4fb8ae2946fa409681388e61c655bbde` | Friendly young woman college student in cream sweater holding binder and tablet | **IMAGE** (Library Atrium) | 896 × 1200 | `screen_6_student_sweater_tablet.png` |
| **7** | `61af0735e03f4228a10dbd6eb567eb16` | Smiling university student with brunette hair studying in campus library cafe | **IMAGE** (Library Cafe) | 896 × 1200 | `screen_7_student_smiling_cafe.png` |

---

## 🔗 How the Screens Are Interconnected

1. **Landing Page (`Screen 1` & `Screen 2`)**:
   - Built with the exact Soft Ivory (`#FAF8F5`) and Midnight Black aesthetic from Screen 1.
   - Features the authentic campus student portrait (`Screen 2`) in the Hero column with floating telemetry card.
   - 4-Step Pipeline: Syllabus Ingestion → Targeted Diagnostics → Knowledge Gap Mapping → Smart Revision Plan.
   - Diagnostic Assessment section featuring student library photography (`Screen 5`) and 3 interactive mastery cards with "Review" and "Fix Gap" buttons.
   - Midnight Black Student Dashboard preview linking directly to the full LMS dashboard.
   - Authentic student community showcase featuring all 4 editorial student portraits (`Screens 2, 5, 6, 7`).
   - "Sign In" button opens the authentication screen (`Screen 3`).

2. **Authentication: Sign In & Sign Up (`Screen 3` & `Screen 6`)**:
   - Dual-mode tab toggle: "Sign In" vs "Create Account".
   - Left side features student editorial portrait (`Screen 6`) with student verification badge.
   - One-click Google OAuth button, email & password fields with password visibility toggle.
   - Submitting logs in the student (Alex Chen) and instantly navigates to the **Student LMS Dashboard (`Screen 4`)**.

3. **Student LMS Overview Dashboard (`Screen 4`)**:
   - Persistent dark sidebar with GapFinder.AI Student LMS branding, active Algorithmic Track indicator, and navigation groups (Learning, Performance, Personal).
   - Top bar with course switcher (`MATH 204: Multivariable Calculus`, `CS 189: Machine Learning`, `PHYS 105: Quantum Physics`), search, notifications, and user avatar.
   - 4 Metric KPI Cards: Overall Knowledge Score (74%), Topics Mastered (18/24), Critical Gaps (06), and Exam Countdown (09 Days).
   - Filterable Priority Knowledge Gaps with severity tags, exam weightings, and interactive drill buttons.
   - "Upload Syllabus" modal allowing students to drag and drop new course slides.
   - "Return to Landing Page" button for smooth bidirectional navigation.

4. **Interactive Diagnostic Drawer**:
   - Clicking "Take Diagnostic", "Start Free Diagnostic", or "Fix Gap" launches an interactive adaptive micro-diagnostic with live multiple-choice questions, concept derivations, and AI gap feedback.

5. **Screens Catalog & Inspector Modal**:
   - A dedicated 7-screen gallery accessible via the navbar ("All 7 Screens") allowing inspection of every Stitch screen, metadata, and raw file source.

---

## 🚀 Running the Modern React App

```bash
# Navigate to the app directory
cd gapfinder-app

# Install dependencies (already installed)
pnpm install

# Start the local development server
pnpm run dev

# Or build for production
pnpm run build
pnpm run preview
```

---

## 📁 Raw Files Location

The exact raw files downloaded from Stitch are stored in:
- `c:\Users\revat\Downloads\Acadza_AI_Intern_Assignment\raw_stitch_screens\`
  - `screen_1_landing_page.html`
  - `screen_1_soft_ivory_midnight.jpg`
  - `screen_2_student_campus_study.png`
  - `screen_3_signin_signup.html`
  - `screen_3_signin_signup.jpg`
  - `screen_4_student_lms_dashboard.html`
  - `screen_4_student_lms_dashboard.png`
  - `screen_5_student_writing_library.png`
  - `screen_6_student_sweater_tablet.png`
  - `screen_7_student_smiling_cafe.png`
  - `hosted_assets/` (all 6 hosted images downloaded via `curl.exe -L`)
