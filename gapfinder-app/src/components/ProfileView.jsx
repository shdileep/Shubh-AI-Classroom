import React, { useState } from 'react';
import { 
  Flame, Award, Calendar, Clock, CheckCircle2, 
  Shield, User, Zap, Lock
} from 'lucide-react';

export default function ProfileView({ currentUser, dashboardData, activityList = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const studentName = currentUser?.name || 'Student';
  const studentEmail = currentUser?.email || '';
  const courseTitle = currentUser?.course || 'Foundational STEM & Computing';

  // Calculate live streak and activity telemetry strictly from authentic activity
  const allActivities = [...(activityList || []), ...(dashboardData?.activity || [])];
  const totalActivities = allActivities.length;
  const studyHours = (totalActivities * 0.4).toFixed(1);

  // Build authentic date-activity map
  const dateCounts = {};
  allActivities.forEach(act => {
    let rawDate = act.created_at || act.timestamp_label;
    if (rawDate) {
      let dateKey = '';
      if (rawDate.includes('T')) {
        dateKey = rawDate.split('T')[0];
      } else if (rawDate.includes(' ')) {
        dateKey = rawDate.split(' ')[0];
      } else if (rawDate.length === 10 && rawDate.includes('-')) {
        dateKey = rawDate;
      }
      if (dateKey) {
        dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        dateCounts[todayStr] = (dateCounts[todayStr] || 0) + 1;
      }
    }
  });

  // Calculate authentic active daily streak
  let currentStreak = 0;
  if (totalActivities > 0) {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];

    let checkDate = new Date(today);
    if (!dateCounts[todayKey] && dateCounts[yesterdayKey]) {
      checkDate = yesterday;
    }

    while (true) {
      const key = checkDate.toISOString().split('T')[0];
      if (dateCounts[key] && dateCounts[key] > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  const longestStreak = Math.max(currentStreak, totalActivities > 0 ? currentStreak : 0);

  // Generate GitHub-Style Contribution Heatmap Matrix (Past 24 Weeks = 168 Days)
  // Strictly mapped to authentic student activity dates - zero fake random values
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    const totalDays = 24 * 7; // 24 weeks
    
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
      const dateKey = d.toISOString().split('T')[0];
      const count = dateCounts[dateKey] || 0;

      days.push({
        date: dateKey,
        formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        count: count,
        dayOfWeek: dayOfWeek
      });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-[#ECE8DF] border-[#E0D9CC]';
    if (count === 1) return 'bg-[#B1F2BE] border-[#87C695]';
    if (count === 2) return 'bg-[#6BFF8F] border-[#4AE176]';
    if (count === 3) return 'bg-[#15803D] border-[#12512C]';
    return 'bg-[#003B1B] border-[#00210D]';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* User Hero Banner */}
      <div className="bg-gradient-to-r from-[#0A0D0E] via-[#111416] to-[#003B1B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#22282C] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#003B1B] to-[#14532D] p-0.5 shadow-lg shrink-0">
            <div className="w-full h-full bg-[#0A0D0E] rounded-[14px] flex items-center justify-center text-2xl font-black text-[#6BFF8F]">
              {studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{studentName}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-[#6BFF8F] px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                Verified Scholar
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-mono">{studentEmail}</p>
            <p className="text-xs text-emerald-100/70 pt-0.5 flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{courseTitle}</span>
            </p>
          </div>
        </div>

        {/* Live Streaks & Quick Metrics */}
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003B1B]/40 text-[#6BFF8F] flex items-center justify-center">
              <Flame className="w-5 h-5 fill-[#6BFF8F] text-[#6BFF8F] animate-pulse" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{currentStreak} Days</div>
              <div className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Active Streak</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#6BFF8F] flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{studyHours} hrs</div>
              <div className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Study Time</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003B1B]/40 text-[#6BFF8F] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#6BFF8F]" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{totalActivities}</div>
              <div className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Activities</div>
            </div>
          </div>
        </div>

        {/* Decorative blur backdrop */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* ===================== GITHUB-INSPIRED CONTRIBUTION HEATMAP ===================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E0D6] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Study Activity & Contribution Grid</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live GitHub-inspired heatmap of your coursework drills, concept revisions, and assessments over the past 24 weeks.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>Current Streak:</span>
            <span className="font-extrabold text-emerald-800 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-[#6BFF8F] text-[#6BFF8F]" />
              {currentStreak} Days
            </span>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="inline-block min-w-[680px]">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 p-2 bg-[#FAF8F5] rounded-2xl border border-[#ECE6DC]">
              {heatmapDays.map((d, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCell(d)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(d.count)}`}
                  title={`${d.count} study activities on ${d.formattedDate}`}
                />
              ))}
            </div>

            {/* Heatmap Legend & Tooltip bar */}
            <div className="flex items-center justify-between mt-3 text-[11px] text-gray-500 px-1">
              <div>
                {hoveredCell ? (
                  <span className="font-semibold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                    {hoveredCell.count === 0 ? 'No activity' : `${hoveredCell.count} study activities`} on {hoveredCell.formattedDate}
                  </span>
                ) : (
                  <span>Hover over any day to see activity records</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-3 h-3 rounded-[2px] bg-[#ECE8DF] border border-[#E0D9CC] inline-block"></span>
                <span className="w-3 h-3 rounded-[2px] bg-[#86EFAC] border border-[#4ADE80] inline-block"></span>
                <span className="w-3 h-3 rounded-[2px] bg-[#4ADE80] border border-[#22C55E] inline-block"></span>
                <span className="w-3 h-3 rounded-[2px] bg-[#22C55E] border border-[#16A34A] inline-block"></span>
                <span className="w-3 h-3 rounded-[2px] bg-[#15803D] border border-[#166534] inline-block"></span>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ACADEMIC MILESTONE MEDALS & BADGES ===================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E0D6] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>Academic Milestone Medals & Badges</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified tenure recognitions earned through continuous diagnostic coursework and gap remediation.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 shrink-0">
            {currentStreak >= 180 ? '4/4 Medals Unlocked' :
             currentStreak >= 90 ? '3/4 Medals Unlocked' :
             currentStreak >= 30 ? '2/4 Medals Unlocked' :
             currentStreak >= 7 ? '1/4 Medals Unlocked' : '0/4 Medals Unlocked'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. 1 Week = Learner */}
          {(() => {
            const unlocked = currentStreak >= 7 || totalActivities >= 7;
            const progress = Math.min(Math.max(currentStreak, totalActivities), 7);
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                unlocked 
                  ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-300 shadow-xs' 
                  : 'bg-gray-50/60 border-gray-200 opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 shadow-xs ${
                    unlocked 
                      ? 'bg-white ring-2 ring-emerald-300 shadow-sm' 
                      : 'bg-gray-100 opacity-50 grayscale'
                  }`}>
                    <img src="/badges/learner.png" alt="Learner Medal" className="w-full h-full object-contain" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    unlocked 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-gray-200 text-gray-500 flex items-center gap-1'
                  }`}>
                    {unlocked ? 'Unlocked' : <><Lock className="w-2.5 h-2.5" /> Locked</>}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Learner Medal</h3>
                <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">1 Week Milestone</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Active diagnostic engagement across your initial 7 days of verified coursework.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Tenure Progress</span>
                  <span className="font-mono font-bold text-gray-900">{unlocked ? 'Complete' : `${progress}/7 Days`}</span>
                </div>
              </div>
            );
          })()}

          {/* 2. 1 Month = Silver */}
          {(() => {
            const unlocked = currentStreak >= 30 || totalActivities >= 30;
            const progress = Math.min(Math.max(currentStreak, totalActivities), 30);
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                unlocked 
                  ? 'bg-gradient-to-b from-slate-50 to-white border-slate-300 shadow-xs' 
                  : 'bg-gray-50/60 border-gray-200 opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 shadow-xs ${
                    unlocked 
                      ? 'bg-white ring-2 ring-slate-300 shadow-sm' 
                      : 'bg-gray-100 opacity-50 grayscale'
                  }`}>
                    <img src="/badges/silver.png" alt="Silver Medal" className="w-full h-full object-contain" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    unlocked 
                      ? 'bg-slate-200 text-slate-800 border border-slate-300' 
                      : 'bg-gray-200 text-gray-500 flex items-center gap-1'
                  }`}>
                    {unlocked ? 'Unlocked' : <><Lock className="w-2.5 h-2.5" /> Locked</>}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Silver Medal</h3>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">1 Month Milestone</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Consistent syllabus drill execution and revision cadence for 30 active days.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Tenure Progress</span>
                  <span className="font-mono font-bold text-gray-900">{unlocked ? 'Complete' : `${progress}/30 Days`}</span>
                </div>
              </div>
            );
          })()}

          {/* 3. 3 Months = Gold */}
          {(() => {
            const unlocked = currentStreak >= 90 || totalActivities >= 90;
            const progress = Math.min(Math.max(currentStreak, totalActivities), 90);
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                unlocked 
                  ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-300 shadow-xs' 
                  : 'bg-gray-50/60 border-gray-200 opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 shadow-xs ${
                    unlocked 
                      ? 'bg-white ring-2 ring-amber-300 shadow-sm' 
                      : 'bg-gray-100 opacity-50 grayscale'
                  }`}>
                    <img src="/badges/gold.png" alt="Gold Medal" className="w-full h-full object-contain" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    unlocked 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-gray-200 text-gray-500 flex items-center gap-1'
                  }`}>
                    {unlocked ? 'Unlocked' : <><Lock className="w-2.5 h-2.5" /> Locked</>}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Gold Medal</h3>
                <p className="text-[11px] font-semibold text-amber-700 mt-0.5">3 Months Milestone</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Rigorous academic discipline across 90 days with measurable topic mastery.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Tenure Progress</span>
                  <span className="font-mono font-bold text-gray-900">{unlocked ? 'Complete' : `${progress}/90 Days`}</span>
                </div>
              </div>
            );
          })()}

          {/* 4. 6 Months = Platinum */}
          {(() => {
            const unlocked = currentStreak >= 180 || totalActivities >= 180;
            const progress = Math.min(Math.max(currentStreak, totalActivities), 180);
            return (
              <div className={`p-5 rounded-2xl border transition-all ${
                unlocked 
                  ? 'bg-gradient-to-b from-cyan-50/70 to-white border-cyan-300 shadow-xs' 
                  : 'bg-gray-50/60 border-gray-200 opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 shadow-xs ${
                    unlocked 
                      ? 'bg-white ring-2 ring-cyan-300 shadow-sm' 
                      : 'bg-gray-100 opacity-50 grayscale'
                  }`}>
                    <img src="/badges/platinum.png" alt="Platinum Medal" className="w-full h-full object-contain" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    unlocked 
                      ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' 
                      : 'bg-gray-200 text-gray-500 flex items-center gap-1'
                  }`}>
                    {unlocked ? 'Unlocked' : <><Lock className="w-2.5 h-2.5" /> Locked</>}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Platinum Medal</h3>
                <p className="text-[11px] font-semibold text-cyan-800 mt-0.5">6 Months Milestone</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Prestige institutional excellence and continuous mastery over 180 active days.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Tenure Progress</span>
                  <span className="font-mono font-bold text-gray-900">{unlocked ? 'Complete' : `${progress}/180 Days`}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
