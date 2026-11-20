import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { GATE_CATEGORIES, GATE_LIST } from '../../data/gates';

export default function GatePalette({ numQubits = 2, onAddGate, compact = false }) {
  const [hoveredGate, setHoveredGate] = useState(null);

  const handleDragStart = (e, gate) => {
    e.dataTransfer.setData(
      'application/quantum-gate',
      JSON.stringify({ kind: 'new', gate_name: gate.gate_name })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-3">
      {GATE_CATEGORIES.map((cat) => {
        const gatesInCat = GATE_LIST.filter((g) => g.category === cat.id);
        return (
          <div key={cat.id}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lab-muted)] mb-1.5">
              {cat.label}
            </div>
            <div className={`grid gap-1.5 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-2'}`}>
              {gatesInCat.map((g) => {
                const disabled = g.num_qubits > numQubits;
                return (
                  <button
                    key={g.gate_name}
                    type="button"
                    draggable={!disabled}
                    disabled={disabled}
                    onDragStart={(e) => handleDragStart(e, g)}
                    onClick={() => onAddGate?.(g.gate_name)}
                    onMouseEnter={() => setHoveredGate(g)}
                    onFocus={() => setHoveredGate(g)}
                    title={
                      disabled
                        ? `Requires at least ${g.num_qubits} qubits`
                        : `${g.name}: ${g.description}`
                    }
                    className={`group flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-2 text-left transition ${
                      disabled
                        ? 'opacity-40 cursor-not-allowed border-[var(--lab-border)] bg-[var(--lab-elevated)]'
                        : 'cursor-grab active:cursor-grabbing border-[var(--lab-border)] bg-[var(--lab-elevated)] hover:border-cyan-400/60 hover:bg-cyan-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold font-mono shadow-sm"
                        style={{
                          backgroundColor: g.color,
                          color: g.gate_name === 'H' ? '#0f172a' : '#ffffff',
                        }}
                      >
                        {g.gate_name}
                      </span>
                      <span className="text-xs font-medium text-[var(--lab-text)] truncate">
                        {g.symbol}
                      </span>
                    </div>
                    {g.num_qubits > 1 && (
                      <span className="text-[10px] font-mono text-[var(--lab-muted)] shrink-0">
                        {g.num_qubits}Q
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Gate Quick Info Card */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2.5 text-xs">
        {hoveredGate ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-400">
                {hoveredGate.name} ({hoveredGate.symbol})
              </span>
              <span className="font-mono text-[10px] text-[var(--lab-muted)]">
                {hoveredGate.num_qubits}Q
              </span>
            </div>
            <p className="text-[11px] text-[var(--lab-muted)] leading-snug">
              {hoveredGate.description}
            </p>
            <div className="font-mono text-[10px] text-cyan-300 pt-0.5">
              {hoveredGate.operation}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-[var(--lab-muted)]">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>Click or drag any gate onto a qubit wire. Hover a gate to inspect its math.</span>
          </div>
        )}
      </div>
    </div>
  );
}
