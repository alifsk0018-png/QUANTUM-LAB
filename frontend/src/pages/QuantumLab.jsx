import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  Sliders,
} from 'lucide-react';
import { useQuantum } from '../context/QuantumContext';
import { useTheme } from '../context/ThemeContext';
import { createDefaultGate, GATE_LIST } from '../data/gates';
import GatePalette from '../components/circuit/GatePalette';
import CircuitCanvas from '../components/circuit/CircuitCanvas';
import GateInspector from '../components/circuit/GateInspector';
import SimulationControls from '../components/quantum/SimulationControls';
import CircuitDiagram from '../components/visualizations/CircuitDiagram';
import MeasurementHistogram from '../components/visualizations/MeasurementHistogram';
import StatevectorDisplay from '../components/visualizations/StatevectorDisplay';
import BlochSphere from '../components/visualizations/BlochSphere';
import QSphere from '../components/visualizations/QSphere';
import SaveExperimentModal from '../components/ui/SaveExperimentModal';

const RESULT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'histogram', label: 'Measurement Histogram' },
  { id: 'statevector', label: 'Statevector' },
  { id: 'bloch', label: 'Bloch Sphere' },
  { id: 'qsphere', label: 'Q-Sphere' },
];

export default function QuantumLab() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    circuit,
    serializedCircuit,
    setNumQubits,
    toggleInitialBit,
    setInitialState,
    addGate,
    updateGate,
    removeGate,
    moveGate,
    resetCircuit,
    simConfig,
    setSimConfig,
    simulationResult,
    isSimulating,
    executeSimulation,
    validationResult,
    backendHealth,
  } = useQuantum();

  const [selectedGateIndex, setSelectedGateIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saveOpen, setSaveOpen] = useState(false);

  const handleQuickAddGate = (gateName) => {
    const newGate = createDefaultGate(gateName, 0, circuit.num_qubits);
    if (!newGate) return;
    const nextIdx = circuit.gates.length;
    addGate(newGate);
    setSelectedGateIndex(nextIdx);
  };

  const handleRemoveGate = (idx) => {
    removeGate(idx);
    if (selectedGateIndex === idx) setSelectedGateIndex(null);
    else if (selectedGateIndex > idx) setSelectedGateIndex(selectedGateIndex - 1);
  };

  const selectedGate =
    selectedGateIndex !== null && circuit.gates[selectedGateIndex]
      ? circuit.gates[selectedGateIndex]
      : null;

  return (
    <div className="space-y-5">
      {/* Page Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            Quantum Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Initialize qubits, apply unitary gates, and run real Qiskit statevector or noisy simulations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => executeSimulation()}
            disabled={isSimulating || !validationResult?.valid}
            className="sci-btn-primary"
          >
            <Play className="h-4 w-4" />
            {isSimulating ? 'Simulating...' : 'Execute Circuit'}
          </button>
          <button
            type="button"
            onClick={() => {
              resetCircuit(true);
              setSelectedGateIndex(null);
            }}
            className="sci-btn-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            className="sci-btn-secondary"
          >
            <Save className="h-4 w-4 text-cyan-400" />
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate('/tutor')}
            className="sci-btn-secondary"
          >
            <Bot className="h-4 w-4 text-purple-400" />
            Ask Q-ASSIST
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationResult && !validationResult.valid && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-semibold">Circuit Validation Error</div>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Top Configuration + Gate Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Qubit Register + Gate Palette */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sci-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Qubit Register Setup
              </span>
              <span className="text-xs font-mono text-[var(--lab-muted)]">
                Hilbert Dim: 2^{circuit.num_qubits} = {1 << circuit.num_qubits}
              </span>
            </div>

            <div>
              <label htmlFor="lab-num-qubits" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1.5">
                Number of Qubits (1 – 8)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setNumQubits(n);
                      setSelectedGateIndex(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                      circuit.num_qubits === n
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                        : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[var(--lab-muted)]">
                  Computational Basis Initialization
                </span>
                <button
                  type="button"
                  onClick={() => setInitialState('0'.repeat(circuit.num_qubits))}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Reset to |{'0'.repeat(circuit.num_qubits)}⟩
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: circuit.num_qubits }, (_, q) => {
                  const bit = (circuit.initial_state || '')[q] === '1' ? '1' : '0';
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => toggleInitialBit(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition ${
                        bit === '1'
                          ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                          : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-text)]'
                      }`}
                    >
                      q{q}: |{bit}⟩
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sci-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Quantum Gate Library
              </span>
              <span className="text-[11px] font-mono text-[var(--lab-muted)]">
                {GATE_LIST.length} Gates
              </span>
            </div>
            <GatePalette
              numQubits={circuit.num_qubits}
              onAddGate={handleQuickAddGate}
            />
          </div>
        </div>

        {/* Right: Circuit Workspace, Inspector, Simulation Controls */}
        <div className="lg:col-span-8 space-y-4">
          <CircuitCanvas
            circuit={circuit}
            selectedGateIndex={selectedGateIndex}
            onSelectGate={setSelectedGateIndex}
            onToggleInitialBit={toggleInitialBit}
            onAddGate={(gateObj, idx) => addGate(gateObj, idx)}
            onMoveGate={moveGate}
            onRemoveGate={handleRemoveGate}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GateInspector
              gate={selectedGate}
              gateIndex={selectedGateIndex}
              numQubits={circuit.num_qubits}
              onUpdateGate={updateGate}
              onRemoveGate={handleRemoveGate}
            />

            <SimulationControls
              simConfig={simConfig}
              onChange={setSimConfig}
              aerAvailable={backendHealth?.aer_available !== false}
            />
          </div>

          {/* Live Validation + Telemetry Strip */}
          <div className="sci-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {validationResult?.valid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
              <span className="font-medium text-[var(--lab-text)]">
                {validationResult?.valid ? 'Circuit Validated' : 'Invalid Configuration'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 font-mono text-[var(--lab-muted)]">
              <span>Qubits: {circuit.num_qubits}</span>
              <span>Gates: {circuit.gates.length}</span>
              {simulationResult && (
                <>
                  <span>Depth: {simulationResult.circuit_depth}</span>
                  <span>Exec: {(simulationResult.execution_time * 1000).toFixed(1)} ms</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Output & Scientific Visualizations */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <h2 className="text-base font-bold text-[var(--lab-text)]">
              Quantum State &amp; Measurement Results
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RESULT_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === t.id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-[var(--lab-surface)] border border-[var(--lab-border)] text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {!simulationResult ? (
          <div className="sci-card p-8 text-center">
            <p className="text-sm font-semibold text-[var(--lab-text)]">
              Ready to Simulate on Qiskit
            </p>
            <p className="text-xs text-[var(--lab-muted)] mt-1 mb-4 max-w-md mx-auto">
              Click <strong>Execute Circuit</strong> above to compute genuine statevector amplitudes,
              measurement probabilities, and shot counts.
            </p>
            <button
              type="button"
              onClick={() => executeSimulation()}
              disabled={isSimulating || !validationResult?.valid}
              className="sci-btn-primary text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              {isSimulating ? 'Simulating...' : 'Run Simulation Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <CircuitDiagram
                  gates={serializedCircuit.gates}
                  num_qubits={serializedCircuit.num_qubits}
                  initial_state={serializedCircuit.initial_state}
                />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <MeasurementHistogram
                    measurements={simulationResult.measurements}
                    probabilities={simulationResult.probabilities}
                    idealProbabilities={simulationResult.metadata?.ideal_probabilities}
                    simulationMode={simulationResult.simulation_mode}
                    theme={theme}
                  />
                  <BlochSphere
                    statevector={simulationResult.statevector}
                    numQubits={simulationResult.num_qubits}
                  />
                </div>
                <StatevectorDisplay
                  statevector={simulationResult.statevector}
                  numQubits={simulationResult.num_qubits}
                />
              </div>
            )}

            {activeTab === 'histogram' && (
              <MeasurementHistogram
                measurements={simulationResult.measurements}
                probabilities={simulationResult.probabilities}
                idealProbabilities={simulationResult.metadata?.ideal_probabilities}
                simulationMode={simulationResult.simulation_mode}
                theme={theme}
                height="440px"
              />
            )}

            {activeTab === 'statevector' && (
              <StatevectorDisplay
                statevector={simulationResult.statevector}
                numQubits={simulationResult.num_qubits}
              />
            )}

            {activeTab === 'bloch' && (
              <BlochSphere
                statevector={simulationResult.statevector}
                numQubits={simulationResult.num_qubits}
                height="460px"
              />
            )}

            {activeTab === 'qsphere' && (
              <QSphere
                statevector={simulationResult.statevector}
                numQubits={simulationResult.num_qubits}
                height="480px"
              />
            )}
          </div>
        )}
      </section>

      <SaveExperimentModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        circuit={serializedCircuit}
        simConfig={simConfig}
        simulationResult={simulationResult}
      />
    </div>
  );
}
