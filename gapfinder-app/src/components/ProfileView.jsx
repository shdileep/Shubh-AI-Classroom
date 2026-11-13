import React, { useState } from 'react';
import { 
  Flame, Award, Calendar, Clock, CheckCircle2, 
  Shield, User, Zap
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

    </div>
  );
}
