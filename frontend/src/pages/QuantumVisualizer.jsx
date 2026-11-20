import React from 'react';
import { Link } from 'react-router-dom';
import { Orbit, Play, Workflow } from 'lucide-react';
import { useQuantum } from '../context/QuantumContext';
import { useTheme } from '../context/ThemeContext';
import { PRESET_EXPERIMENTS } from '../data/experiments';
import CircuitDiagram from '../components/visualizations/CircuitDiagram';
import BlochSphere from '../components/visualizations/BlochSphere';
import QSphere from '../components/visualizations/QSphere';
import MeasurementHistogram from '../components/visualizations/MeasurementHistogram';
import StatevectorDisplay from '../components/visualizations/StatevectorDisplay';

export default function QuantumVisualizer() {
  const { theme } = useTheme();
  const {
    serializedCircuit,
    simulationResult,
    setSimulationResult,
    isSimulating,
    executeSimulation,
    loadCircuit,
    simConfig,
  } = useQuantum();

  const handleLoadAndRun = async (preset) => {
    loadCircuit(preset.circuit, true);
    const res = await executeSimulation(preset.circuit, simConfig);
    if (res) {
      setSimulationResult(res);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            Quantum Visualization Engine
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Interactive 3D Bloch Sphere, multi-qubit Q-Sphere, circuit diagram, measurement histogram, and complex statevector viewer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => executeSimulation()}
            disabled={isSimulating}
            className="sci-btn-primary text-xs"
          >
            <Play className="h-4 w-4" />
            {isSimulating ? 'Simulating...' : 'Simulate Active Circuit'}
          </button>
          <Link to="/circuit-builder" className="sci-btn-secondary text-xs">
            <Workflow className="h-4 w-4 text-cyan-400" />
            Edit Circuit
          </Link>
        </div>
      </div>

      {/* Quick state loaders */}
      <div className="sci-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[var(--lab-muted)]">
          Active Circuit:{' '}
          <span className="font-mono font-semibold text-cyan-400">
            {serializedCircuit.num_qubits}Q · {serializedCircuit.gates.length} gates
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--lab-muted)] mr-1">Quick Load:</span>
          {PRESET_EXPERIMENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleLoadAndRun(p)}
              className="px-2.5 py-1 rounded-md border border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[11px] font-medium hover:border-cyan-400 hover:text-cyan-400 transition"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Always show circuit diagram */}
      <CircuitDiagram
        gates={serializedCircuit.gates}
        num_qubits={serializedCircuit.num_qubits}
        initial_state={serializedCircuit.initial_state}
      />

      {!simulationResult ? (
        <div className="sci-card p-10 text-center space-y-3">
          <Orbit className="h-10 w-10 text-cyan-400 mx-auto" />
          <h2 className="text-base font-bold text-[var(--lab-text)]">
            Awaiting Verified Simulator Data
          </h2>
          <p className="text-xs text-[var(--lab-muted)] max-w-md mx-auto">
            All Quantum Visualizer charts use genuine Qiskit simulator outputs. Run your active circuit to populate the 3D Bloch Sphere, Q-Sphere, Histogram, and Statevector table.
          </p>
          <button
            type="button"
            onClick={() => executeSimulation()}
            disabled={isSimulating}
            className="sci-btn-primary text-xs"
          >
            <Play className="h-4 w-4" />
            {isSimulating ? 'Simulating...' : 'Run Simulation Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <BlochSphere
              statevector={simulationResult.statevector}
              numQubits={simulationResult.num_qubits}
              height="400px"
            />
            <QSphere
              statevector={simulationResult.statevector}
              numQubits={simulationResult.num_qubits}
              height="420px"
            />
          </div>

          <MeasurementHistogram
            measurements={simulationResult.measurements}
            probabilities={simulationResult.probabilities}
            idealProbabilities={simulationResult.metadata?.ideal_probabilities}
            simulationMode={simulationResult.simulation_mode}
            theme={theme}
            height="380px"
          />

          <StatevectorDisplay
            statevector={simulationResult.statevector}
            numQubits={simulationResult.num_qubits}
          />
        </div>
      )}
    </div>
  );
}
