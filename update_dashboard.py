import re

with open('gapfinder-app/src/components/LmsDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useEffect and API integration
imports_repl = """import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle, X, ChevronRight, Play, BookOpen, AlertTriangle } from 'lucide-react';"""

content = content.replace("import React, { useState } from 'react';", imports_repl)

# Update component signature and state
old_sig = "export default function LmsDashboard({ onLogout, onBackToLanding }) {"
new_sig = """export default function LmsDashboard({ onLogout, onBackToLanding, currentUser, authToken }) {
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
        body: JSON.stringify({ topic, course: 'Active Diagnostic Workspace' })
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
  };"""

content = content.replace(old_sig, new_sig)

# Connect Take Diagnostic button
content = content.replace(
    'Take Diagnostic\n        </button>',
    'Take Diagnostic\n        </button>'
)

# Replace buttons in JSX with click handlers
content = content.replace(
    '<button className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:shadow transition-all">',
    '<button onClick={() => handleRunDiagnostic("Eigenvalues & Matrix Diagonalization")} className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-sm hover:shadow transition-all cursor-pointer">'
)

# Connect Continue Learning button
content = content.replace(
    '<button className="inline-flex items-center gap-space-xs px-6 py-3 rounded-lg bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg font-bold hover:bg-secondary-fixed-dim transition-all shadow-md group">',
    '<button onClick={() => handleGenerateDrill("Eigenvalues & Matrix Diagonalization")} className="inline-flex items-center gap-space-xs px-6 py-3 rounded-lg bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg font-bold hover:bg-secondary-fixed-dim transition-all shadow-md group cursor-pointer">'
)

# Connect Start Remediation Sprint button
content = content.replace(
    'Start Remediation Sprint\n        </button>',
    'Start Remediation Sprint\n        </button>'
)
content = content.replace(
    '<button className="mt-space-md w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors">',
    '<button onClick={() => handleRunDiagnostic("Quadratic Roots & Nullity")} className="mt-space-md w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer">'
)

# Connect AI Study Assistant Start Nullspace Drill & Ask Custom Question
content = content.replace(
    '<button className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all">',
    '<button onClick={() => handleGenerateDrill("Nullspace Dimension Theorem")} className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">'
)
content = content.replace(
    '<button className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors">',
    '<button onClick={() => setLlmModal({ type: "chat", topic: "Eigenvalues & Matrix Diagonalization", data: null })} className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer">'
)

# Append Modal JSX before final closing div
modal_jsx = """
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
"""

content = content.replace("    </div>\n  );\n}", modal_jsx + "    </div>\n  );\n}")

with open('gapfinder-app/src/components/LmsDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated gapfinder-app/src/components/LmsDashboard.jsx successfully!")
