# GapFinder AI — EdTech Platform (Stitch Screens & Production Web App)

> **Stitch Project:** GapFinder AI EdTech Platform  
> **Project ID:** `6168294121474996000`  
> **Tech Stack:** React 19, Tailwind CSS v4, Vite, Lucide Icons

---

## 📥 Summary of Downloaded Screens & Hosted Assets

All requested screens and their hosted assets were downloaded directly from the Stitch API and hosted URLs using `curl -L`. Both raw assets and the modern React application are ready.

### 1. Raw Downloaded Stitch Screens (`./raw_stitch_screens/`)
* **Screen 1**: GapFinder AI — Soft Ivory & Midnight Black Edition
  * Screen ID: `213653d414db45a392d00fbff5679013`
  * HTML Code: `raw_stitch_screens/screen_1_landing_page.html`
  * Screenshot: `raw_stitch_screens/screen_1_soft_ivory_midnight.jpg` (2560 × 8172)
* **Screen 2**: Authentic modern university student sitting with books and laptop
  * Screen ID: `a6988a19effe438dbfe9f2b93e89519a`
  * Image: `raw_stitch_screens/screen_2_student_campus_study.png` (896 × 1200)
* **Screen 3**: GapFinder AI — Sign In & Sign Up
  * Screen ID: `9a55e7d0975e46c0a976c0856fa32de5`
  * HTML Code: `raw_stitch_screens/screen_3_signin_signup.html`
  * Screenshot: `raw_stitch_screens/screen_3_signin_signup.jpg` (2560 × 2048)
* **Screen 4**: GapFinder AI — Student LMS Overview Dashboard
  * Screen ID: `c913e28acc294df9af932ac78cf59ce8`
  * HTML Code: `raw_stitch_screens/screen_4_student_lms_dashboard.html`
  * Screenshot: `raw_stitch_screens/screen_4_student_lms_dashboard.png` (2560 × 3622)
* **Screen 5**: Focused college student writing in notebook next to laptop in modern library
  * Screen ID: `46ddeef031b64efaaef52059fb47e269`
  * Image: `raw_stitch_screens/screen_5_student_writing_library.png` (896 × 1200)
* **Screen 6**: Friendly young woman college student in cream sweater with binder and tablet
  * Screen ID: `4fb8ae2946fa409681388e61c655bbde`
  * Image: `raw_stitch_screens/screen_6_student_sweater_tablet.png` (896 × 1200)
* **Screen 7**: Smiling university student with brunette hair studying in campus library cafe
  * Screen ID: `61af0735e03f4228a10dbd6eb567eb16`
  * Image: `raw_stitch_screens/screen_7_student_smiling_cafe.png` (896 × 1200)
* **Hosted Assets (`raw_stitch_screens/hosted_assets/`)**:
  * 6 hosted assets downloaded via `curl.exe -L` from `lh3.googleusercontent.com`.

---

## ⚡ Modern Web App (`./gapfinder-app/`)

Built with **React 19 + Tailwind CSS v4 + Vite**:
* Interconnects all 7 screens:
  * **Landing Page** (`Screen 1` & `Screen 2`): Includes hero with live student portrait, 4-step pipeline, diagnostic assessment (`Screen 5`), student testimonials (`Screens 2, 5, 6, 7`), and institutional partner ticker.
  * **Auth Screen** (`Screen 3` & `Screen 6`): Sign In & Sign Up with Google auth, show/hide password, and automatic redirect to LMS Dashboard upon submission.
  * **LMS Dashboard** (`Screen 4`): Complete dashboard with persistent dark sidebar, course selector (Multivariable Calculus, ML, Quantum Physics), metric cards (74% score, 18/24 mastered, 6 critical gaps, 9 days to midterm), priority gaps filter, syllabus upload modal, and daily revision agenda.
  * **Interactive Diagnostic Drawer**: Live multi-step quiz with immediate AI knowledge gap explanations.
  * **7 Screens Inspector Modal**: Interactive catalog to view all Stitch screen screenshots and metadata side-by-side.

### How to Run:
```bash
cd gapfinder-app
pnpm run dev
```
Production build verified with `pnpm run build` (0 errors).
