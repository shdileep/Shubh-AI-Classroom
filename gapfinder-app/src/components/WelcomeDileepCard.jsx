import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function WelcomeDileepCard({ name = 'Dileep', email = '', onEnterWorkspace }) {
  // Extract friendly first name (e.g., "Galla Dileep sai" -> "Dileep", "Elena Vance" -> "Elena")
  const getFirstName = (fullName) => {
    if (!fullName) return 'Dileep';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 1 && parts[0].toLowerCase() === 'galla') {
      return parts[1];
    }
    return parts[0] || 'Dileep';
  };

  const firstName = getFirstName(name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Main Card Container: Soft Ivory + Crisp White Layering */}
      <main className="w-full max-w-2xl bg-[#FAF8F5] border border-[#ECE6DC] rounded-3xl shadow-[0_20px_60px_-15px_rgba(13,17,23,0.18),0_1px_3px_rgba(13,17,23,0.06)] overflow-hidden transition-all duration-300 relative my-auto animate-scale-up">
        
        {/* Top Subtle Accent Bar with brand touch */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0D1117] via-[#0a2d21] to-[#0dfa6c]"></div>

        <div className="p-6 sm:p-10 space-y-6">
          
          {/* Header Row: Authentic Landing Page GapFinder AI Icon & Brand Title */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* Authentic Landing Page Icon with Glowing Beacon */}
              <div className="relative w-12 h-12 rounded-2xl bg-[#0D1117] flex items-center justify-center p-2 shadow-md border border-white/10 ring-1 ring-black/5 shrink-0">
                <svg className="w-6 h-6 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="12" cy="12" r="1.2" fill="#0DFA6C" />
                  <path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#0dfa6c] rounded-full border-2 border-[#FAF8F5] shadow-[0_0_8px_#0dfa6c]"></span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-serif italic text-2xl text-[#0D1117] font-medium tracking-tight">GapFinder</span>
                <span className="bg-[#0D1117] text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">AI</span>
              </div>
            </div>

            {email && (
              <span className="text-[11px] font-mono text-stone-500 bg-[#F5F1EB] px-2.5 py-1 rounded-full border border-[#ECE6DC]">
                {email}
              </span>
            )}
          </header>

          {/* Welcome Message Surface (Crisp White Card with soft ivory borders) */}
          <section className="bg-white border border-[#ECE6DC] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4 text-left">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#0b0f10] tracking-tight">
                Hi {firstName},
              </h1>
              <p className="text-base sm:text-lg font-serif italic text-stone-600">
                Welcome to your personalized learning workspace.
              </p>
            </div>

            <div className="space-y-3 pt-1 text-stone-600 font-sans text-xs sm:text-sm leading-relaxed">
              <p>
                Thank you for choosing GapFinder AI as your academic companion. We are genuinely excited to support you on every step of your learning path, helping uncover hidden conceptual gaps, master foundational topics, and turn challenging coursework into measurable academic confidence. Your personalized workspace is prepared and calibrated for your goals.
              </p>
            </div>

            {/* Handwritten Signature Section */}
            <div className="pt-4 border-t border-stone-200/60">
              <div className="flex items-center justify-between gap-4 relative">
                <div className="flex flex-col space-y-1 text-left relative z-10">
                  <span className="text-xs font-serif italic text-stone-500">Warmly,</span>
                  <div className="relative py-0.5">
                    <svg className="w-32 h-8 text-[#8A4A36]/80 overflow-visible select-none pointer-events-none" viewBox="0 0 160 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 32 C 18 10, 32 6, 42 16 C 52 28, 48 38, 38 35 C 26 31, 30 18, 55 22 C 72 25, 86 18, 102 24 C 114 28, 126 19, 142 22 M108 22 C 118 14, 134 10, 152 14" strokeWidth="1.4" opacity="0.85"></path>
                      <path d="M24 28 Q 70 38 150 25" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.5"></path>
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="font-serif font-semibold text-[#0b0f10] text-sm tracking-tight">The GapFinder</span>
                    <span className="bg-[#0b0f10] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide">AI</span>
                    <span className="font-serif font-semibold text-[#0b0f10] text-sm tracking-tight">Team</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Last Separate Box: Dedicated Soft Ivory Realm of GapFinder AI */}
          <section className="bg-[#F5F1EB] border border-[#E4DCcf] rounded-2xl p-5 sm:p-6 relative overflow-hidden group text-left">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full border border-[#DED5C6]/60 pointer-events-none"></div>
            <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border border-dashed border-[#DED5C6]/80 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif text-xl text-[#0D1117] font-medium">GapFinder</h3>
                  <span className="bg-[#0D1117] text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">AI</span>
                </div>
                <p className="text-xs font-sans text-stone-500">Diagnostics and review ready.</p>
              </div>

              <div className="sm:self-center shrink-0">
                <button 
                  type="button"
                  onClick={onEnterWorkspace}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D1117] text-white text-xs sm:text-sm font-semibold hover:bg-black transition-all shadow-sm group-hover:shadow-md cursor-pointer"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4 text-[#0dfa6c] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </section>

          {/* Footer Info */}
          <footer className="pt-2 flex flex-col sm:flex-row items-center gap-3 text-xs text-[#8A857D] border-t border-[#ECE6DC] justify-center">
            <div className="flex items-center gap-4">
              <span className="hover:text-[#0D1117] cursor-pointer transition-colors">Documentation</span>
              <span className="hover:text-[#0D1117] cursor-pointer transition-colors">Support</span>
              <span>© 2026 GapFinder AI</span>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
