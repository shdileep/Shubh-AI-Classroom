import React from 'react';
import { Award, Sparkles, CheckCircle2, X, ArrowRight } from 'lucide-react';

export default function CelebrationModal({ isOpen, onClose, badgeName = 'Learner', streakDays = 1 }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-b from-[#FAF8F5] via-white to-[#F2EFE9] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Confetti & Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#6BFF8F]/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Badge Icon Emblem */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0A0D0E] via-[#111416] to-[#003B1B] p-1 shadow-xl flex items-center justify-center">
          <div className="w-full h-full bg-[#0A0D0E] rounded-[22px] flex items-center justify-center border border-emerald-400/30">
            <Award className="w-12 h-12 text-emerald-400 animate-bounce" />
          </div>
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#6BFF8F] rounded-full flex items-center justify-center shadow-md border-2 border-white">
            <Sparkles className="w-3.5 h-3.5 text-[#00210D]" />
          </span>
        </div>

        {/* Celebratory Copy */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
            Achievement Unlocked
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight pt-1">
            Hooray! You Earned the {badgeName} Badge!
          </h2>
          <p className="text-sm font-semibold text-emerald-900 font-serif italic">
            Keep learning! Your dedication is building unstoppable academic momentum.
          </p>
        </div>

        {/* Achievement Detail Pill */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D6] rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Milestone Satisfied</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Completed your initial study activity and demonstrated active commitment to course mastery.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-[#003B1B] hover:bg-[#14532D] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <span>Continue Learning</span>
          <ArrowRight className="w-4 h-4 text-[#6BFF8F]" />
        </button>

      </div>
    </div>
  );
}
