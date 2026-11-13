import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Maximize2, Minimize2, Minus, ArrowUpRight, Send, 
  Paperclip, FileText, RefreshCw
} from 'lucide-react';
import FlowchartViewer from './FlowchartViewer';

export default function FloatingAssistantDrawer({
  isOpen,
  onToggle,
  onClose,
  onRedirectToOriginalPage,
  activeTab,
  assistantMessages = [],
  assistantLoading,
  onSendMessage,
  currentUser,
  isTakingAssessment = false
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages, isOpen, isMaximized]);

  // When taking exam/quiz or when activeTab is 'assistant', the floating assistant is completely hidden
  if (activeTab === 'assistant' || isTakingAssessment) {
    return null;
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: typeof event.target.result === 'string' ? event.target.result.slice(0, 4000) : ''
        });
      };
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file);
      } else {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: `Document: ${file.name} (${Math.round(file.size / 1024)} KB)`
        });
      }
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && !attachedFile) return;

    onSendMessage(trimmed || `Please analyze this attached document: ${attachedFile?.name}`, {
      attachment_name: attachedFile?.name,
      attachment_content: attachedFile?.content
    });

    setInputText('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* 1. Floating Action Bubble (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsMaximized(false);
            onToggle();
          }}
          aria-label="Open Shubh AI Assistant"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#003B1B] via-[#0A0D0E] to-[#003B1B] hover:from-[#003B1B] hover:to-[#14532D] text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,59,27,0.4)] border border-emerald-500/40 transition-all duration-300 hover:scale-105 group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">Shubh AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#6BFF8F]"></span>
        </button>
      )}

      {/* 2. Floating AI Container: Toggles between Small Card and Maximized 30% Panel */}
      {isOpen && (
        <div
          className={
            isMaximized
              ? "fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] md:w-[30vw] min-w-[340px] max-w-[460px] bg-[#FAF9F7] shadow-[-10px_0_35px_rgba(0,0,0,0.25)] border-l border-[#E5E0D6] flex flex-col h-screen animate-in slide-in-from-right duration-300"
              : "fixed bottom-6 right-6 z-50 w-[360px] sm:w-[380px] h-[520px] max-h-[85vh] bg-[#FAF9F7] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.28)] border border-[#E5E0D6] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          }
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#E5E0D6] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0A0D0E] text-emerald-300 flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-900 tracking-tight leading-tight">Shubh AI Assistant</h3>
                <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">Study & Concept Assistant</p>
              </div>
            </div>

            {/* Header Controls: Maximize/Restore, Minimize, Close */}
            <div className="flex items-center gap-1">
              {isMaximized ? (
                <>
                  <button
                    onClick={() => setIsMaximized(false)}
                    title="Minimize to small card"
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onRedirectToOriginalPage}
                    title="Open full page"
                    className="p-1.5 text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsMaximized(true)}
                  title="Maximize (30% screen, top to bottom)"
                  className="p-1.5 text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                title="Minimize to floating button"
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                title="Close"
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar bg-[#FAF9F7]">
            {/* Message Stream */}
            {assistantMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#0A0D0E] text-emerald-300 flex items-center justify-center shrink-0 text-[10px] shadow-2xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl text-xs max-w-[85%] space-y-2 leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-[#0A0D0E] text-white rounded-br-none'
                    : 'bg-white border border-[#E5E0D6] text-gray-800 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-line text-xs">{msg.text}</p>

                  {/* Render Visual Flowchart if Mermaid diagram exists */}
                  {msg.text && (msg.text.includes('```mermaid') || msg.text.includes('graph TD') || msg.text.includes('flowchart TD')) && (
                    <FlowchartViewer content={msg.text} />
                  )}
                </div>
              </div>
            ))}

            {assistantLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 italic p-2.5 bg-white rounded-xl border border-gray-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                <span>Processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached File Preview Chip */}
          {attachedFile && (
            <div className="px-3.5 py-1.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{attachedFile.name}</span>
              </div>
              <button 
                onClick={() => setAttachedFile(null)}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-2.5 bg-[#FAF8F5] border-t border-[#E5E0D6]">
            <div className="flex items-center gap-1.5">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,.docx,.txt,.md,.png,.jpg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach document or notes"
                className="p-2 text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-200 bg-white cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              <input
                type="text"
                placeholder="Ask Shubh AI Assistant..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              />

              <button
                onClick={() => handleSend()}
                disabled={assistantLoading || (!inputText.trim() && !attachedFile)}
                className="p-2 bg-[#0A0D0E] hover:bg-[#003B1B] text-white rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
