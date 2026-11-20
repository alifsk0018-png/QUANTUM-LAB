import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { createDefaultGate, GATE_CATALOG } from '../../data/gates';

const ROW_HEIGHT = 54;
const COL_WIDTH = 72;

export default function CircuitCanvas({
  circuit,
  selectedGateIndex,
  onSelectGate,
  onToggleInitialBit,
  onAddGate,
  onMoveGate,
  onRemoveGate,
}) {
  const [dragOverCell, setDragOverCell] = useState(null);

  const numQubits = circuit?.num_qubits || 2;
  const gates = circuit?.gates || [];
  const initBits = (circuit?.initial_state || '0'.repeat(numQubits))
    .padEnd(numQubits, '0')
    .split('');

  const handleDropOnCell = (e, qubitIdx, colIndex) => {
    e.preventDefault();
    setDragOverCell(null);
    const raw = e.dataTransfer.getData('application/quantum-gate');
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (data.kind === 'new' && data.gate_name) {
        const newGate = createDefaultGate(data.gate_name, qubitIdx, numQubits);
        if (newGate) {
          onAddGate?.(newGate, colIndex);
          onSelectGate?.(colIndex !== null && colIndex <= gates.length ? colIndex : gates.length);
        }
      } else if (data.kind === 'move' && Number.isInteger(data.fromIndex)) {
        const targetIdx = colIndex === null ? gates.length - 1 : Math.min(colIndex, gates.length - 1);
        onMoveGate?.(data.fromIndex, targetIdx);
        onSelectGate?.(targetIdx);
      }
    } catch {
      // Ignore malformed drop payloads
    }
  };

  const renderGateGlyph = (gate, q, colIdx) => {
    const name = (gate.gate_name || '').toUpperCase();
    const isTarget = (gate.target_qubits || []).includes(q);
    const isControl = (gate.control_qubits || []).includes(q);
    const meta = GATE_CATALOG[name] || {};

    if (!isTarget && !isControl) return null;

    if (isControl) {
      return (
        <div
          className="h-3.5 w-3.5 rounded-full bg-slate-100 ring-2 ring-cyan-400 shadow"
          title={`Control qubit q${q}`}
        />
      );
    }

    if ((name === 'CX' || name === 'CNOT' || name === 'CCX') && isTarget) {
      return (
        <div
          className="h-7 w-7 rounded-full border-2 border-cyan-400 bg-[#080d1b] flex items-center justify-center text-cyan-300 font-bold text-base shadow"
          title={`${name} target on q${q}`}
        >
          ⊕
        </div>
      );
    }

    if (name === 'CZ' && isTarget) {
      return (
        <div
          className="h-3.5 w-3.5 rounded-full bg-sky-400 ring-2 ring-sky-200 shadow"
          title={`CZ target on q${q}`}
        />
      );
    }

    if (name === 'SWAP' && isTarget) {
      return (
        <div
          className="h-7 w-7 flex items-center justify-center text-cyan-400 font-bold text-lg"
          title={`SWAP on q${q}`}
        >
          ✕
        </div>
      );
    }

    let label = name;
    if (gate.parameters && gate.parameters.angle !== undefined) {
      const deg = Math.round((Number(gate.parameters.angle) * 180) / Math.PI);
      label = `${name}(${deg}°)`;
    }

    return (
      <div
        className="min-w-[44px] h-9 px-1.5 rounded-lg flex items-center justify-center font-mono font-bold text-xs shadow-md border border-white/20"
        style={{
          backgroundColor: meta.color || '#334155',
          color: name === 'H' ? '#0f172a' : '#ffffff',
        }}
        title={`${meta.name || name} on q${q}`}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="sci-card overflow-hidden">
      {/* Canvas Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--lab-border)] bg-[var(--lab-elevated)]">
        <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Interactive Circuit Workspace
        </div>
        <div className="text-[11px] text-[var(--lab-muted)]">
          Click <code className="font-mono text-cyan-400">|0⟩/|1⟩</code> to flip basis · Drag gates to place or reorder
        </div>
      </div>

      {/* Scrollable Circuit Grid */}
      <div className="overflow-x-auto p-4">
        <div className="inline-flex min-w-full items-stretch">
          {/* Left column: Qubit labels + initial basis toggle */}
          <div className="flex flex-col shrink-0 pr-3 border-r border-[var(--lab-border)]">
            <div className="h-6 text-[10px] font-mono uppercase text-[var(--lab-muted)] flex items-center">
              Qubit
            </div>
            {Array.from({ length: numQubits }, (_, q) => (
              <div
                key={q}
                style={{ height: ROW_HEIGHT }}
                className="flex items-center gap-2"
              >
                <span className="w-6 text-xs font-mono font-semibold text-cyan-400">
                  q{q}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleInitialBit?.(q)}
                  title={`Toggle initial state of q${q}`}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border transition ${
                    initBits[q] === '1'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60'
                      : 'bg-[var(--lab-elevated)] text-[var(--lab-muted)] border-[var(--lab-border)] hover:border-cyan-400/40'
                  }`}
                >
                  |{initBits[q] || '0'}⟩
                </button>
              </div>
            ))}
          </div>

          {/* Gate step columns */}
          <div className="flex items-stretch flex-1 pl-2">
            {gates.map((gate, colIdx) => {
              const allQ = [
                ...(gate.control_qubits || []),
                ...(gate.target_qubits || []),
              ].filter((q) => q >= 0 && q < numQubits);
              const minQ = allQ.length > 1 ? Math.min(...allQ) : null;
              const maxQ = allQ.length > 1 ? Math.max(...allQ) : null;
              const isSelected = selectedGateIndex === colIdx;

              return (
                <div
                  key={gate._uid || `${gate.gate_name}-${colIdx}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/quantum-gate',
                      JSON.stringify({ kind: 'move', fromIndex: colIdx })
                    );
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => onSelectGate?.(colIdx)}
                  style={{ width: COL_WIDTH }}
                  className={`group relative flex flex-col shrink-0 cursor-pointer rounded-lg transition ${
                    isSelected
                      ? 'bg-cyan-500/10 ring-1 ring-cyan-400/70'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Step Header + Quick Reorder / Delete Controls */}
                  <div className="h-6 flex items-center justify-center gap-1 text-[10px] font-mono text-[var(--lab-muted)]">
                    <span>t{colIdx + 1}</span>
                    {isSelected && (
                      <div className="flex items-center gap-0.5">
                        {colIdx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveGate?.(colIdx, colIdx - 1);
                              onSelectGate?.(colIdx - 1);
                            }}
                            title="Move earlier"
                            className="p-0.5 rounded hover:bg-white/10 text-cyan-400"
                          >
                            <ArrowLeft className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {colIdx < gates.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveGate?.(colIdx, colIdx + 1);
                              onSelectGate?.(colIdx + 1);
                            }}
                            title="Move later"
                            className="p-0.5 rounded hover:bg-white/10 text-cyan-400"
                          >
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveGate?.(colIdx);
                          }}
                          title="Remove gate"
                          className="p-0.5 rounded hover:bg-rose-500/20 text-rose-400"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vertical connector for multi-qubit gates */}
                  {minQ !== null && maxQ !== null && maxQ > minQ && (
                    <div
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-0.5 bg-slate-300/80 z-0"
                      style={{
                        top: 24 + minQ * ROW_HEIGHT + ROW_HEIGHT / 2,
                        height: (maxQ - minQ) * ROW_HEIGHT,
                      }}
                    />
                  )}

                  {/* Per-qubit wire cell */}
                  {Array.from({ length: numQubits }, (_, q) => {
                    const isHovered =
                      dragOverCell?.col === colIdx && dragOverCell?.q === q;
                    return (
                      <div
                        key={q}
                        style={{ height: ROW_HEIGHT }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverCell({ col: colIdx, q });
                        }}
                        onDragLeave={() => setDragOverCell(null)}
                        onDrop={(e) => handleDropOnCell(e, q, colIdx)}
                        className={`relative flex items-center justify-center ${
                          isHovered ? 'bg-cyan-500/20 rounded' : ''
                        }`}
                      >
                        {/* Horizontal wire */}
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-500/40" />
                        {/* Gate symbol */}
                        <div className="relative z-10">{renderGateGlyph(gate, q, colIdx)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Trailing drop zone column */}
            <div className="flex flex-col flex-1 min-w-[96px]">
              <div className="h-6 flex items-center justify-center text-[10px] font-mono text-[var(--lab-muted)]">
                + Step
              </div>
              {Array.from({ length: numQubits }, (_, q) => {
                const isHovered =
                  dragOverCell?.col === 'end' && dragOverCell?.q === q;
                return (
                  <div
                    key={q}
                    style={{ height: ROW_HEIGHT }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCell({ col: 'end', q });
                    }}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={(e) => handleDropOnCell(e, q, gates.length)}
                    className={`relative flex items-center justify-center transition ${
                      isHovered ? 'bg-cyan-500/15 rounded-lg' : ''
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-500/40 border-dashed" />
                    <div
                      className={`relative z-10 flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[10px] font-mono transition ${
                        isHovered
                          ? 'border-cyan-400 text-cyan-300 bg-cyan-500/20'
                          : 'border-[var(--lab-border)] text-[var(--lab-muted)] opacity-60'
                      }`}
                    >
                      <Plus className="h-2.5 w-2.5" />
                      q{q}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {gates.length === 0 && (
          <div className="mt-2 text-center text-xs text-[var(--lab-muted)] py-2 border-t border-dashed border-[var(--lab-border)]">
            Circuit is empty. Drag a gate from the left palette or click any gate to add it to a wire.
          </div>
        )}
      </div>
    </div>
  );
}
