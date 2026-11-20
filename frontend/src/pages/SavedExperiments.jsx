import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Edit3,
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  FolderArchive,
  Orbit,
  Search,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import useExperiments from '../hooks/useExperiments';
import { useQuantum } from '../context/QuantumContext';
import Modal from '../components/ui/Modal';
import { exportExperimentCsv, exportExperimentJson } from './ResearchWorkspace';

export default function SavedExperiments() {
  const navigate = useNavigate();
  const { loadCircuit, setSimulationResult } = useQuantum();
  const { experiments, loading, editExperiment, removeExperiment } = useExperiments(true);

  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiments.filter((e) => {
      if (modeFilter !== 'all' && e.simulation_mode !== modeFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q)
      );
    });
  }, [experiments, query, modeFilter]);

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setEditName(exp.name);
    setEditNotes(exp.notes || '');
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    await editExperiment(id, { name: editName.trim(), notes: editNotes });
    setEditingId(null);
  };

  const handleOpenIn = (exp, path) => {
    if (exp.circuit_config) {
      loadCircuit(exp.circuit_config, false);
    }
    setSimulationResult(exp.results || null);
    navigate(path);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            Saved Experiments
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Browse, rename, annotate, export, delete, or reopen circuits stored in your persistent SQLite workspace.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sci-card p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lab-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter saved experiments by name, description, or notes..."
            className="sci-input pl-9 py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'ideal', 'noisy'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition ${
                modeFilter === m
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                  : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="sci-card p-8 text-center text-sm text-[var(--lab-muted)]">
          Loading saved experiments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="sci-card p-10 text-center space-y-2">
          <FolderArchive className="h-10 w-10 text-cyan-400 mx-auto" />
          <h2 className="text-base font-bold text-[var(--lab-text)]">
            {experiments.length === 0 ? 'No saved experiments yet' : 'No matching experiments'}
          </h2>
          <p className="text-xs text-[var(--lab-muted)] max-w-md mx-auto">
            Design a circuit in the Quantum Laboratory or Circuit Builder and click Save Experiment to store it permanently.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => {
            const isEditing = editingId === exp.id;
            return (
              <div key={exp.id} className="sci-card p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2 max-w-xl">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="sci-input text-sm font-bold"
                          aria-label="Edit experiment name"
                        />
                        <textarea
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Experiment notes..."
                          className="sci-input text-xs"
                          aria-label="Edit experiment notes"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(exp.id)}
                            className="sci-btn-primary px-3 py-1 text-xs"
                          >
                            <Check className="h-3.5 w-3.5" /> Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="sci-btn-secondary px-3 py-1 text-xs"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-[var(--lab-text)]">{exp.name}</h3>
                          <span
                            className={`sci-badge ${
                              exp.simulation_mode === 'noisy'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-cyan-500/15 text-cyan-400'
                            }`}
                          >
                            {exp.simulation_mode}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-[var(--lab-muted)] mt-0.5">
                            {exp.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-[var(--lab-muted)] mt-1.5">
                          <span>{exp.num_qubits} Qubits</span>
                          <span>{exp.gate_count} Gates</span>
                          <span>{exp.num_shots} Shots</span>
                          <span>Saved {new Date(exp.created_at).toLocaleString()}</span>
                        </div>
                        {exp.notes && (
                          <p className="mt-2 rounded-lg bg-[var(--lab-elevated)] border border-[var(--lab-border)] px-3 py-2 text-xs text-[var(--lab-text)]">
                            {exp.notes}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenIn(exp, '/laboratory')}
                        className="sci-btn-primary px-2.5 py-1.5 text-xs"
                      >
                        <FlaskConical className="h-3.5 w-3.5" /> Lab
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenIn(exp, '/circuit-builder')}
                        className="sci-btn-secondary px-2.5 py-1.5 text-xs"
                      >
                        <Workflow className="h-3.5 w-3.5 text-cyan-400" /> Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenIn(exp, '/visualizer')}
                        className="sci-btn-secondary px-2.5 py-1.5 text-xs"
                      >
                        <Orbit className="h-3.5 w-3.5 text-purple-400" /> Visualize
                      </button>
                      <button
                        type="button"
                        onClick={() => exportExperimentJson(exp)}
                        className="sci-btn-secondary px-2.5 py-1.5 text-xs"
                        title="Export JSON"
                      >
                        <FileJson className="h-3.5 w-3.5" />
                      </button>
                      {exp.results && (
                        <button
                          type="button"
                          onClick={() => exportExperimentCsv(exp)}
                          className="sci-btn-secondary px-2.5 py-1.5 text-xs"
                          title="Export CSV"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(exp)}
                        className="sci-btn-secondary px-2.5 py-1.5 text-xs"
                        title="Rename or edit notes"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(exp)}
                        className="sci-btn-danger px-2.5 py-1.5 text-xs"
                        title="Delete experiment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Saved Experiment"
        subtitle="This action permanently removes the experiment from SQLite storage."
      >
        <div className="space-y-4 text-sm">
          <p className="text-[var(--lab-text)]">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="sci-btn-secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="sci-btn-danger"
              onClick={async () => {
                await removeExperiment(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
