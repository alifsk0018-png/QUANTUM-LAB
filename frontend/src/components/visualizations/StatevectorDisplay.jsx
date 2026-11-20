import React, { useMemo, useState } from 'react';

function complexMag([re, im]) {
  return Math.sqrt(re * re + im * im);
}

function complexPhase([re, im]) {
  return Math.atan2(im, re);
}

function formatComplex([re, im], precision = 4) {
  const r = Number(re.toFixed(precision));
  const i = Number(im.toFixed(precision));

  if (i === 0) return `${Object.is(r, -0) ? 0 : r}`;
  if (r === 0) {
    if (i === 1) return 'i';
    if (i === -1) return '−i';
    return `${i < 0 ? '−' : ''}${Math.abs(i)}i`;
  }
  const sign = i > 0 ? ' + ' : ' − ';
  const absI = Math.abs(i);
  return `${r}${sign}${absI === 1 ? '' : absI}i`;
}

function basisLabel(index, numQubits) {
  return `|${index.toString(2).padStart(numQubits, '0')}⟩`;
}

export default function StatevectorDisplay({
  statevector = [],
  numQubits = 1,
  maxRows = 32,
}) {
  const [nonZeroOnly, setNonZeroOnly] = useState(numQubits >= 4);

  const rows = useMemo(() => {
    return (statevector || []).map((amp, idx) => {
      const mag = complexMag(amp);
      const phase = complexPhase(amp);
      const phaseDeg = (phase * 180) / Math.PI;
      const prob = mag * mag;

      return {
        index: idx,
        label: basisLabel(idx, numQubits),
        amplitude: formatComplex(amp),
        magnitude: mag,
        phaseDeg,
        probability: prob,
      };
    });
  }, [statevector, numQubits]);

  const visibleRows = useMemo(
    () => (nonZeroOnly ? rows.filter((r) => r.probability > 1e-8) : rows),
    [rows, nonZeroOnly]
  );

  const diracTerms = useMemo(() => {
    const active = rows.filter((r) => r.magnitude > 1e-4).slice(0, 6);
    if (active.length === 0) return '|0⟩';
    const expr = active.map((r) => `(${r.amplitude})${r.label}`).join(' + ');
    const hiddenCount = rows.filter((r) => r.magnitude > 1e-4).length - active.length;
    return hiddenCount > 0 ? `${expr} + ... (+${hiddenCount} terms)` : expr;
  }, [rows]);

  const totalProb = useMemo(
    () => rows.reduce((s, r) => s + r.probability, 0),
    [rows]
  );

  const needsScroll = visibleRows.length > maxRows;

  return (
    <div className="sci-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--lab-border)]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Statevector Amplitudes
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-mono text-[var(--lab-muted)]">
            <span>{numQubits} qubit{numQubits > 1 ? 's' : ''}</span>
            <span>{rows.length} basis states</span>
            <span>Σ|cᵢ|² = {totalProb.toFixed(6)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setNonZeroOnly((v) => !v)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition border ${
            nonZeroOnly
              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/35'
              : 'bg-[var(--lab-elevated)] text-[var(--lab-muted)] border-[var(--lab-border)]'
          }`}
        >
          {nonZeroOnly ? 'Showing Non-Zero Only' : 'Show Non-Zero Only'}
        </button>
      </div>

      {/* Dirac ket summary */}
      <div className="px-4 py-2 bg-[var(--lab-elevated)] border-b border-[var(--lab-border)] text-xs font-mono text-cyan-300 dark:text-cyan-300 overflow-x-auto whitespace-nowrap">
        <span className="text-[var(--lab-muted)] mr-2">|ψ⟩ =</span>
        <span className="text-[var(--lab-text)]">{diracTerms}</span>
      </div>

      <div className={needsScroll ? 'max-h-[400px] overflow-y-auto' : 'overflow-x-auto'}>
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[var(--lab-elevated)] border-b border-[var(--lab-border)] text-[11px] uppercase tracking-wider text-[var(--lab-muted)]">
            <tr>
              <th className="px-4 py-2.5">Basis State</th>
              <th className="px-4 py-2.5">Amplitude (α + iβ)</th>
              <th className="px-4 py-2.5">Magnitude |c|</th>
              <th className="px-4 py-2.5">Phase arg(c)</th>
              <th className="px-4 py-2.5 min-w-[170px]">Probability |c|²</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--lab-border)] font-mono">
            {visibleRows.map((row) => {
              const hue = (row.phaseDeg + 360) % 360;
              const pct = (row.probability * 100).toFixed(2);
              return (
                <tr key={row.index} className="hover:bg-cyan-500/5 transition-colors">
                  <td className="px-4 py-2 font-semibold text-cyan-400 text-sm">{row.label}</td>
                  <td className="px-4 py-2 text-[var(--lab-text)]">{row.amplitude}</td>
                  <td className="px-4 py-2 text-[var(--lab-text)]">{row.magnitude.toFixed(4)}</td>
                  <td className="px-4 py-2 text-[var(--lab-text)]">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
                      style={{ background: `hsl(${hue}, 80%, 60%)` }}
                    />
                    {row.phaseDeg.toFixed(1)}°
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-700/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, row.probability * 100)}%` }}
                        />
                      </div>
                      <span className="w-14 text-right text-[var(--lab-muted)]">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
