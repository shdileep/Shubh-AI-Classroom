import React, { useState, useEffect } from 'react';

const DRAWER_DATA = {
  diagnostics: {
    category: 'Platform',
    title: 'Adaptive Concept Assessments',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Adaptive Engine</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Bayesian Knowledge Tracing & Socratic Drills</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          GapFinder AI replaces standard randomized quizzes with an active concept dependency tree. Rather than repeatedly testing what you understand, the engine analyzes your syllabus derivations and problem sets to locate where foundational comprehension first degrades.
        </p>
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FFFFFF] border border-[#E4DFD5]">
          <div>
            <div className="text-xs text-[#5C6368]">Mean Assessment Time</div>
            <div className="text-xl font-extrabold text-[#0A0D0E]">8.4 mins</div>
          </div>
          <div>
            <div className="text-xs text-[#5C6368]">Concept Attribution Accuracy</div>
            <div className="text-xl font-extrabold text-[#0A0D0E]">98.2%</div>
          </div>
        </div>
        <div className="border-t border-[#ECE8DF] pt-4">
          <h4 className="text-xs uppercase font-bold text-[#5C6368] tracking-wider mb-2">Supported Assessment Modes</h4>
          <ul className="text-xs space-y-2 text-[#2B3033]">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0A0D0E]"></span>Step-by-step mathematical derivation proofs</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0A0D0E]"></span>Algorithmic and pseudocode logic walkthroughs</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0A0D0E]"></span>Edge-case counter-example identification</li>
          </ul>
        </div>
      </div>
    )
  },
  dashboard: {
    category: 'Platform',
    title: 'Student & Faculty Dashboard',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Analytics & Telemetry</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Telemetry Tailored to Exam Schedules</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          Get transparent projections of exam readiness scored against your specific university course syllabus and past examination structures. View historical recall degradation and get daily prioritized 10-minute micro-drills.
        </p>
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E4DFD5] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#0A0D0E]">Exam Weight vs. Mastery Gap Matrix</span>
            <span className="text-[#7A6B43] font-semibold">Calibrated Daily</span>
          </div>
          <p className="text-xs text-[#5C6368]">
            Identifies concepts carrying high grading weight (e.g. 15-20% of final exam) where your personal confidence level is below 60%.
          </p>
        </div>
      </div>
    )
  },
  'gap-mapping': {
    category: 'Platform',
    title: 'Knowledge Gap Mapping',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Curriculum Ingestion</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Concept Graph Decomposition</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          GapFinder parses LaTeX slides, lecture recordings transcripts, PDFs, and assignment rubrics. It synthesizes a topological directed acyclic graph (DAG) of prerequisites, pinpointing exact root causes when high-level problem types fail.
        </p>
      </div>
    )
  },
  'lms-sync': {
    category: 'Platform',
    title: 'LMS Sync & Integration',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Enterprise Sync</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Seamless Canvas, Blackboard & Moodle Ingestion</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          Sync syllabi, assignment deadlines, and lecture files via standard LTI 1.3 / Advantage protocols with zero manual uploading required.
        </p>
      </div>
    )
  },
  docs: {
    category: 'Resources',
    title: 'Technical Documentation',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Developer & Student Docs</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Documentation & API Guides</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          Explore detailed technical specifications, LaTeX parsing formats, and institutional SSO configuration guidelines.
        </p>
      </div>
    )
  },
  courses: {
    category: 'Resources',
    title: 'Course Catalogs',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Course Curricula</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Pre-built University Course Models</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          Explore our catalog of 200+ curated STEM courses covering Linear Algebra, Organic Chemistry, Classical Mechanics, Probability, and Algorithms calibrated against MIT, Oxford, and Stanford syllabi.
        </p>
      </div>
    )
  },
  support: {
    category: 'Resources',
    title: 'Student Support',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Assistance 24/7</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Academic Concierge & Support</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          Need help mapping your syllabus, reviewing progress reports, or coordinating group study accounts? Our team is available 24/7 for students and faculty.
        </p>
      </div>
    )
  },
  licensing: {
    category: 'Trust & Legal',
    title: 'University Licensing',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Enterprise Academic</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Campus-Wide Departmental Licensing</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          GapFinder AI offers institutional site licenses for departments and universities with central single-sign-on (SSO), LMS integration, and custom curriculum tailoring for faculty course coordinators.
        </p>
      </div>
    )
  },
  privacy: {
    category: 'Trust & Legal',
    title: 'Privacy Policy (2026)',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Updated January 2026</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">FERPA, GDPR & Academic Privacy Commitment</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          At GapFinder AI, student data ownership is non-negotiable. Student submissions, assessment attempts, and coursework materials are encrypted at rest and in transit (AES-256 / TLS 1.3). Student data is never used to train public foundation models.
        </p>
      </div>
    )
  },
  terms: {
    category: 'Trust & Legal',
    title: 'Terms of Service',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Terms & Conditions</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Terms of Service (2026 Edition)</h2>
        <p className="text-sm text-[#5C6368] leading-relaxed">
          By accessing GapFinder AI, you agree to academic integrity rules and acceptable usage policies. The learning tools are intended to guide legitimate independent study and exam preparation.
        </p>
      </div>
    )
  },
  contact: {
    category: 'Get In Touch',
    title: 'Contact GapFinder AI',
    content: (
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECE8DF] text-[#0A0D0E] text-xs font-semibold">
          <span>Inquiries</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#0A0D0E] font-sans">Send an Inquiry or Feedback</h2>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Inquiry submitted! Our team will reach out within 24 hours.'); }}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0A0D0E]">Email Address</label>
            <input type="email" required placeholder="alex@example.com" className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8D2C5] bg-[#FFFFFF] text-[#0A0D0E] focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0A0D0E]">Subject / Inquiring Department</label>
            <input type="text" required placeholder="e.g. Department of Mathematics or STEM tutoring" className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8D2C5] bg-[#FFFFFF] text-[#0A0D0E] focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0A0D0E]">Message</label>
            <textarea rows={3} placeholder="Tell us about your courses, term exams, or question..." className="w-full px-3 py-2 text-xs rounded-lg border border-[#D8D2C5] bg-[#FFFFFF] text-[#0A0D0E] focus:outline-none"></textarea>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-[#0A0D0E] hover:bg-[#1E2327] text-[#FAF8F5] font-bold text-xs shadow-xs transition-colors">
            Send Inquiry
          </button>
        </form>
      </div>
    )
  }
};

export default function LandingPage({ onOpenAuth, onOpenDashboard }) {
  const [drawerKey, setDrawerKey] = useState(null);

  const openDrawer = (key) => {
    setDrawerKey(key);
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    setDrawerKey(null);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, []);

  const activeDrawer = drawerKey ? DRAWER_DATA[drawerKey] || DRAWER_DATA['docs'] : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0A0D0E] selection:bg-[#0A0D0E] selection:text-[#FAF8F5] font-body">
      {/*  1. NAVIGATION  */}
<header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E4DFD5] transition-all">
<div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
<div className="flex items-center gap-8">
<a className="flex items-center gap-2.5 group" href="#"><div className="w-8 h-8 rounded-lg bg-[#0A0D0E] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:scale-105 transition-transform"><svg className="w-4.5 h-4.5 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"></path><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4"></circle><circle cx="12" cy="12" r="1.2" fill="#15803D"></circle><path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35"></path></svg></div><div className="flex items-baseline gap-1.5"><span className="font-serif italic text-xl tracking-tight text-[#0A0D0E] font-medium">GapFinder</span><span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#0A0D0E] text-[#FAF8F5]">AI</span></div></a>
<nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C6368] font-sans">
  <a className="hover:text-[#0A0D0E] transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }} href="#how-it-works">How It Works</a>
  <a className="hover:text-[#0A0D0E] transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); document.getElementById("diagnostics")?.scrollIntoView({ behavior: "smooth" }); }} href="#diagnostics">Assessments</a>
  <a className="text-[#003B1B] hover:text-black font-semibold transition-colors cursor-pointer flex items-center gap-1" onClick={(e) => { e.preventDefault(); onOpenAuth("signin", "instructor"); }} href="#instructor">
    <span>👨‍🏫</span>
    <span>Instructor Portal</span>
  </a>
</nav>
</div>
<div className="flex items-center gap-4">
<button type="button" onClick={() => onOpenAuth("signin", "student")} className="text-sm font-semibold text-[#2B3033] hover:text-[#0A0D0E] transition-colors hidden sm:block font-sans">Student Sign In</button>
<a className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#FAF8F5] bg-[#0A0D0E] hover:bg-[#1E2327] px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all font-sans cursor-pointer" onClick={() => onOpenAuth("signup", "student")} href="#pre-footer-cta"><span>Get Started Free</span><svg className="w-3.5 h-3.5 text-current" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8H13M9.5 4.5L13 8L9.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path></svg></a>
</div>
</div>
</header>

      
      <main className="pt-16">
{/*  2. HERO SECTION  */}
<section className="relative pt-14 pb-20 md:pt-20 md:pb-24 bg-gradient-to-b from-[#FAF8F5] via-[#F5F2EB] to-[#FAF8F5] border-b border-[#E4DFD5] overflow-hidden">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
{/*  Left Column  */}
<div className="lg:col-span-6 flex flex-col items-start">

<h1 className="reveal-on-scroll text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#0A0D0E] tracking-tight leading-[1.12] mb-6 font-sans is-visible">
            Find your knowledge gaps.<br />
<span className="font-serif italic font-normal text-[#2B3033]">Revise what matters.</span>
</h1>
<p className="reveal-on-scroll reveal-delay-1 text-[#5C6368] text-lg leading-relaxed max-w-xl mb-8 is-visible">
            GapFinder analyses your course slides and assignments to pinpoint exactly what concepts need revision before exam day.
          </p>
{/*  CTAs  */}
<div className="reveal-on-scroll reveal-delay-2 flex flex-wrap items-center gap-3 w-full sm:w-auto mb-6 is-visible">
<a className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0A0D0E] hover:bg-[#1E2327] text-[#FAF8F5] font-bold text-sm shadow-md transition-all hover:-translate-y-0.5" href="#signup" onClick={(e) => { e.preventDefault(); onOpenAuth("signup", "student"); }}>
<span>Start Free Assessment</span>
<svg className="w-4 h-4 text-[#FAF8F5]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8H13M9.5 4.5L13 8L9.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path></svg>
</a>
<a className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#D8D2C5] bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#0A0D0E] font-semibold text-sm shadow-xs transition-all" href="#demo">
<svg className="w-5 h-5 text-[#5C6368]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5"></circle><circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" strokeOpacity="0.6"></circle><polygon points="10,8.5 16,12 10,15.5" fill="currentColor"></polygon></svg>
<span>Watch Demo</span>
</a>
</div>

{/* Dual Portal Gateway Selection */}
<div className="reveal-on-scroll reveal-delay-2 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8 is-visible">
  <div 
    onClick={() => onOpenAuth('signin', 'student')}
    className="group p-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E4DFD5] hover:border-black/40 shadow-xs hover:shadow-md transition-all cursor-pointer text-left"
  >
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5 font-bold text-xs text-[#0A0D0E]">
        <span>🎓</span>
        <span>Student Portal</span>
      </div>
      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/5 text-[#0A0D0E] group-hover:bg-black group-hover:text-white transition-colors">Enter</span>
    </div>
    <p className="text-[11px] text-[#5C6368] leading-tight">
      Take assessments, discover knowledge gaps, and track adaptive mastery.
    </p>
  </div>

  <div 
    onClick={() => onOpenAuth('signin', 'instructor')}
    className="group p-3.5 rounded-xl bg-[#003B1B]/5 hover:bg-[#003B1B]/10 border border-[#003B1B]/20 hover:border-[#003B1B]/40 shadow-xs hover:shadow-md transition-all cursor-pointer text-left"
  >
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5 font-bold text-xs text-[#003B1B]">
        <span>👨‍🏫</span>
        <span>Instructor Portal</span>
      </div>
      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#003B1B]/15 text-[#003B1B] group-hover:bg-[#003B1B] group-hover:text-white transition-colors">Faculty</span>
    </div>
    <p className="text-[11px] text-[#5C6368] leading-tight">
      Monitor cohorts, identify weak topics, and assign remedial drills.
    </p>
  </div>
</div>
{/*  Clean University Logos Bar  */}

</div>
{/*  Right Column: Student Photography + Ivory/Midnight Telemetry Card  */}
<div className="lg:col-span-6 relative">
<div className="reveal-on-scroll relative rounded-2xl overflow-hidden shadow-2xl border border-[#E4DFD5] bg-[#FFFFFF] is-visible">
<img alt="Focused college student studying course material with laptop and textbooks in university library" className="w-full h-[440px] sm:h-[480px] object-cover" src="/assets/screen_2_student_campus_study.png" />
<div className="absolute inset-0 bg-gradient-to-t from-[#0A0D0E]/60 via-[#0A0D0E]/10 to-transparent"></div>
{/*  Elegant Floating Telemetry Card  */}
<div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-xs bg-[#FAF8F5]/95 backdrop-blur-md p-4 rounded-xl border border-[#E4DFD5] shadow-xl">
<div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E4DFD5]">
<span className="text-xs font-semibold text-[#5C6368]">Student Overview</span>
<span className="text-xs font-semibold text-[#0A0D0E] bg-[#ECE8DF] px-2 py-0.5 rounded-full border border-[#D8D2C5]">Exam Ready: On Track</span>
</div>
<div className="flex items-center justify-between gap-4">
<div>
<div className="text-[11px] text-[#5C6368] font-medium">Knowledge Score</div>
<div className="text-2xl font-extrabold text-[#0A0D0E]">74%</div>
</div>
<div className="text-right">
<div className="text-[11px] text-[#5C6368] font-medium">Priority Focus</div>
<div className="text-sm font-bold text-[#0A0D0E]">Linear Algebra</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  3. 4-STEP PIPELINE  */}
<section className="py-20 bg-[#F5F2EB] border-b border-[#E4DFD5]" id="how-it-works">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="max-w-2xl mb-12">
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E4DFD5] text-[#2B3033] text-xs font-semibold mb-3 shadow-xs">
<span>How It Works</span>
</div>
<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D0E] mb-3 font-sans">Engineered for academic courses.</h2>
<p className="text-[#5C6368] text-base leading-relaxed">
          Four focused steps that turn course materials into an efficient, structured revision schedule.
        </p>
</div>
{/*  4 Clean Ivory Cards with Warm 1px Borders  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
{/*  Card 1  */}
<div className="reveal-on-scroll p-6 rounded-2xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-sm hover:border-[#C2B8A3] transition-all flex flex-col justify-between is-visible">
<div>
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5] flex items-center justify-center text-[#0A0D0E] mb-5"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3.5H15L19 7.5V20.5H5V3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path><path d="M14.5 3.5V8H19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><line x1="8" y1="11.5" x2="13" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line><line x1="8" y1="14.5" x2="16" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line><circle cx="9" cy="17.5" r="1.25" fill="currentColor"></circle><line x1="11.5" y1="17.5" x2="15" y2="17.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"></line></svg></div>
<h3 className="text-base font-bold text-[#0A0D0E] mb-2 font-sans">Syllabus Ingestion</h3>
<p className="text-[#5C6368] text-sm leading-relaxed">
              Upload lecture slides, problem sets, and syllabus notes. Core theorems and topics are automatically extracted.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-[#ECE8DF] text-xs text-[#5C6368] font-medium">
            Automated material parsing
          </div>
</div>
{/*  Card 2  */}
<div className="reveal-on-scroll reveal-delay-1 p-6 rounded-2xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-sm hover:border-[#C2B8A3] transition-all flex flex-col justify-between is-visible">
<div>
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5] flex items-center justify-center text-[#0A0D0E] mb-5"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"></circle><circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.7"></circle><circle cx="12" cy="12" r="1.5" fill="currentColor"></circle><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></line></svg></div>
<h3 className="text-base font-bold text-[#0A0D0E] mb-2 font-sans">Targeted Assessments</h3>
<p className="text-[#5C6368] text-sm leading-relaxed">
              Adaptive questions identify conceptual blockers quickly without testing what you already understand well.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-[#ECE8DF] text-xs text-[#5C6368] font-medium">
            Focused concept testing
          </div>
</div>
{/*  Card 3  */}
<div className="reveal-on-scroll reveal-delay-2 p-6 rounded-2xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-sm hover:border-[#C2B8A3] transition-all flex flex-col justify-between is-visible">
<div>
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5] flex items-center justify-center text-[#0A0D0E] mb-5"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="#FAF8F5"></circle><circle cx="18.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="#FAF8F5"></circle><circle cx="12" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor"></circle><line x1="7.8" y1="7.8" x2="10.2" y2="16.2" stroke="currentColor" strokeWidth="1.5"></line><line x1="16.2" y1="7.2" x2="13.8" y2="16.2" stroke="currentColor" strokeWidth="1.5"></line><line x1="8" y1="6.2" x2="16" y2="5.8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" strokeOpacity="0.5"></line></svg></div>
<h3 className="text-base font-bold text-[#0A0D0E] mb-2 font-sans">Knowledge Gap Mapping</h3>
<p className="text-[#5C6368] text-sm leading-relaxed">
              Pinpoint exactly which definitions and multi-step derivations require further practice before exams.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-[#ECE8DF] text-xs text-[#5C6368] font-medium">
            Precise topic breakdown
          </div>
</div>
{/*  Card 4  */}
<div className="reveal-on-scroll reveal-delay-3 p-6 rounded-2xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-sm hover:border-[#C2B8A3] transition-all flex flex-col justify-between is-visible">
<div>
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5] flex items-center justify-center text-[#0A0D0E] mb-5"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5"></rect><line x1="3.5" y1="9" x2="20.5" y2="9" stroke="currentColor" strokeWidth="1.2"></line><line x1="7.5" y1="2.5" x2="7.5" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></line><line x1="16.5" y1="2.5" x2="16.5" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></line><path d="M7 15L10 12.5L13.5 15L17 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="17" cy="11.5" r="1" fill="currentColor"></circle></svg></div>
<h3 className="text-base font-bold text-[#0A0D0E] mb-2 font-sans">Smart Revision Plan</h3>
<p className="text-[#5C6368] text-sm leading-relaxed">
              A generated revision agenda prioritizing topics by exam weighting and personal retention patterns.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-[#ECE8DF] text-xs text-[#5C6368] font-medium">
            Prioritized daily schedule
          </div>
</div>
</div>
</div>
</section>
{/*  4. UNDERSTAND WHAT YOU ACTUALLY KNOW (PHOTO + 3 BEAUTIFUL CARDS)  */}
<section className="py-20 bg-[#FAF8F5] border-b border-[#E4DFD5]" id="diagnostics">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
{/*  Left: Real Photo Displayed Cleanly  */}
<div className="lg:col-span-5 relative">
<div className="reveal-on-scroll relative rounded-2xl overflow-hidden border border-[#E4DFD5] shadow-lg is-visible">
<img alt="Student studying notes and reviewing coursework in library study lounge" className="w-full h-[400px] object-cover" src="/assets/screen_5_student_writing_library.png" />
</div>
</div>
{/*  Right: Content + 3 Mastery Status Cards  */}
<div className="lg:col-span-7">
<div className="reveal-on-scroll mb-8 is-visible">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E4DFD5] text-[#2B3033] text-xs font-semibold mb-3 shadow-xs">
<span>Skill Assessment</span>
</div>
<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A0D0E] mb-3 font-sans">
              Understand what you actually know.
            </h2>
<p className="text-[#5C6368] text-base leading-relaxed">
              Rather than relying on generic quizzes, GapFinder evaluates structural mastery across core topics so you study where it impacts your grade most.
            </p>
</div>
<div className="space-y-4">
{/*  Card 1: Linear Algebra & Subspaces (Mastered)  */}
<div className="reveal-on-scroll p-5 rounded-xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 is-visible">
<div className="flex-1">
<div className="flex items-center gap-2.5 mb-2">
<svg className="w-5 h-5 text-[#0A0D0E] shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"></circle><circle cx="10" cy="10" r="6.5" fill="currentColor" fillOpacity="0.1"></circle><path d="M6.5 10L9 12.5L13.5 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path></svg>
<h3 className="text-sm font-bold text-[#0A0D0E] font-sans">Linear Algebra &amp; Subspaces</h3>
</div>
<div className="w-full bg-[#ECE8DF] rounded-full h-1.5 overflow-hidden">
<div className="bg-[#0A0D0E] h-1.5 rounded-full" style={{width: '94%'}}></div>
</div>
</div>
<div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
<span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#0A0D0E] border border-[#D8D2C5]">
                  94% Mastered
                </span>
<a className="text-xs font-semibold text-[#5C6368] hover:text-[#0A0D0E] px-3 py-1.5 rounded-lg border border-[#E4DFD5] hover:bg-[#FAF8F5] transition-colors" href="#dashboard" onClick={(e) => { e.preventDefault(); onOpenDashboard(); }}>Review</a>
</div>
</div>
{/*  Card 2: Rank-Nullity Theorem (Needs Review)  */}
<div className="reveal-on-scroll reveal-delay-1 p-5 rounded-xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 is-visible">
<div className="flex-1">
<div className="flex items-center gap-2.5 mb-2">
<svg className="w-5 h-5 text-[#8C3A3A] shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L17.5 16.5H2.5L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12"></path><line x1="10" y1="8" x2="10" y2="11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></line><circle cx="10" cy="14" r="0.9" fill="currentColor"></circle></svg>
<h3 className="text-sm font-bold text-[#0A0D0E] font-sans">Rank-Nullity Theorem</h3>
</div>
<div className="w-full bg-[#ECE8DF] rounded-full h-1.5 overflow-hidden">
<div className="bg-[#8C3A3A] h-1.5 rounded-full" style={{width: '28%'}}></div>
</div>
</div>
<div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
<span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF2F2] text-[#8C3A3A] border border-[#E8D1D1]">
                  Needs Review
                </span>
<a className="text-xs font-bold text-[#FAF8F5] bg-[#0A0D0E] hover:bg-[#1E2327] px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs" href="#dashboard" onClick={(e) => { e.preventDefault(); onOpenDashboard(); }}>
<span>Fix Gap</span>
<svg className="w-3 h-3 text-[#FAF8F5]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8H13M9.5 4.5L13 8L9.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path></svg>
</a>
</div>
</div>
{/*  Card 3: Orthogonal Projections (In Progress)  */}
<div className="reveal-on-scroll reveal-delay-2 p-5 rounded-xl border border-[#E4DFD5] bg-[#FFFFFF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 is-visible">
<div className="flex-1">
<div className="flex items-center gap-2.5 mb-2">
<svg className="w-5 h-5 text-[#7A6B43] shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5"></circle><path d="M10 5V10L13.5 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path><path d="M10 2C14.4183 2 18 5.58172 18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3"></path></svg>
<h3 className="text-sm font-bold text-[#0A0D0E] font-sans">Orthogonal Projections</h3>
</div>
<div className="w-full bg-[#ECE8DF] rounded-full h-1.5 overflow-hidden">
<div className="bg-[#7A6B43] h-1.5 rounded-full" style={{width: '67%'}}></div>
</div>
</div>
<div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
<span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#F9F7EF] text-[#7A6B43] border border-[#E6E0CC]">
                  In Progress
                </span>
<a className="text-xs font-semibold text-[#5C6368] hover:text-[#0A0D0E] px-3 py-1.5 rounded-lg border border-[#E4DFD5] hover:bg-[#FAF8F5] transition-colors" href="#dashboard" onClick={(e) => { e.preventDefault(); onOpenDashboard(); }}>Practice</a>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  5. STUDENT DASHBOARD PREVIEW (Rich midnight black container)  */}
<section className="py-20 bg-[#0A0D0E] text-[#FAF8F5] border-b border-[#22282C] relative" id="dashboard">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="max-w-2xl mb-12">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161A1D] text-[#C2B8A3] text-xs font-semibold mb-3 border border-[#22282C]">
<span>Student Dashboard</span>
</div>
<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FAF8F5] mb-3 font-sans">
          Real-time study overview.
        </h2>
<p className="text-[#8E979E] text-base leading-relaxed">
          Keep track of upcoming exam readiness and practice recommended high-yield topics first.
        </p>
</div>
{/*  Main Midnight Container  */}
<div className="reveal-on-scroll rounded-2xl border border-[#22282C] bg-[#111416] shadow-2xl overflow-hidden is-visible">
{/*  Top Bar  */}
<div className="bg-[#161A1D] border-b border-[#22282C] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-full bg-[#2B3033] text-[#FAF8F5] flex items-center justify-center font-bold text-xs border border-[#3C4247]">
              AC
            </div>
<div>
<div className="text-sm font-bold text-[#FAF8F5] font-sans">Alex Chen</div>
<div className="text-xs text-[#8E979E]">Foundational Learning Workspace</div>
</div>
</div>
<div className="flex items-center gap-3">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1A1F24] text-[#C2B8A3] border border-[#2B3033]">
              Course Synced
            </span>
</div>
</div>
{/*  Dashboard Grid  */}
<div className="p-6 sm:p-8 space-y-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{/*  Preparedness  */}
<div className="p-6 rounded-xl bg-[#161A1D] border border-[#22282C] flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-3">
<span className="text-xs font-semibold text-[#8E979E] uppercase tracking-wider">Overall Preparedness</span>
<span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#22282C] text-[#C2B8A3] border border-[#2E363B]">+16% this week</span>
</div>
<div className="flex items-baseline gap-4">
<span className="text-5xl font-extrabold text-[#FAF8F5]">74%</span>
<span className="text-xs text-[#8E979E]">Projected target: <strong className="text-[#FAF8F5] font-semibold">85%+</strong></span>
</div>
</div>
<div className="mt-6 pt-4 border-t border-[#22282C] text-xs text-[#8E979E] flex items-center justify-between">
<span>Next Exam in 9 days</span>
<span className="text-[#FAF8F5] font-medium">On Track</span>
</div>
</div>
{/*  Recommended Action  */}
<div className="p-6 rounded-xl bg-[#1A1F24] border border-[#2E363B] text-[#FAF8F5] flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-semibold uppercase tracking-wider text-[#C2B8A3]">Recommended Topic</span>
<span className="text-xs bg-[#22282C] text-[#FAF8F5] px-2 py-0.5 rounded font-medium border border-[#2B3033]">12 min drill</span>
</div>
<div className="text-base font-bold font-sans text-[#FAF8F5]">Eigenvalues &amp; Matrix Diagonalization</div>
<p className="text-xs text-[#8E979E] mt-1.5 leading-relaxed">
                  3 targeted practice exercises to strengthen characteristic equation derivations.
                </p>
</div>
<div className="mt-6 pt-4 border-t border-[#22282C] text-xs flex items-center justify-between">
<span className="text-[#C2B8A3]">High Exam Weight (18%)</span>
<a className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#ECE8DF] text-[#0A0D0E] text-xs font-bold transition-all" href="#dashboard" onClick={(e) => { e.preventDefault(); onOpenDashboard(); }}>
                  Start Review
                </a>
</div>
</div>
</div>
{/*  Priority Topics List  */}
<div className="bg-[#161A1D] rounded-xl border border-[#22282C] overflow-hidden">
<div className="px-6 py-4 border-b border-[#22282C] flex items-center justify-between">
<span className="text-xs font-semibold text-[#8E979E] uppercase tracking-wider">Priority Topics</span>
<span className="text-xs text-[#5C6368]">Sorted by revision priority</span>
</div>
<div className="divide-y divide-[#22282C] text-sm">
<div className="px-6 py-4 flex items-center justify-between hover:bg-[#1E2328]/50 transition-colors">
<div className="flex items-center gap-3">
<span className="w-2.5 h-2.5 rounded-full bg-[#8C3A3A]"></span>
<span className="font-medium text-[#FAF8F5]">Eigenvalues &amp; Diagonalization</span>
</div>
<div className="flex items-center gap-4">
<span className="text-xs font-semibold text-[#D49898] bg-[#2E1E20] px-2.5 py-1 rounded border border-[#44282B]">35% Mastery</span>
<a className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] text-[#0A0D0E] text-xs font-bold hover:bg-[#ECE8DF] transition-colors" href="#dashboard" onClick={(e) => { e.preventDefault(); onOpenDashboard(); }}>Practice</a>
</div>
</div>
<div className="px-6 py-4 flex items-center justify-between hover:bg-[#1E2328]/50 transition-colors">
<div className="flex items-center gap-3">
<span className="w-2.5 h-2.5 rounded-full bg-[#C2B8A3]"></span>
<span className="font-medium text-[#FAF8F5]">2nd Order Differential Equations</span>
</div>
<div className="flex items-center gap-4">
<span className="text-xs font-semibold text-[#C2B8A3] bg-[#22282C] px-2.5 py-1 rounded border border-[#2E363B]">48% Mastery</span>
<a className="px-3.5 py-1.5 rounded-lg border border-[#2E363B] text-[#FAF8F5] text-xs font-semibold hover:bg-[#22282C] transition-colors" href="#dashboard" onClick={(e) => { e.preventDefault(); onOpenDashboard(); }}>Practice</a>
</div>
</div>
<div className="px-6 py-4 flex items-center justify-between hover:bg-[#1E2328]/50 transition-colors">
<div className="flex items-center gap-3">
<span className="w-2.5 h-2.5 rounded-full bg-[#FAF8F5]"></span>
<span className="font-medium text-[#FAF8F5]">Stokes' Theorem &amp; Surface Integrals</span>
</div>
<div className="flex items-center gap-4">
<span className="text-xs font-semibold text-[#FAF8F5] bg-[#22282C] px-2.5 py-1 rounded border border-[#2E363B]">92% Mastered</span>
<span className="text-xs text-[#8E979E]">Ready</span>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  6. INSTITUTIONAL ASSURANCE  */}
<section className="py-16 bg-[#FAF8F5] border-b border-[#E4DFD5] overflow-hidden relative"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8"><p className="text-xs font-semibold text-[#5C6368] uppercase tracking-wider font-sans">Integrated with Leading AI &amp; Career Platforms</p></div><div className="w-full overflow-hidden partner-marquee-mask"><div className="partner-ticker-track items-center gap-16 sm:gap-20 py-2"><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3L28 24H4L16 3Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"></path><path d="M16 11L22 21H10L16 11Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path><circle cx="16" cy="17" r="2.2" fill="currentColor"></circle></svg><span className="font-sans font-bold text-[20px] tracking-tight text-[#0A0D0E]">HireZeno <span className="text-[14px] font-semibold text-[#7A6B43] bg-[#ECE8DF] px-2 py-0.5 rounded ml-1">2.0</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="15" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" fill="none"></rect><rect x="11" y="8" width="15" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12"></rect><path d="M10 10H16M10 14H17M15 17H22M15 21H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path></svg><span className="font-sans font-extrabold text-[20px] tracking-tight text-[#0A0D0E]">Resume<span className="text-[#7A6B43]">AI</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 2C16 9.73 9.73 16 2 16C9.73 16 16 22.27 16 30C16 22.27 22.27 16 30 16C22.27 16 16 9.73 16 2Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path><circle cx="16" cy="16" r="3" fill="currentColor"></circle></svg><span className="font-sans font-bold text-[20px] tracking-tight text-[#0A0D0E]">Rivera<span className="font-serif italic font-normal text-[#5C6368]">GPT</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12"></rect><rect x="17.5" y="4" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2"></rect><rect x="4" y="17.5" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2"></rect><rect x="17.5" y="17.5" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor"></rect></svg><span className="font-sans font-extrabold text-[20px] tracking-tight text-[#0A0D0E]">Zavran <span className="font-medium text-xs text-[#5C6368] tracking-wider uppercase">AI</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3L28 24H4L16 3Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"></path><path d="M16 11L22 21H10L16 11Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"></path><circle cx="16" cy="17" r="2.2" fill="currentColor"></circle></svg><span className="font-sans font-bold text-[20px] tracking-tight text-[#0A0D0E]">HireZeno <span className="text-[14px] font-semibold text-[#7A6B43] bg-[#ECE8DF] px-2 py-0.5 rounded ml-1">2.0</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="15" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" fill="none"></rect><rect x="11" y="8" width="15" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12"></rect><path d="M10 10H16M10 14H17M15 17H22M15 21H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"></path></svg><span className="font-sans font-extrabold text-[20px] tracking-tight text-[#0A0D0E]">Resume<span className="text-[#7A6B43]">AI</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 2C16 9.73 9.73 16 2 16C9.73 16 16 22.27 16 30C16 22.27 22.27 16 30 16C22.27 16 16 9.73 16 2Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path><circle cx="16" cy="16" r="3" fill="currentColor"></circle></svg><span className="font-sans font-bold text-[20px] tracking-tight text-[#0A0D0E]">Rivera<span className="font-serif italic font-normal text-[#5C6368]">GPT</span></span></div><div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default"><svg className="w-8 h-8 text-[#0A0D0E] shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12"></rect><rect x="17.5" y="4" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2"></rect><rect x="4" y="17.5" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2"></rect><rect x="17.5" y="17.5" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor"></rect></svg><span className="font-sans font-extrabold text-[20px] tracking-tight text-[#0A0D0E]">Zavran <span className="font-medium text-xs text-[#5C6368] tracking-wider uppercase">AI</span></span></div></div></div></section><section className="py-16 bg-[#F5F2EB] border-b border-[#E4DFD5]" id="institutions">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="text-center mb-8">
<span className="text-xs font-semibold text-[#5C6368] uppercase tracking-wider">Trusted by students and academic institutions</span>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
<div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] shadow-xs">
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0A0D0E] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-2"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L20 6.5V12.5C20 17.5 16.5 21 12 22C7.5 21 4 17.5 4 12.5V6.5L12 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path><circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"></circle><path d="M12 13V16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"></path></svg></div>
<div className="font-bold text-sm text-[#0A0D0E] font-sans">SOC2 Compliant</div>
<div className="text-xs text-[#5C6368] mt-1">Industry standard data safety</div>
</div>
<div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] shadow-xs">
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0A0D0E] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-2"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L2 8L12 13L22 8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path><path d="M6 10.5V15.5C6 17.8 8.7 19.5 12 19.5C15.3 19.5 18 17.8 18 15.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M22 8V15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"></path><circle cx="12" cy="15.5" r="1.5" fill="currentColor"></circle></svg></div>
<div className="font-bold text-sm text-[#0A0D0E] font-sans">FERPA Compliant</div>
<div className="text-xs text-[#5C6368] mt-1">Student privacy preserved</div>
</div>
<div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] shadow-xs">
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0A0D0E] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-2"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 8H6M6 8L9.5 4.5M6 8L9.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5 16H18M18 16L14.5 12.5M18 16L14.5 19.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path></svg></div>
<div className="font-bold text-sm text-[#0A0D0E] font-sans">LMS Integration</div>
<div className="text-xs text-[#5C6368] mt-1">Canvas &amp; Blackboard</div>
</div>
<div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E4DFD5] shadow-xs">
<div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#0A0D0E] border border-[#E4DFD5] flex items-center justify-center mx-auto mb-2"><svg className="w-5 h-5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"></circle><polygon points="12,5 14.5,12 12,19 9.5,12" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round"></polygon><line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5"></line><line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5"></line><line x1="3" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5"></line><line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5"></line></svg></div>
<div className="font-bold text-sm text-[#0A0D0E] font-sans">Course-Grounded</div>
<div className="text-xs text-[#5C6368] mt-1">Aligned with your syllabus</div>
</div>
</div>
</div>
</section>
{/*  7. PRE-FOOTER CTA  */}
<section className="py-20 bg-[#FAF8F5]" id="pre-footer-cta">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="reveal-on-scroll relative rounded-3xl bg-[#0A0D0E] text-[#FAF8F5] p-8 sm:p-14 lg:p-16 shadow-2xl text-center max-w-4xl mx-auto overflow-hidden border border-[#22282C] is-visible">
<h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#FAF8F5] mb-4 font-sans">
          Learn Smarter. Prepare Better.
        </h2>
<p className="text-[#C2B8A3] text-base leading-relaxed max-w-xl mx-auto mb-8">
          Focus your revision hours on what actually shifts your grade. Run your first course assessment in minutes.
        </p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
<a className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#FAF8F5] hover:bg-[#ECE8DF] text-[#0A0D0E] font-bold text-sm transition-all shadow-md hover:scale-105" href="#signup" onClick={(e) => { e.preventDefault(); onOpenAuth("signup"); }}>
<span>Start Free Assessment</span>
<svg className="w-4 h-4 text-current" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8H13M9.5 4.5L13 8L9.5 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></path></svg>
</a>
</div>
<div className="mt-4 text-xs text-[#8E979E]">No credit card required · Free for university students</div>
</div>
</div>
</section>
</main>

      {/*  8. FOOTER  */}
<footer className="bg-[#0A0D0E] text-[#8E979E] text-xs border-t border-[#1C2023]">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
<div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-12 border-b border-[#1C2023]">
{/*  Brand Column  */}
<div className="col-span-2">
<div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#0A0D0E] shadow-xs"><svg className="w-4.5 h-4.5 text-[#0A0D0E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"></path><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4"></circle><circle cx="12" cy="12" r="1.2" fill="#15803D"></circle><path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35"></path></svg></div><div className="flex items-baseline gap-1.5"><span className="font-serif italic text-xl tracking-tight text-[#FAF8F5] font-medium">GapFinder</span><span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#0A0D0E]">AI</span></div></div>
<p className="text-[#8E979E] leading-relaxed text-xs max-w-sm mb-6">The personalized revision companion designed for advanced STEM students and academic faculty.</p>
</div>
{/*  Links  */}
<div>
<h4 className="text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] mb-4">Platform</h4>
<ul className="space-y-2.5"><li><button type="button" onClick={() => openDrawer("diagnostics")} className="hover:text-[#FAF8F5] transition-colors text-left">Assessments</button></li><li><button type="button" onClick={() => openDrawer("dashboard")} className="hover:text-[#FAF8F5] transition-colors text-left">Dashboard</button></li><li><button type="button" onClick={() => openDrawer("gap-mapping")} className="hover:text-[#FAF8F5] transition-colors text-left">Gap Mapping</button></li><li><button type="button" onClick={() => openDrawer("lms-sync")} className="hover:text-[#FAF8F5] transition-colors text-left">LMS Sync</button></li></ul>
</div>
<div>
<h4 className="text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] mb-4">Resources</h4>
<ul className="space-y-2.5"><li><button type="button" onClick={() => openDrawer("docs")} className="hover:text-[#FAF8F5] transition-colors text-left">Documentation</button></li><li><button type="button" onClick={() => openDrawer("courses")} className="hover:text-[#FAF8F5] transition-colors text-left">Course Catalogs</button></li><li><button type="button" onClick={() => openDrawer("support")} className="hover:text-[#FAF8F5] transition-colors text-left">Student Support</button></li></ul>
</div>
<div>
<h4 className="text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] mb-4">Trust &amp; Legal</h4>
<ul className="space-y-2.5"><li><button type="button" onClick={() => openDrawer("licensing")} className="hover:text-[#FAF8F5] transition-colors text-left">Academic Licensing</button></li><li><button type="button" onClick={() => openDrawer("privacy")} className="hover:text-[#FAF8F5] transition-colors text-left">Privacy Policy</button></li><li><button type="button" onClick={() => openDrawer("terms")} className="hover:text-[#FAF8F5] transition-colors text-left">Terms of Service</button></li></ul>
</div>
</div>
<div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#5C6368] text-xs">
<div>© 2026 GapFinder AI. All rights reserved.</div>
<div className="flex items-center gap-6"><button type="button" onClick={() => openDrawer("privacy")} className="hover:text-[#FAF8F5] transition-colors">Privacy</button><button type="button" onClick={() => openDrawer("terms")} className="hover:text-[#FAF8F5] transition-colors">Terms</button><button type="button" onClick={() => openDrawer("contact")} className="hover:text-[#FAF8F5] transition-colors">Contact</button></div>
</div>
</div>
</footer>


      {/* Interactive Slide-over Drawer */}
      <div 
        id="footer-drawer-overlay" 
        onClick={(e) => { if (e.target === e.currentTarget) closeDrawer(); }}
        className={`fixed inset-0 z-50 bg-[#0A0D0E]/70 backdrop-blur-sm transition-opacity duration-300 ${
          activeDrawer ? 'flex opacity-100' : 'hidden opacity-0'
        } items-center justify-end`}
      >
        <div 
          id="footer-drawer-panel" 
          className={`w-full max-w-2xl h-full bg-[#FAF8F5] text-[#0A0D0E] border-l border-[#E4DFD5] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
            activeDrawer ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="px-6 py-4 border-b border-[#E4DFD5] bg-[#FFFFFF] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={closeDrawer} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D2C5] bg-[#FAF8F5] hover:bg-[#ECE8DF] text-xs font-bold text-[#0A0D0E] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back</span>
              </button>
              <div className="h-4 w-[1px] bg-[#D8D2C5]"></div>
              <div id="drawer-breadcrumbs" className="text-xs text-[#5C6368] font-medium flex items-center gap-1">
                <span className="hover:text-[#0A0D0E] cursor-pointer" onClick={closeDrawer}>Home</span>
                <span className="text-[#C2B8A3]">/</span>
                <span id="drawer-crumb-title" className="text-[#0A0D0E] font-semibold">
                  {activeDrawer ? `${activeDrawer.category} / ${activeDrawer.title}` : 'Documentation'}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={closeDrawer} 
              className="w-8 h-8 rounded-lg border border-[#D8D2C5] flex items-center justify-center text-[#5C6368] hover:text-[#0A0D0E] hover:bg-[#F5F2EB] transition-colors text-xs font-bold" 
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          <div id="drawer-dynamic-content" className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {activeDrawer?.content}
          </div>
          
          <div className="p-4 sm:px-8 border-t border-[#E4DFD5] bg-[#FFFFFF] flex items-center justify-between text-xs text-[#5C6368]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>GapFinder AI v2.4 Platform Spec</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={closeDrawer} 
                className="px-4 py-2 rounded-lg bg-[#0A0D0E] text-[#FAF8F5] font-bold text-xs hover:bg-[#1E2327] transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
