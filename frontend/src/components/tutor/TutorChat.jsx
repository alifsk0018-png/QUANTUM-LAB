import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, Cpu, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatWithTutor, explainWithTutor, extractApiError } from '../../services/api';
import MarkdownRenderer from '../ui/MarkdownRenderer';

const QUICK_ACTIONS = [
  { label: 'Explain My Circuit', prompt: 'Explain my current quantum circuit step by step.', contextType: 'circuit', attachCircuit: true, attachResults: true },
  { label: 'Explain My Results', prompt: 'Explain my simulation results, probabilities, and shot counts.', contextType: 'results', attachCircuit: true, attachResults: true },
  { label: 'What Is Superposition?', prompt: 'What is quantum superposition and how does the Hadamard gate create it?', contextType: 'concept', attachCircuit: false, attachResults: false },
  { label: 'How Does Entanglement Work?', prompt: 'How does quantum entanglement work and why are Bell states correlated?', contextType: 'concept', attachCircuit: false, attachResults: false },
  { label: 'Suggest an Experiment', prompt: 'Suggest an interesting quantum experiment I should run next in QUANTUM LAB.', contextType: 'chat', attachCircuit: true, attachResults: true },
  { label: 'Debug My Circuit', prompt: 'Debug my circuit: check for gate cancellations, inactive controls, or common mistakes.', contextType: 'circuit', attachCircuit: true, attachResults: true },
];

export default function TutorChat({
  circuit,
  simulationResult,
  aiConfigured = false,
  initialLevel = 'beginner',
  compact = false,
}) {
  const [level, setLevel] = useState(initialLevel);
  const [attachCircuit, setAttachCircuit] = useState(true);
  const [attachResults, setAttachResults] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'intro',
      role: 'assistant',
      isAiGenerated: false,
      content:
        'Hello! I am **Q-ASSIST**, your intelligent quantum guide. Ask me any quantum computing concept, click a quick action below, or attach your active circuit and verified Qiskit simulation results for tailored analysis.',
      suggestions: [
        'Explain my circuit',
        'What is superposition?',
        'How does entanglement work?',
      ],
    },
  ]);

  const scrollEndRef = useRef(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text, opts = {}) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const useCircuit = opts.attachCircuit ?? attachCircuit;
    const useResults = opts.attachResults ?? attachResults;
    const contextType = opts.contextType || 'chat';

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'intro')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const fn = contextType === 'chat' ? chatWithTutor : explainWithTutor;
      const res = await fn({
        message: trimmed,
        context_type: contextType,
        circuit_config: useCircuit && circuit ? circuit : null,
        simulation_results: useResults && simulationResult ? simulationResult : null,
        level,
        conversation_history: historyPayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: res.explanation,
          isAiGenerated: Boolean(res.is_ai_generated),
          suggestions: res.suggestions || [],
        },
      ]);
    } catch (err) {
      const msg = extractApiError(err, 'Unable to reach Q-ASSIST backend.');
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          isAiGenerated: false,
          content: `⚠️ **Backend Request Error:** ${msg}`,
          suggestions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sci-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--lab-border)] bg-[var(--lab-elevated)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--lab-text)]">Q-ASSIST</h2>
              <span
                className={`sci-badge ${
                  aiConfigured
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {aiConfigured ? 'Live LLM Ready' : 'Educational Reference Fallback'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--lab-muted)]">
              Your Intelligent Quantum Guide · Verified simulator context
            </p>
          </div>
        </div>

        {/* Difficulty level selector */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] p-0.5">
          {['beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition ${
                level === lvl
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2.5 border-b border-[var(--lab-border)] flex flex-wrap gap-1.5 bg-[var(--lab-surface)]">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            type="button"
            disabled={loading}
            onClick={() =>
              sendMessage(qa.prompt, {
                contextType: qa.contextType,
                attachCircuit: qa.attachCircuit,
                attachResults: qa.attachResults,
              })
            }
            className="px-2.5 py-1 rounded-full border border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[11px] font-medium text-[var(--lab-text)] hover:border-cyan-400/60 hover:text-cyan-400 transition disabled:opacity-50"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          compact ? 'max-h-[420px]' : 'min-h-[380px] max-h-[600px]'
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-4 py-3 ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                    : 'border border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-text)]'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-[var(--lab-border)]">
                    {msg.isAiGenerated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <Sparkles className="h-3 w-3" />
                        AI-Generated Explanation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                        <BookOpen className="h-3 w-3" />
                        Educational Reference (Non-AI Fallback)
                      </span>
                    )}
                  </div>
                )}

                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>

              {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={loading}
                      onClick={() => sendMessage(s)}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-cyan-500/25 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            Q-ASSIST is analysing your quantum state...
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Footer: context toggles + input box */}
      <div className="p-3 border-t border-[var(--lab-border)] bg-[var(--lab-elevated)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--lab-muted)]">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={attachCircuit}
                onChange={(e) => setAttachCircuit(e.target.checked)}
                className="accent-cyan-400"
              />
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>Attach Active Circuit ({circuit?.gates?.length || 0} gates)</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={attachResults}
                onChange={(e) => setAttachResults(e.target.checked)}
                disabled={!simulationResult}
                className="accent-cyan-400"
              />
              <CheckCircle2
                className={`h-3.5 w-3.5 ${
                  simulationResult ? 'text-emerald-400' : 'text-slate-500'
                }`}
              />
              <span>
                {simulationResult ? 'Attach Verified Results' : 'No simulation run yet'}
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setMessages((prev) => prev.slice(0, 1))}
            className="inline-flex items-center gap-1 hover:text-cyan-400 transition"
          >
            <RotateCcw className="h-3 w-3" />
            Clear chat
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            aria-label="Ask Q-ASSIST a quantum question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Q-ASSIST about superposition, your circuit, or simulation outputs..."
            className="sci-input flex-1"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="sci-btn-primary px-4"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
