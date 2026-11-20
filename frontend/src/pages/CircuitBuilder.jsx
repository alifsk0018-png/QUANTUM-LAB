import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Download,
  Eye,
  Play,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuantum } from '../context/QuantumContext';
import { createDefaultGate } from '../data/gates';
import GatePalette from '../components/circuit/GatePalette';
import CircuitCanvas from '../components/circuit/CircuitCanvas';
import GateInspector from '../components/circuit/GateInspector';
import SimulationControls from '../components/quantum/SimulationControls';
import CircuitDiagram from '../components/visualizations/CircuitDiagram';
import SaveExperimentModal from '../components/ui/SaveExperimentModal';

function toOpenQASM(circuit) {
  const n = circuit?.num_qubits || 1;
  const lines = ['OPENQASM 2.0;', 'include "qelib1.inc";', `qreg q[${n}];`, `creg c[${n}];`, ''];
  const init = circuit?.initial_state || '';
  for (let q = 0; q < n; q++) {
    if (init[q] === '1') lines.push(`x q[${q}];`);
  }
  for (const g of circuit?.gates || []) {
    const name = (g.gate_name || '').toLowerCase();
    const t = g.target_qubits || [];
    const c = g.control_qubits || [];
    if (name === 'rx' || name === 'ry' || name === 'rz') {
      const angle = Number(g.parameters?.angle ?? 0).toFixed(6);
      lines.push(`${name}(${angle}) q[${t[0]}];`);
    } else if (name === 'cx' || name === 'cz') {
      lines.push(`${name} q[${c[0]}],q[${t[0]}];`);
    } else if (name === 'swap') {
      lines.push(`swap q[${t[0]}],q[${t[1]}];`);
    } else if (name === 'ccx') {
      lines.push(`ccx q[${c[0]}],q[${c[1]}],q[${t[0]}];`);
    } else {
      lines.push(`${name === 'i' ? 'id' : name} q[${t[0]}];`);
    }
  }
  lines.push('', `measure q -> c;`);
  return lines.join('\n');
}

export default function CircuitBuilder() {
  const navigate = useNavigate();
  const {
    circuit,
    serializedCircuit,
    setNumQubits,
    toggleInitialBit,
    addGate,
    updateGate,
    removeGate,
    moveGate,
    resetCircuit,
    undo,
    redo,
    canUndo,
    canRedo,
    simConfig,
    setSimConfig,
    simulationResult,
    isSimulating,
    executeSimulation,
    validationResult,
    backendHealth,
  } = useQuantum();

  const [selectedGateIndex, setSelectedGateIndex] = useState(null);
  const [centerMode, setCenterMode] = useState('interactive'); // 'interactive' | 'diagram' | 'json' | 'qasm'
  const [saveOpen, setSaveOpen] = useState(false);

  const qasmPreview = useMemo(() => toOpenQASM(serializedCircuit), [serializedCircuit]);

  const handleAddFromPalette = (gateName) => {
    const g = createDefaultGate(gateName, 0, circuit.num_qubits);
    if (!g) return;
    const nextIdx = circuit.gates.length;
    addGate(g);
    setSelectedGateIndex(nextIdx);
  };

  const handleRemove = (idx) => {
    removeGate(idx);
    if (selectedGateIndex === idx) setSelectedGateIndex(null);
    else if (selectedGateIndex > idx) setSelectedGateIndex(selectedGateIndex - 1);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(serializedCircuit, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-circuit-${serializedCircuit.num_qubits}q.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported circuit JSON');
  };

  const selectedGate =
    selectedGateIndex !== null && circuit.gates[selectedGateIndex]
      ? circuit.gates[selectedGateIndex]
      : null;

  const topOutcome = useMemo(() => {
    if (!simulationResult?.probabilities) return null;
    const entries = Object.entries(simulationResult.probabilities);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }, [simulationResult]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            Visual Quantum Circuit Builder
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Drag and drop quantum gates onto qubit wires, inspect structured JSON payloads, and run Qiskit simulations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] p-1">
          {[
            { id: 'interactive', label: 'Drag & Drop Canvas' },
            { id: 'diagram', label: 'SVG Diagram' },
            { id: 'json', label: 'Circuit JSON' },
            { id: 'qasm', label: 'OpenQASM' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCenterMode(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                centerMode === tab.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Panel Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANEL: Available Quantum Gates & Qubit Initialization */}
        <div className="lg:col-span-3 sci-card p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Qubit Initialization
              </span>
              <span className="text-xs font-mono text-[var(--lab-muted)]">
                {circuit.num_qubits}Q
              </span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setNumQubits(n);
                    setSelectedGateIndex(null);
                  }}
                  className={`flex-1 py-1 rounded text-[11px] font-mono font-bold border transition ${
                    circuit.num_qubits === n
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                      : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: circuit.num_qubits }, (_, q) => {
                const bit = (circuit.initial_state || '')[q] === '1' ? '1' : '0';
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleInitialBit(q)}
                    className="px-2 py-0.5 rounded border border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[11px] font-mono text-[var(--lab-text)] hover:border-cyan-400"
                  >
                    q{q}=|{bit}⟩
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--lab-border)]">
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
              Gate Palette
            </div>
            <GatePalette
              numQubits={circuit.num_qubits}
              onAddGate={handleAddFromPalette}
              compact
            />
          </div>
        </div>

        {/* CENTER WORKSPACE */}
        <div className="lg:col-span-6 space-y-4">
          {centerMode === 'interactive' && (
            <CircuitCanvas
              circuit={circuit}
              selectedGateIndex={selectedGateIndex}
              onSelectGate={setSelectedGateIndex}
              onToggleInitialBit={toggleInitialBit}
              onAddGate={(g, idx) => addGate(g, idx)}
              onMoveGate={moveGate}
              onRemoveGate={handleRemove}
            />
          )}

          {centerMode === 'diagram' && (
            <CircuitDiagram
              gates={serializedCircuit.gates}
              num_qubits={serializedCircuit.num_qubits}
              initial_state={serializedCircuit.initial_state}
            />
          )}

          {centerMode === 'json' && (
            <div className="sci-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                <Code2 className="h-4 w-4" />
                Structured Circuit JSON Payload
              </div>
              <pre className="rounded-lg bg-slate-950 p-3.5 text-xs font-mono text-cyan-200 overflow-x-auto max-h-[380px]">
                {JSON.stringify(serializedCircuit, null, 2)}
              </pre>
            </div>
          )}

          {centerMode === 'qasm' && (
            <div className="sci-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                <Code2 className="h-4 w-4" />
                Generated OpenQASM 2.0 Preview (Read-Only)
              </div>
              <pre className="rounded-lg bg-slate-950 p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px]">
                {qasmPreview}
              </pre>
            </div>
          )}

          <GateInspector
            gate={selectedGate}
            gateIndex={selectedGateIndex}
            numQubits={circuit.num_qubits}
            onUpdateGate={updateGate}
            onRemoveGate={handleRemove}
          />
        </div>

        {/* RIGHT PANEL: Properties & Simulation Settings */}
        <div className="lg:col-span-3 space-y-4">
          <div className="sci-card p-4 space-y-2.5 text-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Circuit Properties
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
                <div className="text-[10px] text-[var(--lab-muted)]">Qubits</div>
                <div className="text-base font-bold text-[var(--lab-text)]">{circuit.num_qubits}</div>
              </div>
              <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
                <div className="text-[10px] text-[var(--lab-muted)]">Gate Count</div>
                <div className="text-base font-bold text-[var(--lab-text)]">{circuit.gates.length}</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--lab-muted)]">Validation</span>
              <span
                className={`font-semibold ${
                  validationResult?.valid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {validationResult?.valid ? 'Valid Circuit' : 'Errors Detected'}
              </span>
            </div>
          </div>

          <SimulationControls
            simConfig={simConfig}
            onChange={setSimConfig}
            aerAvailable={backendHealth?.aer_available !== false}
          />

          {simulationResult && (
            <div className="sci-card p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-400 uppercase tracking-wider">
                  Latest Simulation
                </span>
                <span className="font-mono text-[11px] text-[var(--lab-muted)]">
                  {(simulationResult.execution_time * 1000).toFixed(1)} ms
                </span>
              </div>
              {topOutcome && (
                <div className="rounded-lg bg-[var(--lab-elevated)] border border-[var(--lab-border)] p-2.5 font-mono">
                  <div className="text-[11px] text-[var(--lab-muted)]">Most Probable State</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">
                    |{topOutcome[0]}⟩ ({(topOutcome[1] * 100).toFixed(2)}%)
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate('/visualizer')}
                className="sci-btn-secondary w-full text-xs"
              >
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                Open Full Visualizations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="sci-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="sci-btn-secondary text-xs"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="sci-btn-secondary text-xs"
          >
            <Redo2 className="h-3.5 w-3.5" />
            Redo
          </button>
          <button
            type="button"
            onClick={() => {
              resetCircuit(true);
              setSelectedGateIndex(null);
            }}
            className="sci-btn-secondary text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleExportJson} className="sci-btn-secondary text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Circuit
          </button>
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            className="sci-btn-secondary text-xs"
          >
            <Save className="h-3.5 w-3.5 text-cyan-400" />
            Save Experiment
          </button>
          <button
            type="button"
            disabled={isSimulating || !validationResult?.valid}
            onClick={() => executeSimulation()}
            className="sci-btn-primary text-xs"
          >
            <Play className="h-3.5 w-3.5" />
            {isSimulating ? 'Running...' : 'Run Circuit'}
          </button>
        </div>
      </div>

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
