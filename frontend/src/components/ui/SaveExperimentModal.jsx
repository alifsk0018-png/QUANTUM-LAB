import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { createExperiment, extractApiError } from '../../services/api';

export default function SaveExperimentModal({
  isOpen,
  onClose,
  circuit,
  simConfig,
  simulationResult,
  defaultName = '',
  defaultDescription = '',
  onSaved,
}) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName || `Quantum Experiment (${circuit?.num_qubits || 2}Q)`);
      setDescription(defaultDescription || '');
      setNotes('');
    }
  }, [isOpen, defaultName, defaultDescription, circuit?.num_qubits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an experiment name.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        circuit_config: circuit,
        num_qubits: circuit.num_qubits,
        simulation_mode: simConfig?.simulation_mode || 'ideal',
        num_shots: Number(simConfig?.num_shots || 1024),
        results: simulationResult || null,
        notes: notes.trim(),
      };
      const saved = await createExperiment(payload);
      toast.success(`Saved "${saved.name}" to SQLite workspace`);
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to save experiment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Quantum Experiment"
      subtitle="Persist circuit configuration, simulation settings, and verified Qiskit output."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="exp-name" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1.5">
            Experiment Name *
          </label>
          <input
            id="exp-name"
            type="text"
            className="sci-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bell State Entanglement Run"
            required
          />
        </div>

        <div>
          <label htmlFor="exp-desc" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1.5">
            Description
          </label>
          <input
            id="exp-desc"
            type="text"
            className="sci-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief objective or circuit summary"
          />
        </div>

        <div>
          <label htmlFor="exp-notes" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1.5">
            Research Notes
          </label>
          <textarea
            id="exp-notes"
            rows={3}
            className="sci-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations, hypothesis, or noise comparisons..."
          />
        </div>

        <div className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] px-3 py-2.5 text-xs font-mono text-[var(--lab-muted)] flex flex-wrap gap-3">
          <span>Qubits: {circuit?.num_qubits}</span>
          <span>Gates: {circuit?.gates?.length || 0}</span>
          <span>Mode: {simConfig?.simulation_mode || 'ideal'}</span>
          <span>Results: {simulationResult ? 'Attached' : 'Not yet run'}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="sci-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="sci-btn-primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Experiment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
