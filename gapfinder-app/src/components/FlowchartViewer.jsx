import React from 'react';
import { GitCommit, ArrowDown, CheckCircle2, HelpCircle } from 'lucide-react';

/**
 * Clean, robust flowchart visualizer that renders Mermaid flowchart syntax
 * or step-by-step visual decision trees without external heavy dependencies.
 */
export default function FlowchartViewer({ content }) {
  if (!content) return null;

  // Extract mermaid code block if present
  let mermaidText = content;
  const match = content.match(/```(?:mermaid)?([\s\S]*?)```/);
  if (match) {
    mermaidText = match[1].trim();
  }

  // Parse lines to build node hierarchy
  const lines = mermaidText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('graph') && !l.startsWith('flowchart'));
  
  const nodes = [];
  const connections = [];

  lines.forEach((line, idx) => {
    // Check for A --> B or A -->|label| B or A[label]
    if (line.includes('-->')) {
      const parts = line.split('-->');
      const leftRaw = parts[0].trim();
      const rightRaw = parts[1].trim();
      
      let condition = '';
      let targetRaw = rightRaw;
      if (rightRaw.startsWith('|')) {
        const condMatch = rightRaw.match(/\|([^|]+)\|(.*)/);
        if (condMatch) {
          condition = condMatch[1].trim();
          targetRaw = condMatch[2].trim();
        }
      }

      // Extract node IDs and clean labels
      const cleanNode = (str) => {
        const bracketMatch = str.match(/([A-Za-z0-9_]+)\[(.*?)\]/) ||
                             str.match(/([A-Za-z0-9_]+)\{\{(.*?)\}\}/) ||
                             str.match(/([A-Za-z0-9_]+)\{(.*?)\}/) ||
                             str.match(/([A-Za-z0-9_]+)\((.*?)\)/);
        if (bracketMatch) {
          return { id: bracketMatch[1], label: bracketMatch[2], isDecision: str.includes('{') };
        }
        return { id: str.trim(), label: str.trim(), isDecision: false };
      };

      const source = cleanNode(leftRaw);
      const target = cleanNode(targetRaw);

      if (!nodes.some(n => n.id === source.id)) nodes.push(source);
      if (!nodes.some(n => n.id === target.id)) nodes.push(target);

      connections.push({ from: source.id, to: target.id, condition });
    } else {
      // Standalone node definition
      const clean = line.replace(/^[A-Za-z0-9_]+[\[\{\(]/, '').replace(/[\]\}\)]$/, '');
      if (clean && clean.length > 1) {
        nodes.push({ id: `node_${idx}`, label: clean, isDecision: line.includes('{') });
      }
    }
  });

  // Fallback: If no structured nodes were parsed, render numbered steps
  if (nodes.length === 0) {
    const rawSteps = mermaidText
      .split('\n')
      .map(s => s.replace(/^[0-9]+[\.\)]\s*/, '').trim())
      .filter(s => s.length > 2);

    return (
      <div className="my-3 p-4 bg-emerald-950/5 border border-emerald-800/20 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
          <GitCommit className="w-4 h-4 text-emerald-600" />
          <span>Concept Flowchart Diagram</span>
        </div>
        <div className="space-y-2">
          {rawSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                {idx + 1}
              </div>
              <div className="flex-1 bg-white p-2.5 rounded-lg border border-emerald-100 text-xs font-medium text-gray-800 shadow-2xs">
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 p-4 bg-gradient-to-b from-[#F7FAF8] to-[#EEF5F1] border border-emerald-700/20 rounded-2xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-700/10 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
          <GitCommit className="w-4 h-4 text-emerald-700" />
          <span>Interactive Concept Flowchart</span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
          Visual Decision Tree
        </span>
      </div>

      <div className="flex flex-col items-center space-y-2 py-2">
        {nodes.map((node, i) => {
          const incoming = connections.filter(c => c.to === node.id);
          return (
            <React.Fragment key={node.id}>
              {i > 0 && (
                <div className="flex flex-col items-center my-0.5">
                  {incoming.length > 0 && incoming[0].condition && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs mb-1">
                      {incoming[0].condition}
                    </span>
                  )}
                  <ArrowDown className="w-4 h-4 text-emerald-600 animate-pulse" />
                </div>
              )}

              <div 
                className={`max-w-md w-full px-4 py-3 rounded-xl transition-all shadow-xs ${
                  node.isDecision
                    ? 'bg-[#F4EFE6] border-2 border-[#D8D2C5] text-[#725B38] font-semibold text-center'
                    : i === 0
                    ? 'bg-[#0A0D0E] text-white border border-[#22282C] font-bold text-center'
                    : i === nodes.length - 1
                    ? 'bg-[#003B1B] text-[#6BFF8F] font-bold border border-[#14532D] text-center'
                    : 'bg-white text-gray-800 border border-emerald-200/80 font-medium'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs leading-snug">{node.label}</span>
                  {node.isDecision ? (
                    <HelpCircle className="w-3.5 h-3.5 text-[#725B38] shrink-0" />
                  ) : i === nodes.length - 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6BFF8F] shrink-0" />
                  ) : null}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
