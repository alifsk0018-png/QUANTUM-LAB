import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Beaker,
  Bot,
  CheckCircle2,
  ListChecks,
  Play,
  Save,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { PRESET_EXPERIMENTS } from '../data/experiments';
import { useQuantum } from '../context/QuantumContext';
import { useTheme } from '../context/ThemeContext';
import { explainWithTutor, extractApiError } from '../services/api';
import CircuitDiagram from '../components/visualizations/CircuitDiagram';
import MeasurementHistogram from '../components/visualizations/MeasurementHistogram';
import StatevectorDisplay from '../components/visualizations/StatevectorDisplay';
import BlochSphere from '../components/visualizations/BlochSphere';
import QSphere from '../components/visualizations/QSphere';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import SaveExperimentModal from '../components/ui/SaveExperimentModal';
import toast from 'react-hot-toast';

export default function QuantumExperiments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { executeSimulation, loadCircuit, setSimulationResult } = useQuantum();

  const initialPreset = searchParams.get('preset') || PRESET_EXPERIMENTS[0].id;
  const [selectedId, setSelectedId] = useState(initialPreset);
  const [simMode, setSimMode] = useState('ideal');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [askingAi, setAskingAi] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    const p = searchParams.get('preset');
    if (p && PRESET_EXPERIMENTS.some((e) => e.id === p)) {
      setSelectedId(p);
      setResult(null);
      setAiResponse(null);
    }
  }, [searchParams]);

  const experiment = useMemo(
    () => PRESET_EXPERIMENTS.find((e) => e.id === selectedId) || PRESET_EXPERIMENTS[0],
    [selectedId]
  );

  const selectExperiment = (id) => {
    setSelectedId(id);
    setSearchParams({ preset: id });
    setResult(null);
    setAiResponse(null);
  };

  const handleRunExperiment = async () => {
    setRunning(true);
    try {
      const simRes = await executeSimulation(experiment.circuit, {
        simulation_mode: simMode,
        num_shots: 1024,
        noise_params: { gate_error: 0.02, measurement_error: 0.02 },
      });
      setResult(simRes);
    } finally {
      setRunning(false);
    }
  };

  const handleExplainExperiment = async () => {
    setAskingAi(true);
    try {
      const res = await explainWithTutor({
        message: `Explain the "${experiment.title}" experiment, what its circuit gates do, and interpret the simulator output.`,
        context_type: result ? 'results' : 'circuit',
        circuit_config: experiment.circuit,
        simulation_results: result,
        level: experiment.difficulty.toLowerCase(),
      });
      setAiResponse(res);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to get explanation from Q-ASSIST.'));
    } finally {
      setAskingAi(false);
    }
  };

  const handleOpenInBuilder = () => {
    loadCircuit(experiment.circuit, false);
    if (result) setSimulationResult(result);
    navigate('/circuit-builder');
  };

  // Marginal probability on Bob's qubit q2 (leftmost bit in Qiskit 3Q bitstring) for Teleportation
  const teleportBobMarginal = useMemo(() => {
    if (experiment.id !== 'teleportation' || !result?.probabilities) return null;
    let p0 = 0;
    let p1 = 0;
    for (const [bits, p] of Object.entries(result.probabilities)) {
      if (bits[0] === '0') p0 += p;
      else p1 += p;
    }
    return { p0, p1 };
  }, [experiment.id, result]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            Quantum Experiments Library
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Guided interactive Qiskit experiments covering Superposition, Entanglement, Teleportation, Interference &amp; Grover&apos;s Search.
          </p>
        </div>
      </div>

      {/* Experiment Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PRESET_EXPERIMENTS.map((exp) => {
          const active = exp.id === experiment.id;
          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => selectExperiment(exp.id)}
              className={`text-left rounded-xl border p-3.5 transition ${
                active
                  ? 'border-cyan-400 bg-cyan-500/15 shadow-sm'
                  : 'border-[var(--lab-border)] bg-[var(--lab-surface)] hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-cyan-400">EXP 0{exp.number}</span>
                <span className="text-[var(--lab-muted)]">{exp.circuit.num_qubits}Q</span>
              </div>
              <div className="text-xs font-bold text-[var(--lab-text)]">{exp.title}</div>
              <div className="text-[11px] text-[var(--lab-muted)] mt-0.5">{exp.difficulty}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Experiment Detail Workspace */}
      <div className="sci-card p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--lab-border)] pb-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="sci-badge bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Experiment {experiment.number} · {experiment.category}
              </span>
              <span className="sci-badge bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {experiment.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--lab-text)] pt-1">
              {experiment.title}
            </h2>
            <p className="text-sm text-[var(--lab-muted)] leading-relaxed">
              {experiment.introduction}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-0.5">
              {['ideal', 'noisy'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSimMode(m)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition ${
                    simMode === m
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRunExperiment}
              disabled={running}
              className="sci-btn-primary text-xs"
            >
              <Play className="h-4 w-4" />
              {running ? 'Running Qiskit...' : 'Run Experiment'}
            </button>

            <button
              type="button"
              onClick={handleExplainExperiment}
              disabled={askingAi}
              className="sci-btn-secondary text-xs"
            >
              <Bot className="h-4 w-4 text-purple-400" />
              {askingAi ? 'Asking Q-ASSIST...' : 'AI Explanation'}
            </button>

            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              className="sci-btn-secondary text-xs"
            >
              <Save className="h-4 w-4 text-cyan-400" />
              Save
            </button>

            <button
              type="button"
              onClick={handleOpenInBuilder}
              className="sci-btn-secondary text-xs"
            >
              <Workflow className="h-4 w-4" />
              Edit in Builder
            </button>
          </div>
        </div>

        {/* Objectives + Procedure + Circuit Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                Learning Objectives
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--lab-text)]">
                {experiment.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                <ListChecks className="h-4 w-4" />
                Step-by-Step Procedure
              </div>
              <ol className="space-y-1.5 text-xs text-[var(--lab-text)]">
                {experiment.procedure.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-cyan-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <CircuitDiagram
              gates={experiment.circuit.gates}
              num_qubits={experiment.circuit.num_qubits}
              initial_state={experiment.circuit.initial_state}
              title={`${experiment.title} — Circuit Diagram`}
            />

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs text-[var(--lab-text)]">
              <span className="font-semibold text-cyan-400">Expected Physics: </span>
              {experiment.expectedInsights}
            </div>

            {experiment.classicalComparison && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs space-y-2">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Beaker className="h-4 w-4" />
                  Quantum vs. Classical Search Baseline (N = {experiment.classicalComparison.searchSpaceSize})
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="rounded bg-[var(--lab-surface)] p-2 border border-[var(--lab-border)]">
                    <div className="text-[10px] text-[var(--lab-muted)]">Classical Unstructured</div>
                    <div className="font-bold text-[var(--lab-text)]">
                      Avg {experiment.classicalComparison.classicalAverageQueries} queries ({experiment.classicalComparison.asymptoticClassical})
                    </div>
                  </div>
                  <div className="rounded bg-[var(--lab-surface)] p-2 border border-cyan-500/30">
                    <div className="text-[10px] text-[var(--lab-muted)]">Grover Quantum Search</div>
                    <div className="font-bold text-cyan-400">
                      {experiment.classicalComparison.quantumQueries} oracle query ({experiment.classicalComparison.asymptoticQuantum})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simulation Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-[var(--lab-border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--lab-text)]">
                Verified Qiskit Simulator Output ({result.simulation_mode.toUpperCase()} mode)
              </h3>
              <span className="text-xs font-mono text-[var(--lab-muted)]">
                Depth {result.circuit_depth} · {(result.execution_time * 1000).toFixed(1)} ms
              </span>
            </div>

            {teleportBobMarginal && (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                <strong>Teleportation Verification on Bob&apos;s Qubit (q2):</strong> Marginal P(q2=0) ={' '}
                <code className="font-mono font-bold">{(teleportBobMarginal.p0 * 100).toFixed(2)}%</code>, P(q2=1) ={' '}
                <code className="font-mono font-bold">{(teleportBobMarginal.p1 * 100).toFixed(2)}%</code> — matching
                Alice&apos;s prepared <code className="font-mono">RY(π/3)|0⟩</code> state (75.0% / 25.0%)!
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <MeasurementHistogram
                measurements={result.measurements}
                probabilities={result.probabilities}
                idealProbabilities={result.metadata?.ideal_probabilities}
                simulationMode={result.simulation_mode}
                theme={theme}
              />
              {result.num_qubits === 1 ? (
                <BlochSphere statevector={result.statevector} numQubits={result.num_qubits} />
              ) : (
                <QSphere statevector={result.statevector} numQubits={result.num_qubits} />
              )}
            </div>

            <StatevectorDisplay statevector={result.statevector} numQubits={result.num_qubits} />
          </div>
        )}

        {/* AI Explanation Panel */}
        {aiResponse && (
          <div className="rounded-xl border border-purple-500/30 bg-[var(--lab-elevated)] p-5 space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--lab-border)] pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Sparkles className="h-4 w-4" />
                Q-ASSIST Explanation ({aiResponse.level} level)
              </div>
              <span
                className={`sci-badge ${
                  aiResponse.is_ai_generated
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {aiResponse.is_ai_generated ? 'AI Generated' : 'Educational Fallback'}
              </span>
            </div>
            <MarkdownRenderer content={aiResponse.explanation} />
          </div>
        )}
      </div>

      <SaveExperimentModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        circuit={experiment.circuit}
        simConfig={{ simulation_mode: simMode, num_shots: 1024 }}
        simulationResult={result}
        defaultName={experiment.title}
        defaultDescription={experiment.subtitle}
      />
    </div>
  );
}
