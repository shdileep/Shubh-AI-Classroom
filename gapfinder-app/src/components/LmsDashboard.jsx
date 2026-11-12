import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle, X, ChevronRight, Play, BookOpen, AlertTriangle } from 'lucide-react';

export default function LmsDashboard({ onLogout, onBackToLanding, currentUser, authToken }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [llmModal, setLlmModal] = useState(null); // { type: 'diagnostic'|'drill'|'chat', data: any }
  const [llmLoading, setLlmLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    const token = authToken || localStorage.getItem('gapfinder_token');
    if (!token) {
      onLogout();
      return;
    }

    fetch('/api/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) onLogout();
          throw new Error('Failed to load dashboard telemetry');
        }
        return res.json();
      })
      .then(data => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard load error:', err);
        setLoading(false);
      });
  }, [authToken]);

  const handleRunDiagnostic = async (topic = 'Eigenvalues & Matrix Diagonalization') => {
    setLlmLoading(true);
    setLlmModal({ type: 'diagnostic', topic, data: null });
    try {
      const token = authToken || localStorage.getItem('gapfinder_token');
      const res = await fetch('/api/llm/diagnostic', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ topic, course: 'MATH 204: Multivariable Calculus' })
      });
      const data = await res.json();
      setLlmModal({ type: 'diagnostic', topic, data });
    } catch (e) {
      console.error(e);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleGenerateDrill = async (topic = 'Eigenvalues & Matrix Diagonalization') => {
    setLlmLoading(true);
    setLlmModal({ type: 'drill', topic, data: null });
    setSelectedAnswers({});
    try {
      const token = authToken || localStorage.getItem('gapfinder_token');
      const res = await fetch('/api/llm/generate-drill', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ topic, difficulty: 'Medium' })
      });
      const data = await res.json();
      setLlmModal({ type: 'drill', topic, data });
    } catch (e) {
      console.error(e);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);

    try {
      const token = authToken || localStorage.getItem('gapfinder_token');
      const res = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: msg, topic: 'Eigenvalues & Matrix Diagonalization' })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error contacting AI study tutor.' }]);
    }
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="bg-[#f9f9ff] text-[#141b2b] min-h-screen font-sans selection:bg-[#6bff8f] selection:text-[#002109]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-inverse-surface text-inverse-on-surface z-50 flex flex-col justify-between overflow-y-auto"><div className="flex flex-col"><div className="h-16 px-space-lg flex items-center gap-space-sm bg-inverse-surface cursor-pointer group" onClick={onBackToLanding}><div className="w-8 h-8 rounded-lg bg-[#0A0D0E] border border-[#293040] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:scale-105 transition-transform shrink-0"><svg className="w-4.5 h-4.5 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"></path><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4"></circle><circle cx="12" cy="12" r="1.2" fill="#0DFA6C"></circle><path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35"></path></svg></div><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-bold text-surface-container-lowest tracking-tight leading-none">GapFinder<span className="text-secondary-fixed">.AI</span></span><span className="font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Student LMS</span></div></div><div className="px-space-md py-space-sm"><div className="bg-surface-variant/10 rounded-lg p-space-sm flex items-center justify-between"><div className="flex items-center gap-space-sm"><div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></div><span className="font-label-md text-label-md text-inverse-on-surface">Algorithmic Track</span></div><span className="font-label-sm text-label-sm text-secondary-fixed font-bold uppercase tracking-wide">Active</span></div></div><nav className="px-space-md py-space-xs flex flex-col gap-space-md" data-active-classes="bg-primary-container text-on-primary-container font-semibold rounded-lg"><div className="flex flex-col gap-space-xs"><div className="px-space-sm py-space-xs font-label-sm text-label-sm uppercase tracking-widest text-outline-variant font-bold">Learning</div><a aria-current="page" className="flex items-center gap-space-sm px-space-sm py-space-xs transition-colors bg-primary-container text-on-primary-container font-semibold rounded-lg" data-path="overview" href="#"><span className="material-symbols-outlined text-[20px]">grid_view</span><span className="font-label-lg text-label-lg">Overview</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="my-materials" href="#"><span className="material-symbols-outlined text-[20px]">auto_stories</span><span className="font-label-lg text-label-lg">My Materials</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="topic-map" href="#"><span className="material-symbols-outlined text-[20px]">account_tree</span><span className="font-label-lg text-label-lg">Topic Map</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="diagnostic-tests" href="#"><span className="material-symbols-outlined text-[20px]">speed</span><span className="font-label-lg text-label-lg">Diagnostic Tests</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="practice-questions" href="#"><span className="material-symbols-outlined text-[20px]">code</span><span className="font-label-lg text-label-lg">Practice Questions</span></a></div><div className="flex flex-col gap-space-xs"><div className="px-space-sm py-space-xs font-label-sm text-label-sm uppercase tracking-widest text-outline-variant font-bold">My Performance</div><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="knowledge-gap-report" href="#"><span className="material-symbols-outlined text-[20px]">troubleshoot</span><span className="font-label-lg text-label-lg">Knowledge Gap Report</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="revision-planner" href="#"><span className="material-symbols-outlined text-[20px]">event_repeat</span><span className="font-label-lg text-label-lg">Revision Planner</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="progress-analytics" href="#"><span className="material-symbols-outlined text-[20px]">analytics</span><span className="font-label-lg text-label-lg">Progress Analytics</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="learning-history" href="#"><span className="material-symbols-outlined text-[20px]">history</span><span className="font-label-lg text-label-lg">Learning History</span></a></div><div className="flex flex-col gap-space-xs"><div className="px-space-sm py-space-xs font-label-sm text-label-sm uppercase tracking-widest text-outline-variant font-bold">Personal</div><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="ai-study-assistant" href="#"><span className="material-symbols-outlined text-[20px]">smart_toy</span><span className="font-label-lg text-label-lg">AI Study Assistant</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="bookmarks" href="#"><span className="material-symbols-outlined text-[20px]">bookmark</span><span className="font-label-lg text-label-lg">Bookmarks</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="my-notes" href="#"><span className="material-symbols-outlined text-[20px]">description</span><span className="font-label-lg text-label-lg">My Notes</span></a></div></nav></div><div className="p-space-md flex flex-col gap-space-xs bg-inverse-surface/80"><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="help-and-support" href="#"><span className="material-symbols-outlined text-[20px]">help</span><span className="font-label-md text-label-md">Help &amp; Support</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-inverse-on-surface/80 hover:bg-surface-variant/20 hover:text-inverse-on-surface transition-colors" data-path="settings" href="#"><span className="material-symbols-outlined text-[20px]">settings</span><span className="font-label-md text-label-md">Settings</span></a><a className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors" data-path="logout" href="#logout" onClick={(e) => { e.preventDefault(); onLogout(); }}><span className="material-symbols-outlined text-[20px]">logout</span><span className="font-label-md text-label-md font-semibold">Logout</span></a></div></aside>

      <div className="pl-72">
        {/* Top Header */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg"><div className="flex items-center gap-space-lg"><div className="flex items-center gap-2 cursor-pointer group" onClick={onBackToLanding}><div className="w-8 h-8 rounded-lg bg-[#0A0D0E] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:scale-105 transition-transform shrink-0"><svg className="w-4.5 h-4.5 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"></path><path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4"></path><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4"></circle><circle cx="12" cy="12" r="1.2" fill="#0DFA6C"></circle><path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35"></path></svg></div><span className="font-serif italic text-lg tracking-tight text-[#0A0D0E] font-medium hidden sm:inline">GapFinder</span></div><div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md"><span className="hover:text-on-surface cursor-pointer transition-colors" onClick={onBackToLanding}>Landing Page</span><span className="material-symbols-outlined text-[16px]">chevron_right</span><span className="text-on-surface font-semibold">Student Overview</span></div></div><div className="flex items-center gap-space-md"><div className="relative flex items-center"><span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">search</span><input className="bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-9 pr-4 py-1.5 rounded-lg w-64 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all" placeholder="Search topics, gaps, syntax..." type="text"/></div><button aria-label="Notifications" className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-[22px]">notifications</span><span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span></button><div className="flex items-center gap-space-sm pl-space-sm cursor-pointer group"><div className="flex flex-col text-right"><span className="font-label-lg text-label-lg text-on-surface font-semibold group-hover:text-primary transition-colors">{currentUser?.name || dashboardData?.user?.name || "Alex Chen"}</span><span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-end gap-1">{currentUser?.clerk_id && (<span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0DFA6C]" title="Clerk Google OAuth Verified"></span>)}{currentUser?.course || dashboardData?.user?.course || "Math & CS"}</span></div>{currentUser?.avatar_url ? (<img src={currentUser.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0DFA6C]/50" />) : (<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div>)}<span className="material-symbols-outlined text-on-surface-variant text-[18px] group-hover:text-on-surface transition-colors">expand_more</span></div></div></header>

        {/* Main Content */}
        <main className="w-full pt-16 px-space-lg pb-space-xl bg-background min-h-screen"><div className="flex flex-col w-full gap-space-lg">
{/*  Welcome & Tactical Actions Bar  */}
<div className="relative overflow-hidden rounded-[1rem] bg-surface-container-lowest p-space-lg shadow-sm">
<div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-secondary-fixed/15 blur-3xl pointer-events-none"></div>
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm">
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Tuesday, Oct 24, 2026
          </span>
<span className="font-label-sm text-label-sm text-outline">Sprint Cycle 04</span>
</div>
<h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
          Good morning, {currentUser?.name || dashboardData?.user?.name || "Alex Chen"}
        </h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Track your algorithmic learning path, discover undetected foundational gaps, and execute calibrated revisions daily.
        </p>
</div>
<div className="flex items-center gap-space-sm shrink-0">
<button className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload Syllabus
        </button>
<button onClick={() => handleRunDiagnostic("Eigenvalues & Matrix Diagonalization")} className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:shadow transition-all cursor-pointer">
<span className="material-symbols-outlined text-[18px] text-secondary-fixed">bolt</span>
          Take Diagnostic
        </button>
</div>
</div>
</div>
{/*  Primary Metric Grid (HackerRank Analytic Aesthetic)  */}
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
{/*  Card 1: Knowledge Score  */}
<div className="relative bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
<div className="flex items-start justify-between mb-space-sm">
<div className="w-10 h-10 rounded-lg bg-secondary-fixed/25 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>insights</span>
</div>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-fixed/20 text-on-secondary-container font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px]">trending_up</span> +6%
        </span>
</div>
<div>
<div className="flex items-baseline gap-1">
<span className="font-headline-xl text-headline-xl text-on-surface font-bold">{dashboardData?.metrics?.overall_knowledge_score ?? 74}</span>
<span className="font-headline-sm text-headline-sm text-outline font-semibold">%</span>
</div>
<div className="font-label-md text-label-md uppercase tracking-wider text-outline-variant font-bold mt-1">Overall Knowledge Score</div>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Target: 85% by Midterm</span>
<span className="text-primary font-semibold">Top 12%</span>
</div>
<div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: `${dashboardData?.metrics?.overall_knowledge_score ?? 74}%`}}></div>
</div>
</div>
{/*  Card 2: Topics Mastered  */}
<div className="relative bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
<div className="flex items-start justify-between mb-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>task_alt</span>
</div>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface font-label-sm text-label-sm">
          {dashboardData?.metrics?.topics_mastered_ratio ?? '75% Ratio'}
        </span>
</div>
<div>
<div className="flex items-baseline gap-1">
<span className="font-headline-xl text-headline-xl text-on-surface font-bold">{dashboardData?.metrics?.topics_mastered ? dashboardData.metrics.topics_mastered.split(' / ')[0] : '18'}</span>
<span className="font-headline-sm text-headline-sm text-outline font-semibold">/ {dashboardData?.metrics?.topics_mastered ? dashboardData.metrics.topics_mastered.split(' / ')[1] : '24'}</span>
</div>
<div className="font-label-md text-label-md uppercase tracking-wider text-outline-variant font-bold mt-1">Topics Mastered</div>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Core Competencies verified</span>
<span className="text-on-surface font-semibold">3 in review</span>
</div>
<div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{width: dashboardData?.metrics?.topics_mastered_ratio || '75%'}}></div>
</div>
</div>
{/*  Card 3: Critical Gaps  */}
<div className="relative bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
<div className="flex items-start justify-between mb-space-sm">
<div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error">
<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>warning</span>
</div>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-error-container text-on-error-container font-label-sm text-label-sm">
          High Priority
        </span>
</div>
<div>
<div className="flex items-baseline gap-1">
<span className="font-headline-xl text-headline-xl text-error font-bold">{dashboardData?.metrics?.critical_gaps_count !== undefined ? String(dashboardData.metrics.critical_gaps_count).padStart(2, '0') : '06'}</span>
<span className="font-headline-sm text-headline-sm text-outline font-semibold">Gaps</span>
</div>
<div className="font-label-md text-label-md uppercase tracking-wider text-outline-variant font-bold mt-1">Topics to Remediate</div>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Blocked Prerequisites: 2</span>
<span className="text-error font-semibold">Needs Drill</span>
</div>
<div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-error h-full rounded-full" style={{width: '25%'}}></div>
</div>
</div>
{/*  Card 4: Study Time  */}
<div className="relative bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
<div className="flex items-start justify-between mb-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings: '\'FILL\' 1'}}>timer</span>
</div>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
          1.2h / day avg
        </span>
</div>
<div>
<div className="flex items-baseline gap-1">
<span className="font-headline-xl text-headline-xl text-on-surface font-bold">{dashboardData?.metrics?.study_volume_hours ?? 28.5}</span>
<span className="font-headline-sm text-headline-sm text-outline font-semibold">hrs</span>
</div>
<div className="font-label-md text-label-md uppercase tracking-wider text-outline-variant font-bold mt-1">Study Volume (October)</div>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Active Streak: 8 Days</span>
<span className="text-secondary font-semibold">+4.2 hrs vs Sep</span>
</div>
<div className="w-full bg-surface-container-high h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: '82%'}}></div>
</div>
</div>
</div>
{/*  Continue Learning Hero & Focal Remediation (Horizontal Asymmetric Bento)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch">
{/*  Active Track Continue Module  */}
<div className="lg:col-span-8 bg-inverse-surface text-inverse-on-surface rounded-[1rem] p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
{/*  Ambient Visual Elements  */}
<div className="absolute right-0 top-0 w-96 h-full opacity-10 pointer-events-none flex items-center justify-end pr-6">
<svg className="w-72 h-72 text-surface-container-lowest" fill="none" stroke="currentColor" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="45" strokeDasharray="2 3" strokeWidth="0.5"></circle>
<circle cx="50" cy="50" r="32" strokeWidth="0.5"></circle>
<line strokeDasharray="1 2" strokeWidth="0.5" x1="50" x2="50" y1="5" y2="95"></line>
<line strokeDasharray="1 2" strokeWidth="0.5" x1="5" x2="95" y1="50" y2="50"></line>
<circle cx="72" cy="28" fill="currentColor" r="4"></circle>
<circle cx="28" cy="72" fill="currentColor" r="4"></circle>
</svg>
</div>
<div className="relative z-10 flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="px-2.5 py-1 rounded bg-surface-variant/20 text-secondary-fixed font-label-sm text-label-sm font-semibold tracking-wider uppercase">Active Remediation</span>
<span className="text-inverse-on-surface/60 font-body-sm text-body-sm">· MATH 204: Linear Algebra &amp; Diff Eq</span>
</div>
<span className="font-label-sm text-label-sm text-inverse-on-surface/60">Module 03 / 08</span>
</div>
<div>
<h2 className="font-headline-md text-headline-md font-bold text-surface-container-lowest tracking-tight">
            Eigenvalues &amp; Matrix Diagonalization
          </h2>
<p className="font-body-md text-body-md text-inverse-on-surface/80 mt-1 max-w-xl">
            Focus: Resolving spectral decomposition confusion identified in your Multivariable Diagnostic #3.
          </p>
</div>
<div className="bg-surface-variant/10 rounded-lg p-space-sm flex flex-col gap-space-xs max-w-xl">
<div className="flex items-center justify-between font-label-md text-label-md">
<span className="text-inverse-on-surface">Target Mastery Progress</span>
<span className="text-secondary-fixed font-bold">65% · 12 min drill left</span>
</div>
<div className="w-full bg-surface-variant/20 h-2 rounded-full overflow-hidden">
<div className="bg-secondary-fixed h-full rounded-full transition-all duration-500" style={{width: '65%'}}></div>
</div>
</div>
</div>
<div className="relative z-10 pt-space-lg flex flex-wrap items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="flex items-center gap-1.5 text-inverse-on-surface/70 font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary-fixed">checklist</span>
            8/12 Micro-problems
          </div>
<div className="flex items-center gap-1.5 text-inverse-on-surface/70 font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[18px]">psychology</span>
            Adaptive Difficulty: Medium
          </div>
</div>
<button onClick={() => handleGenerateDrill("Eigenvalues & Matrix Diagonalization")} className="inline-flex items-center gap-space-xs px-6 py-3 rounded-lg bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg font-bold hover:bg-secondary-fixed-dim transition-all shadow-md group cursor-pointer">
<span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110" style={{fontVariationSettings: '\'FILL\' 1'}}>play_arrow</span>
          Continue Learning
        </button>
</div>
</div>
{/*  Quick Knowledge Gap Micro-Snapshot  */}
<div className="lg:col-span-4 bg-surface-container-lowest rounded-[1rem] p-space-lg shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md uppercase tracking-wider text-outline-variant font-bold">Diagnostic Pulse</span>
<span className="material-symbols-outlined text-[18px] text-outline">tune</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Immediate Priority</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Subspaces with inverse determinant conditions are triggering cascade failures in subsequent modules.</p>
</div>
{/*  Small visual mini-matrix  */}
<div className="py-space-md flex flex-col gap-2">
<div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-error"></div>
<span className="font-label-md text-label-md text-on-surface font-medium">Quadratic Form Definiteness</span>
</div>
<span className="font-label-sm text-label-sm text-error font-semibold">38% Prof.</span>
</div>
<div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-error"></div>
<span className="font-label-md text-label-md text-on-surface font-medium">Basis &amp; Matrix Rank</span>
</div>
<span className="font-label-sm text-label-sm text-error font-semibold">44% Prof.</span>
</div>
<div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
<span className="font-label-md text-label-md text-on-surface font-medium">Gaussian Elimination</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">91% Prof.</span>
</div>
</div>
<a className="inline-flex items-center justify-between text-primary font-label-lg text-label-lg font-semibold hover:underline pt-space-xs" href="#">
<span>Inspect Complete Gap Tree</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
</div>
{/*  Knowledge Distribution & Diagnostics Breakdown  */}
<div className="flex flex-col gap-space-sm">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
<div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">Curriculum Knowledge Distribution</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Comprehensive breakdown of your 24 tracked syllabus concepts across active modules.</p>
</div>
<div className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
<span>Calibrated from 4 Diagnostic Tests</span>
</div>
</div>
{/*  3 Distribution Category Cards  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
{/*  Weak / Critical Gaps  */}
<div className="bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-error"></span>
<span className="font-label-md text-label-md uppercase tracking-wider text-error font-bold">Weak Topics</span>
</div>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-error-container text-on-error-container font-semibold">16% of Track</span>
</div>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg font-bold text-on-surface">4</span>
<span className="font-body-sm text-body-sm text-outline">Concepts Require Re-teaching</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Foundational misunderstandings detected in baseline tests.</p>
</div>
<div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Quadratic Roots &amp; Nullity</span>
<span className="text-error font-semibold">32% score</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Matrix Rank &amp; Vector Pivot</span>
<span className="text-error font-semibold">41% score</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Jordan Canonical Form</span>
<span className="text-error font-semibold">45% score</span>
</div>
</div>
<button onClick={() => handleRunDiagnostic("Quadratic Roots & Nullity")} className="mt-space-md w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer">
          Start Remediation Sprint
        </button>
</div>
{/*  Medium Topics  */}
<div className="bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="font-label-md text-label-md uppercase tracking-wider text-tertiary font-bold">Medium Topics</span>
</div>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">25% of Track</span>
</div>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg font-bold text-on-surface">6</span>
<span className="font-body-sm text-body-sm text-outline">Concepts in Reinforcement</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Solid intuition but intermittent calculation errors on boundary conditions.</p>
</div>
<div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Orthogonal Projections</span>
<span className="text-primary font-semibold">68% score</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Vector Subspaces</span>
<span className="text-primary font-semibold">71% score</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Gram-Schmidt Process</span>
<span className="text-primary font-semibold">73% score</span>
</div>
</div>
<button onClick={() => handleRunDiagnostic("Quadratic Roots & Nullity")} className="mt-space-md w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer">
          Practice 15 Edge Cases
        </button>
</div>
{/*  Strong / Mastered Topics  */}
<div className="bg-surface-container-lowest rounded-[1rem] p-space-md shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Strong Topics</span>
</div>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-fixed/30 text-on-secondary-container font-semibold">59% of Track</span>
</div>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg font-bold text-on-surface">14</span>
<span className="font-body-sm text-body-sm text-outline">Verified Masteries</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Consistently solved in under 90 seconds with zero conceptual misses.</p>
</div>
<div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Linear Systems &amp; Solvability</span>
<span className="text-secondary font-semibold">96% score</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Matrix Determinants</span>
<span className="text-secondary font-semibold">94% score</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface font-medium truncate max-w-[180px]">Dot Products &amp; Angles</span>
<span className="text-secondary font-semibold">98% score</span>
</div>
</div>
<button onClick={() => handleRunDiagnostic("Quadratic Roots & Nullity")} className="mt-space-md w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer">
          View Mastered Bank
        </button>
</div>
</div>
</div>
{/*  Lower Section: Recent Activity Feed & Interactive Study Schedule Snapshot  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
{/*  Activity Stream (8 columns)  */}
<div className="lg:col-span-8 bg-surface-container-lowest rounded-[1rem] p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Recent Diagnostic &amp; Study Activity</h3>
</div>
<a className="font-label-md text-label-md text-primary font-semibold hover:underline" href="#">Full Log</a>
</div>
<div className="flex flex-col gap-space-md">
{/*  Activity Item 1  */}
<div className="flex items-start justify-between gap-space-sm p-3 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="flex items-start gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary mt-0.5">
<span className="material-symbols-outlined text-[20px]">fact_check</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-lg text-label-lg font-semibold text-on-surface">Completed Multivariable Calculus Diagnostic #3</span>
<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed/20 text-on-secondary-container">Score: 78%</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Identified 2 critical gaps in partial derivatives of matrix functions.</p>
</div>
</div>
<div className="flex flex-col items-end shrink-0">
<span className="font-label-sm text-label-sm text-outline">2h ago</span>
<a className="font-label-md text-label-md text-primary hover:underline mt-1" href="#">Review Gaps</a>
</div>
</div>
{/*  Activity Item 2  */}
<div className="flex items-start justify-between gap-space-sm p-3 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="flex items-start gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface-variant mt-0.5">
<span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-lg text-label-lg font-semibold text-on-surface">Uploaded Study Material: "MIT-18.06-Lecture-Notes.pdf"</span>
<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-highest text-on-surface-variant">12 Topics Extracted</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">AI Engine generated 36 practice items and synced taxonomy map.</p>
</div>
</div>
<div className="flex flex-col items-end shrink-0">
<span className="font-label-sm text-label-sm text-outline">Yesterday</span>
<a className="font-label-md text-label-md text-primary hover:underline mt-1" href="#">View Syllabus</a>
</div>
</div>
{/*  Activity Item 3  */}
<div className="flex items-start justify-between gap-space-sm p-3 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="flex items-start gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-secondary mt-0.5">
<span className="material-symbols-outlined text-[20px]">psychology_alt</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-lg text-label-lg font-semibold text-on-surface">Revised Topic: Characteristic Polynomials</span>
<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed/20 text-on-secondary-container">+12% Bump</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Remediated roots computation across non-symmetric matrices.</p>
</div>
</div>
<div className="flex flex-col items-end shrink-0">
<span className="font-label-sm text-label-sm text-outline">2 days ago</span>
<a className="font-label-md text-label-md text-primary hover:underline mt-1" href="#">Report Card</a>
</div>
</div>
{/*  Activity Item 4  */}
<div className="flex items-start justify-between gap-space-sm p-3 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="flex items-start gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container mt-0.5">
<span className="material-symbols-outlined text-[20px]">calendar_month</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-lg text-label-lg font-semibold text-on-surface">Generated Adaptive Revision Plan</span>
<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-highest text-on-surface">14-Day Sprint</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Optimized schedule focusing 65% of study hours on linear transformation voids.</p>
</div>
</div>
<div className="flex flex-col items-end shrink-0">
<span className="font-label-sm text-label-sm text-outline">Oct 21</span>
<a className="font-label-md text-label-md text-primary hover:underline mt-1" href="#">View Schedule</a>
</div>
</div>
</div>
</div>
<div className="pt-space-md flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Continuous sync enabled with Canvas LMS</span>
<button className="text-outline hover:text-on-surface flex items-center gap-1 font-label-md text-label-md">
<span className="material-symbols-outlined text-[16px]">sync</span> Force Resync
        </button>
</div>
</div>
{/*  Right Sidebar / Study Assistant Widget (4 columns)  */}
<div className="lg:col-span-4 flex flex-col gap-space-md">
{/*  AI Assistant Card  */}
<div className="bg-surface-container-lowest rounded-[1rem] p-space-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">smart_toy</span>
</div>
<div>
<h4 className="font-label-lg text-label-lg font-bold text-on-surface">GapFinder Assistant</h4>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Trained on Course Syllabus</span>
</div>
</div>
<span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
</div>
<div className="my-space-md p-space-sm bg-surface-container-low rounded-lg">
<p className="font-body-sm text-body-sm text-on-surface italic">
            "Alex, your latest diagnostic reveals you consistently confuse the row space with the nullspace dimension theorem. Would you like a 3-question visual proof drill?"
          </p>
</div>
<div className="flex flex-col gap-2">
<button onClick={() => handleGenerateDrill("Nullspace Dimension Theorem")} className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
<span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Start Nullspace Visual Drill
          </button>
<button onClick={() => setLlmModal({ type: "chat", topic: "Eigenvalues & Matrix Diagonalization", data: null })} className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer">
            Ask Custom Question
          </button>
</div>
</div>
{/*  Quick Resource Reference Card  */}
<div className="bg-surface-container-lowest rounded-[1rem] p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-sm">
<h4 className="font-label-lg text-label-lg font-bold text-on-surface">Target Exam Milestone</h4>
<span className="font-label-sm text-label-sm text-outline">18 Days Remaining</span>
</div>
<div className="flex items-center gap-space-sm">
<div className="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface leading-none">12</span>
<span className="font-label-sm text-label-sm uppercase text-outline">Nov</span>
</div>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-semibold text-on-surface">MATH 204 Midterm II</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Covers Modules 1 through 5</span>
</div>
</div>
</div>
<div className="mt-space-md pt-space-xs flex items-center justify-between">
<span className="font-body-sm text-body-sm text-on-surface-variant">Preparedness Score: <strong className="text-on-surface">71%</strong></span>
<span className="font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider">On Pace</span>
</div>
</div>
</div>
</div>
</div></main>
      </div>

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111416] text-[#FAF8F5] px-4 py-3 rounded-xl shadow-2xl border border-[#22282C] flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-[#6bff8f] text-[20px]">check_circle</span>
          <span className="text-xs font-medium">{toastMessage}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="text-white/60 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive LLM Modal (AI Diagnostic / Micro-Drills / Socratic Assistant) */}
      {llmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#D8D2C5] overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Header */}
            <div className="bg-[#0A0D0E] text-[#FAF8F5] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#22282C] flex items-center justify-center text-[#0DFA6C]">
                  {llmModal.type === 'diagnostic' && <Brain className="w-4 h-4" />}
                  {llmModal.type === 'drill' && <Play className="w-4 h-4" />}
                  {llmModal.type === 'chat' && <Sparkles className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {llmModal.type === 'diagnostic' && 'AI Concept Diagnosis'}
                    {llmModal.type === 'drill' && 'Adaptive Socratic Micro-Drill'}
                    {llmModal.type === 'chat' && 'AI Course Study Assistant'}
                  </h3>
                  <p className="text-[11px] text-[#8E979E]">{llmModal.topic}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setLlmModal(null)} 
                className="w-8 h-8 rounded-lg bg-[#161A1D] hover:bg-[#22282C] text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {llmLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#5C6368]">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold">Running Bayesian concept graph tracing...</p>
                </div>
              ) : (
                <>
                  {/* DIAGNOSTIC MODAL */}
                  {llmModal.type === 'diagnostic' && llmModal.data && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5]">
                        <div>
                          <div className="text-xs text-[#5C6368]">Evaluated Concept Mastery</div>
                          <div className="text-3xl font-extrabold text-[#0A0D0E]">
                            {llmModal.data.mastery_score}%
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF2F2] text-[#8C3A3A] border border-[#E8D1D1]">
                          Needs Revision
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C6368]">Root Cause Deduction</h4>
                        <p className="text-sm text-[#0A0D0E] bg-white p-3 rounded-lg border border-[#E4DFD5] leading-relaxed">
                          {llmModal.data.root_cause}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C6368]">Blocked Downstream Prerequisites</h4>
                        <div className="flex flex-wrap gap-2">
                          {llmModal.data.prerequisites_blocked?.map((p, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-[#ECE8DF] text-[#0A0D0E] font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0A0D0E] text-[#FAF8F5] text-xs space-y-1">
                        <div className="text-[#0DFA6C] font-bold">Prescribed Revision Strategy:</div>
                        <p className="text-[#C2B8A3] leading-relaxed">{llmModal.data.recommendation}</p>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => handleGenerateDrill(llmModal.topic)} 
                        className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span>Start Adaptive Drill on This Topic</span>
                        <ChevronRight className="w-4 h-4 text-[#0DFA6C]" />
                      </button>
                    </div>
                  )}

                  {/* MICRO-DRILL MODAL */}
                  {llmModal.type === 'drill' && llmModal.data && (
                    <div className="space-y-5">
                      <div className="text-xs text-[#5C6368] font-medium flex items-center justify-between pb-2 border-b border-[#E4DFD5]">
                        <span>3 Targeted Multi-Choice Verification Proofs</span>
                        <span className="text-black font-bold">Difficulty: {llmModal.data.difficulty}</span>
                      </div>

                      {llmModal.data.drills?.map((d, dIdx) => (
                        <div key={d.id} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5] space-y-3">
                          <p className="text-xs font-bold text-[#0A0D0E]">
                            Q{dIdx + 1}. {d.question}
                          </p>
                          <div className="space-y-2">
                            {d.options.map((opt, oIdx) => {
                              const isSelected = selectedAnswers[d.id] === oIdx;
                              const isCorrect = oIdx === d.correct_option_index;
                              let btnClass = "w-full text-left p-2.5 rounded-lg text-xs border transition-all cursor-pointer ";
                              if (selectedAnswers[d.id] !== undefined) {
                                if (isSelected) {
                                  btnClass += isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold" : "bg-red-50 border-red-500 text-red-900 font-bold";
                                } else if (isCorrect) {
                                  btnClass += "bg-emerald-50/50 border-emerald-300 text-emerald-800";
                                } else {
                                  btnClass += "bg-white border-[#E4DFD5] text-[#5C6368] opacity-60";
                                }
                              } else {
                                btnClass += "bg-white border-[#E4DFD5] hover:border-black text-[#0A0D0E]";
                              }

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => setSelectedAnswers(prev => ({ ...prev, [d.id]: oIdx }))}
                                  className={btnClass}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {selectedAnswers[d.id] !== undefined && (
                            <div className="pt-2 text-[11px] text-[#5C6368] border-t border-[#E4DFD5] flex items-start gap-1.5">
                              <span className="font-bold text-black">Explanation:</span>
                              <span>{d.explanation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI CHAT ASSISTANT MODAL */}
                  {llmModal.type === 'chat' && (
                    <div className="flex flex-col h-[400px]">
                      <div className="flex-1 overflow-y-auto space-y-3 p-2">
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E4DFD5] text-xs text-[#0A0D0E]">
                          Hello! I am your course diagnostic tutor for <strong>{llmModal.topic}</strong>. Ask any derivation question or ask for an intuitive visual explanation!
                        </div>
                        {chatMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                              m.role === 'user' 
                                ? 'bg-[#0A0D0E] text-white rounded-br-none' 
                                : 'bg-[#F5F2EB] text-[#0A0D0E] border border-[#E4DFD5] rounded-bl-none'
                            }`}>
                              {m.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleSendChat} className="pt-3 border-t border-[#E4DFD5] flex items-center gap-2">
                        <input 
                          type="text" 
                          value={chatInput} 
                          onChange={(e) => setChatInput(e.target.value)} 
                          placeholder="e.g. Why does geometric multiplicity not equal algebraic multiplicity?" 
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D8D2C5] focus:outline-none focus:ring-1 focus:ring-black bg-[#FAF8F5]"
                        />
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#FAF8F5] border-t border-[#E4DFD5] px-6 py-3 flex items-center justify-between text-xs text-[#5C6368]">
              <span>Powered by GapFinder Bayesian LLM API</span>
              <button 
                type="button" 
                onClick={() => setLlmModal(null)} 
                className="px-4 py-1.5 rounded-lg bg-white border border-[#D8D2C5] hover:bg-[#ECE8DF] text-black font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
