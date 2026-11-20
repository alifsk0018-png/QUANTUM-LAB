import React, { useEffect, useMemo, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import {
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  GitCompare,
  Play,
  Printer,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuantum } from '../context/QuantumContext';
import { useTheme } from '../context/ThemeContext';
import useExperiments from '../hooks/useExperiments';
import SimulationControls from '../components/quantum/SimulationControls';
import CircuitDiagram from '../components/visualizations/CircuitDiagram';

const Plot = createPlotlyComponent(Plotly);

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExperimentJson(exp) {
  downloadFile(
    JSON.stringify(exp, null, 2),
    `${(exp.name || 'experiment').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
    'application/json'
  );
}

export function exportExperimentCsv(exp) {
  const probs = exp?.results?.probabilities || {};
  const meas = exp?.results?.measurements || {};
  const keys = Array.from(new Set([...Object.keys(probs), ...Object.keys(meas)])).sort();
  const rows = [['basis_state', 'probability', 'shot_counts']];
  for (const k of keys) {
    rows.push([k, probs[k] ?? 0, meas[k] ?? 0]);
  }
  const csv = rows.map((r) => r.join(',')).join('\n');
  downloadFile(
    csv,
    `${(exp.name || 'experiment').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-measurements.csv`,
    'text/csv'
  );
}

export default function ResearchWorkspace() {
  const { theme } = useTheme();
  const {
    serializedCircuit,
    simConfig,
    setSimConfig,
    executeSimulation,
    backendHealth,
  } = useQuantum();
  const { experiments, saveExperiment, editExperiment, fetchExperiments } = useExperiments(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);

  const [selectedId, setSelectedId] = useState('');
  const [compareIdA, setCompareIdA] = useState('');
  const [compareIdB, setCompareIdB] = useState('');
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    if (experiments.length > 0 && !selectedId) {
      setSelectedId(String(experiments[0].id));
      setCompareIdA(String(experiments[0].id));
      setCompareIdB(String(experiments[Math.min(1, experiments.length - 1)].id));
    }
  }, [experiments, selectedId]);

  const activeRecord = useMemo(
    () => experiments.find((e) => String(e.id) === String(selectedId)) || null,
    [experiments, selectedId]
  );

  useEffect(() => {
    setNotesDraft(activeRecord?.notes || '');
  }, [activeRecord]);

  const handleRunAndSaveResearch = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please specify a research experiment title.');
      return;
    }
    setRunning(true);
    try {
      const simRes = await executeSimulation(serializedCircuit, simConfig);
      const saved = await saveExperiment({
        name: name.trim(),
        description: description.trim(),
        circuit_config: serializedCircuit,
        num_qubits: serializedCircuit.num_qubits,
        simulation_mode: simConfig.simulation_mode || 'ideal',
        num_shots: Number(simConfig.num_shots || 1024),
        results: simRes,
        notes: notes.trim(),
      });
      setSelectedId(String(saved.id));
      setCompareIdA(String(saved.id));
      setName('');
      setDescription('');
      setNotes('');
      await fetchExperiments();
    } finally {
      setRunning(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeRecord) return;
    await editExperiment(activeRecord.id, { notes: notesDraft });
  };

  const expA = experiments.find((e) => String(e.id) === String(compareIdA));
  const expB = experiments.find((e) => String(e.id) === String(compareIdB));

  const comparisonChart = useMemo(() => {
    if (!expA?.results || !expB?.results) return null;
    const pA = expA.results.probabilities || {};
    const pB = expB.results.probabilities || {};
    const states = Array.from(new Set([...Object.keys(pA), ...Object.keys(pB)])).sort();
    let tvd = 0;
    for (const s of states) {
      tvd += Math.abs((pA[s] ?? 0) - (pB[s] ?? 0));
    }
    tvd *= 0.5;
    return {
      states: states.map((s) => `|${s}⟩`),
      valsA: states.map((s) => (pA[s] ?? 0) * 100),
      valsB: states.map((s) => (pB[s] ?? 0) * 100),
      tvd,
    };
  }, [expA, expB]);

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            Quantum Research Workspace
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Create reproducible Qiskit experiments with explicit seeds, compare runs side-by-side, annotate findings, and export JSON / CSV / PDF reports.
          </p>
        </div>

        {activeRecord && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportExperimentJson(activeRecord)}
              className="sci-btn-secondary text-xs"
            >
              <FileJson className="h-3.5 w-3.5 text-cyan-400" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => exportExperimentCsv(activeRecord)}
              disabled={!activeRecord.results}
              className="sci-btn-secondary text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="sci-btn-primary text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Export PDF Report
            </button>
          </div>
        )}
      </div>

      {/* Create Reproducible Research Experiment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
        <form
          onSubmit={handleRunAndSaveResearch}
          className="lg:col-span-7 sci-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <FlaskConical className="h-4 w-4" />
            New Reproducible Research Run (Uses Active Circuit: {serializedCircuit.num_qubits}Q ·{' '}
            {serializedCircuit.gates.length} Gates)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="res-name" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
                Experiment Title *
              </label>
              <input
                id="res-name"
                type="text"
                className="sci-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bell State Noise Sweep p=0.05"
                required
              />
            </div>
            <div>
              <label htmlFor="res-desc" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
                Hypothesis / Description
              </label>
              <input
                id="res-desc"
                type="text"
                className="sci-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Measure state fidelity degradation under depolarizing noise"
              />
            </div>
          </div>

          <div>
            <label htmlFor="res-notes" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
              Initial Research Notes
            </label>
            <textarea
              id="res-notes"
              rows={2}
              className="sci-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document methodology, seed, or expected outcomes..."
            />
          </div>

          <button type="submit" disabled={running} className="sci-btn-primary text-xs">
            <Play className="h-4 w-4" />
            {running ? 'Simulating & Archiving...' : 'Execute & Save Research Experiment'}
          </button>
        </form>

        <div className="lg:col-span-5">
          <SimulationControls
            simConfig={simConfig}
            onChange={setSimConfig}
            aerAvailable={backendHealth?.aer_available !== false}
          />
        </div>
      </div>

      {/* Selected Experiment Report & Reproducibility Manifest */}
      {activeRecord && (
        <div className="sci-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--lab-border)] pb-3">
            <div>
              <div className="text-xs font-mono uppercase text-cyan-400">
                Research Report · Experiment #{activeRecord.id}
              </div>
              <h2 className="text-lg font-bold text-[var(--lab-text)]">{activeRecord.name}</h2>
              {activeRecord.description && (
                <p className="text-xs text-[var(--lab-muted)] mt-0.5">{activeRecord.description}</p>
              )}
            </div>

            <div className="no-print">
              <label htmlFor="active-exp-select" className="sr-only">
                Select experiment for report
              </label>
              <select
                id="active-exp-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="sci-input py-1.5 text-xs"
              >
                {experiments.map((e) => (
                  <option key={e.id} value={e.id}>
                    #{e.id}: {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reproducibility Manifest */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
            <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
              <div className="text-[10px] text-[var(--lab-muted)]">Qubits / Gates</div>
              <div className="font-bold text-[var(--lab-text)]">
                {activeRecord.num_qubits}Q / {activeRecord.gate_count}G
              </div>
            </div>
            <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
              <div className="text-[10px] text-[var(--lab-muted)]">Mode</div>
              <div className="font-bold text-cyan-400 uppercase">{activeRecord.simulation_mode}</div>
            </div>
            <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
              <div className="text-[10px] text-[var(--lab-muted)]">Shots</div>
              <div className="font-bold text-[var(--lab-text)]">{activeRecord.num_shots}</div>
            </div>
            <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
              <div className="text-[10px] text-[var(--lab-muted)]">Random Seed</div>
              <div className="font-bold text-[var(--lab-text)]">
                {activeRecord.results?.metadata?.seed ?? 'Auto'}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
              <div className="text-[10px] text-[var(--lab-muted)]">Simulator</div>
              <div className="font-bold text-[var(--lab-text)] truncate">
                {activeRecord.results?.metadata?.backend || 'Qiskit'}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
              <div className="text-[10px] text-[var(--lab-muted)]">Created</div>
              <div className="font-bold text-[var(--lab-text)]">
                {new Date(activeRecord.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <CircuitDiagram
            gates={activeRecord.circuit_config?.gates || []}
            num_qubits={activeRecord.num_qubits}
            initial_state={activeRecord.circuit_config?.initial_state}
          />

          {/* Notes editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="report-notes" className="text-xs font-semibold text-[var(--lab-muted)]">
                Lab Notebook Observations
              </label>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="sci-btn-secondary px-2.5 py-1 text-xs no-print"
              >
                <Save className="h-3.5 w-3.5 text-cyan-400" />
                Save Notes
              </button>
            </div>
            <textarea
              id="report-notes"
              rows={3}
              className="sci-input text-xs"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Record observations, error metrics, or physical interpretations..."
            />
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      <div className="sci-card p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--lab-text)]">
            <GitCompare className="h-4 w-4 text-cyan-400" />
            Side-by-Side Experiment Comparison
          </div>
          {comparisonChart && (
            <span className="sci-badge bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
              Total Variation Distance: {(comparisonChart.tvd * 100).toFixed(2)}%
            </span>
          )}
        </div>

        {experiments.length < 1 ? (
          <p className="text-xs text-[var(--lab-muted)]">
            Save at least one simulated experiment to compare probability distributions.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--lab-muted)] mb-1">
                  Experiment A (Baseline)
                </label>
                <select
                  value={compareIdA}
                  onChange={(e) => setCompareIdA(e.target.value)}
                  className="sci-input py-1.5 text-xs"
                >
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>
                      #{e.id}: {e.name} ({e.simulation_mode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--lab-muted)] mb-1">
                  Experiment B (Comparison)
                </label>
                <select
                  value={compareIdB}
                  onChange={(e) => setCompareIdB(e.target.value)}
                  className="sci-input py-1.5 text-xs"
                >
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>
                      #{e.id}: {e.name} ({e.simulation_mode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {comparisonChart ? (
              <Plot
                data={[
                  {
                    type: 'bar',
                    name: `${expA.name} (${expA.simulation_mode})`,
                    x: comparisonChart.states,
                    y: comparisonChart.valsA,
                    marker: { color: 'rgba(34, 211, 238, 0.85)' },
                  },
                  {
                    type: 'bar',
                    name: `${expB.name} (${expB.simulation_mode})`,
                    x: comparisonChart.states,
                    y: comparisonChart.valsB,
                    marker: { color: 'rgba(139, 92, 246, 0.85)' },
                  },
                ]}
                layout={{
                  barmode: 'group',
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: isDark ? '#e2e8f0' : '#0f172a', size: 12 },
                  yaxis: { title: 'Probability (%)', gridcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' },
                  xaxis: { title: 'Basis State' },
                  legend: { orientation: 'h', y: 1.15 },
                  margin: { t: 40, b: 48, l: 50, r: 16 },
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler
                style={{ width: '100%', height: '320px' }}
              />
            ) : (
              <p className="text-xs text-[var(--lab-muted)]">
                Both selected experiments need simulation results to plot a comparison chart.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
