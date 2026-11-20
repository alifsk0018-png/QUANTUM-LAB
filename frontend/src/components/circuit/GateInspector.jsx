import React from 'react';
import { Trash2, Sliders } from 'lucide-react';
import { GATE_CATALOG } from '../../data/gates';

const ANGLE_PRESETS = [
  { label: '-π', value: -Math.PI },
  { label: '-π/2', value: -Math.PI / 2 },
  { label: 'π/4', value: Math.PI / 4 },
  { label: 'π/3', value: Math.PI / 3 },
  { label: 'π/2', value: Math.PI / 2 },
  { label: 'π', value: Math.PI },
];

export default function GateInspector({
  gate,
  gateIndex,
  numQubits,
  onUpdateGate,
  onRemoveGate,
}) {
  if (!gate || gateIndex === null || gateIndex === undefined) {
    return (
      <div className="sci-card p-4 text-xs text-[var(--lab-muted)] flex items-center gap-2.5">
        <Sliders className="h-4 w-4 text-cyan-400 shrink-0" />
        <span>Select any gate on the circuit canvas to inspect its unitary matrix and edit qubits or angles.</span>
      </div>
    );
  }

  const name = (gate.gate_name || '').toUpperCase();
  const meta = GATE_CATALOG[name] || {};
  const qubitOptions = Array.from({ length: numQubits }, (_, i) => i);
  const targets = gate.target_qubits || [0];
  const controls = gate.control_qubits || [];
  const angle = Number(gate.parameters?.angle ?? Math.PI / 2);

  const handleTargetChange = (slotIdx, newQ) => {
    const nextTargets = [...targets];
    nextTargets[slotIdx] = Number(newQ);
    onUpdateGate?.(gateIndex, { target_qubits: nextTargets });
  };

  const handleControlChange = (slotIdx, newQ) => {
    const nextControls = [...controls];
    nextControls[slotIdx] = Number(newQ);
    onUpdateGate?.(gateIndex, { control_qubits: nextControls });
  };

  const handleAngleChange = (newAngle) => {
    const val = Number(newAngle);
    if (!Number.isFinite(val)) return;
    onUpdateGate?.(gateIndex, { parameters: { ...gate.parameters, angle: val } });
  };

  return (
    <div className="sci-card p-4 space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg font-mono font-bold text-xs shadow"
            style={{
              backgroundColor: meta.color || '#334155',
              color: name === 'H' ? '#0f172a' : '#ffffff',
            }}
          >
            {name}
          </span>
          <div>
            <h3 className="text-sm font-bold text-[var(--lab-text)]">
              Step {gateIndex + 1}: {meta.name || name}
            </h3>
            <p className="text-[11px] font-mono text-cyan-400">{meta.operation}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemoveGate?.(gateIndex)}
          className="sci-btn-danger px-2.5 py-1 text-xs"
          title="Delete this gate"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <p className="text-xs text-[var(--lab-muted)] leading-relaxed">{meta.description}</p>

      <div className="rounded-lg bg-[var(--lab-elevated)] border border-[var(--lab-border)] px-3 py-2 text-[11px] font-mono text-[var(--lab-text)]">
        <span className="text-[var(--lab-muted)] mr-1.5">Unitary U =</span>
        {meta.matrixText}
      </div>

      {/* Qubit assignments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {controls.map((cQ, idx) => (
          <div key={`c-${idx}`}>
            <label className="block text-[11px] font-semibold text-[var(--lab-muted)] mb-1">
              Control Qubit {controls.length > 1 ? idx + 1 : ''}
            </label>
            <select
              value={cQ}
              onChange={(e) => handleControlChange(idx, e.target.value)}
              className="sci-input py-1.5 text-xs font-mono"
            >
              {qubitOptions.map((q) => {
                const usedElsewhere =
                  targets.includes(q) || controls.some((other, i) => i !== idx && other === q);
                return (
                  <option key={q} value={q} disabled={usedElsewhere}>
                    q{q} {usedElsewhere ? '(in use)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        ))}

        {targets.map((tQ, idx) => (
          <div key={`t-${idx}`}>
            <label className="block text-[11px] font-semibold text-[var(--lab-muted)] mb-1">
              Target Qubit {targets.length > 1 ? idx + 1 : ''}
            </label>
            <select
              value={tQ}
              onChange={(e) => handleTargetChange(idx, e.target.value)}
              className="sci-input py-1.5 text-xs font-mono"
            >
              {qubitOptions.map((q) => {
                const usedElsewhere =
                  controls.includes(q) || targets.some((other, i) => i !== idx && other === q);
                return (
                  <option key={q} value={q} disabled={usedElsewhere}>
                    q{q} {usedElsewhere ? '(in use)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        ))}
      </div>

      {/* Parametric rotation angle editor */}
      {meta.has_parameters && (
        <div className="space-y-2 pt-1 border-t border-[var(--lab-border)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--lab-muted)]">Rotation Angle θ (rad)</span>
            <span className="font-mono text-cyan-400">
              {angle.toFixed(4)} rad ({((angle * 180) / Math.PI).toFixed(1)}°)
            </span>
          </div>

          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={angle}
            onChange={(e) => handleAngleChange(e.target.value)}
            className="w-full accent-cyan-400"
            aria-label="Rotation angle in radians"
          />

          <div className="flex flex-wrap gap-1.5">
            {ANGLE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleAngleChange(p.value)}
                className="px-2 py-0.5 rounded border border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[11px] font-mono text-[var(--lab-text)] hover:border-cyan-400/60 hover:text-cyan-400 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
