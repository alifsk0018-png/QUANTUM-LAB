import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Cpu, Play, Workflow } from 'lucide-react';
import { useQuantum } from '../context/QuantumContext';
import { useTheme } from '../context/ThemeContext';
import TutorChat from '../components/tutor/TutorChat';

export default function AITutor() {
  const { profile } = useTheme();
  const {
    serializedCircuit,
    simulationResult,
    isSimulating,
    executeSimulation,
    backendHealth,
  } = useQuantum();

  const topProbs = simulationResult?.probabilities
    ? Object.entries(simulationResult.probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            AI Quantum Tutor — Q-ASSIST
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Context-aware quantum explanations grounded strictly in your active circuit and verified Qiskit simulator outputs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => executeSimulation()}
            disabled={isSimulating}
            className="sci-btn-primary text-xs"
          >
            <Play className="h-3.5 w-3.5" />
            {isSimulating ? 'Simulating...' : 'Run Active Circuit'}
          </button>
          <Link to="/circuit-builder" className="sci-btn-secondary text-xs">
            <Workflow className="h-3.5 w-3.5 text-cyan-400" />
            Edit Circuit
          </Link>
        </div>
      </div>

      {backendHealth && !backendHealth.ai_configured && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Non-AI Educational Reference Mode Active:</strong> No{' '}
            <code className="font-mono">AI_API_KEY</code> is configured in{' '}
            <code className="font-mono">backend/.env</code>. Q-ASSIST will transparently provide deterministic
            circuit diagnostics, verified simulator summaries, and curated physics explanations instead of live LLM output.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Q-ASSIST Chat */}
        <div className="lg:col-span-8">
          <TutorChat
            circuit={serializedCircuit}
            simulationResult={simulationResult}
            aiConfigured={Boolean(backendHealth?.ai_configured)}
            initialLevel={profile.defaultLevel || 'beginner'}
          />
        </div>

        {/* Context Inspector Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sci-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Cpu className="h-4 w-4" />
              Live Context Shared With Q-ASSIST
            </div>

            <div className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--lab-muted)]">Qubits</span>
                <span className="text-[var(--lab-text)] font-bold">{serializedCircuit.num_qubits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--lab-muted)]">Init Basis</span>
                <span className="text-cyan-400">|{serializedCircuit.initial_state}⟩</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--lab-muted)]">Gates</span>
                <span className="text-[var(--lab-text)]">{serializedCircuit.gates.length}</span>
              </div>
            </div>

            {serializedCircuit.gates.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[var(--lab-muted)]">
                  Gate Sequence
                </div>
                <div className="flex flex-wrap gap-1">
                  {serializedCircuit.gates.map((g, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[var(--lab-elevated)] border border-[var(--lab-border)] text-[11px] font-mono text-cyan-300"
                    >
                      {g.gate_name}({[...(g.control_qubits || []), ...(g.target_qubits || [])].join(',')})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--lab-border)]">
              <div className="text-[11px] font-semibold text-[var(--lab-muted)] mb-1.5">
                Verified Simulator Output
              </div>
              {!simulationResult ? (
                <p className="text-xs text-[var(--lab-muted)]">
                  No simulation executed yet. Click <strong>Run Active Circuit</strong> above so Q-ASSIST can interpret actual probabilities.
                </p>
              ) : (
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="text-[11px] text-emerald-400">
                    Mode: {simulationResult.simulation_mode.toUpperCase()} (Qiskit Software Simulator)
                  </div>
                  {topProbs.map(([state, p]) => (
                    <div
                      key={state}
                      className="flex items-center justify-between rounded bg-[var(--lab-elevated)] px-2.5 py-1"
                    >
                      <span className="text-cyan-400">|{state}⟩</span>
                      <span className="text-[var(--lab-text)]">
                        {(p * 100).toFixed(2)}% ({simulationResult.measurements?.[state] ?? 0} shots)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sci-card p-4 text-xs text-[var(--lab-muted)] space-y-1.5">
            <div className="font-semibold text-[var(--lab-text)]">Scientific Integrity Policy</div>
            <p>
              Q-ASSIST never fabricates measurement outcomes and always clearly distinguishes software simulator results from physical quantum hardware.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
