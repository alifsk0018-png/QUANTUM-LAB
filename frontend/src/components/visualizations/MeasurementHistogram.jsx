import React, { useMemo, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

function barColors(n, alpha = 0.85) {
  const colors = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const r = Math.round(6 + t * 44);
    const g = Math.round(212 - t * 82);
    const b = 246;
    colors.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
  }
  return colors;
}

export default function MeasurementHistogram({
  measurements = {},
  probabilities = {},
  idealProbabilities = null,
  simulationMode = 'ideal',
  title = 'Measurement Distribution',
  theme = 'dark',
  width = '100%',
  height = '380px',
}) {
  const [mode, setMode] = useState('counts');

  const states = useMemo(() => {
    const keys = new Set([
      ...Object.keys(measurements || {}),
      ...Object.keys(probabilities || {}),
      ...Object.keys(idealProbabilities || {}),
    ]);
    return Array.from(keys).sort();
  }, [measurements, probabilities, idealProbabilities]);

  const totalShots = useMemo(
    () => Object.values(measurements || {}).reduce((s, v) => s + Number(v || 0), 0),
    [measurements]
  );

  // Total Variation Distance between sampled/noisy distribution and theoretical ideal
  const tvd = useMemo(() => {
    if (states.length === 0 || totalShots === 0) return null;
    const refProbs = idealProbabilities || probabilities;
    let sumAbs = 0;
    for (const s of states) {
      const empirical = (measurements[s] ?? 0) / totalShots;
      const theoretical = refProbs[s] ?? 0;
      sumAbs += Math.abs(empirical - theoretical);
    }
    return 0.5 * sumAbs;
  }, [states, measurements, probabilities, idealProbabilities, totalShots]);

  if (states.length === 0) {
    return (
      <div
        style={{ width }}
        className="sci-card flex flex-col items-center justify-center p-8 text-center min-h-[260px]"
      >
        <p className="text-sm font-medium text-[var(--lab-text)]">No measurement data yet</p>
        <p className="text-xs text-[var(--lab-muted)] mt-1">
          Execute a simulation to inspect Qiskit shot counts and probabilities.
        </p>
      </div>
    );
  }

  const labels = states.map((s) => `|${s}⟩`);
  const n = labels.length;

  const isDark = theme === 'dark';
  const textColor = isDark ? '#e2e8f0' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';

  let data = [];
  let yMax = 1;

  if (mode === 'counts') {
    const vals = states.map((s) => measurements[s] ?? 0);
    yMax = Math.max(...vals, 1) * 1.18;
    data = [
      {
        type: 'bar',
        name: simulationMode === 'noisy' ? 'Noisy Shot Counts' : 'Sampled Shot Counts',
        x: labels,
        y: vals,
        marker: {
          color: barColors(n, 0.85),
          line: { color: barColors(n, 1), width: 1.2 },
        },
        hovertemplate: '<b>%{x}</b><br>Counts: %{y}<extra></extra>',
        text: vals.map((v) => String(v)),
        textposition: 'outside',
        textfont: { color: textColor, size: 11 },
      },
    ];
  } else if (mode === 'probability') {
    const vals = states.map((s) => {
      if (probabilities[s] != null) return probabilities[s] * 100;
      if (totalShots > 0) return ((measurements[s] ?? 0) / totalShots) * 100;
      return 0;
    });
    yMax = Math.min(Math.max(...vals, 5) * 1.2, 108);
    data = [
      {
        type: 'bar',
        name: simulationMode === 'noisy' ? 'Noisy Empirical (%)' : 'Ideal Theoretical (%)',
        x: labels,
        y: vals,
        marker: {
          color: barColors(n, 0.85),
          line: { color: barColors(n, 1), width: 1.2 },
        },
        hovertemplate: '<b>%{x}</b><br>Probability: %{y:.2f}%<extra></extra>',
        text: vals.map((v) => `${v.toFixed(1)}%`),
        textposition: 'outside',
        textfont: { color: textColor, size: 11 },
      },
    ];
  } else {
    // Compare Theoretical Ideal vs Empirical Shot Frequencies (or Noisy vs Ideal)
    const refProbs = idealProbabilities || probabilities;
    const idealVals = states.map((s) => (refProbs[s] ?? 0) * 100);
    const sampledVals = states.map((s) =>
      totalShots > 0 ? ((measurements[s] ?? 0) / totalShots) * 100 : (probabilities[s] ?? 0) * 100
    );
    yMax = Math.min(Math.max(...idealVals, ...sampledVals, 5) * 1.22, 110);
    data = [
      {
        type: 'bar',
        name: 'Theoretical Ideal (%)',
        x: labels,
        y: idealVals,
        marker: { color: 'rgba(56, 189, 248, 0.85)' },
        hovertemplate: '<b>%{x}</b><br>Theoretical Ideal: %{y:.2f}%<extra></extra>',
      },
      {
        type: 'bar',
        name: simulationMode === 'noisy' ? 'Noisy Measured (%)' : 'Sampled Shots (%)',
        x: labels,
        y: sampledVals,
        marker: { color: simulationMode === 'noisy' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(139, 92, 246, 0.85)' },
        hovertemplate: '<b>%{x}</b><br>Measured: %{y:.2f}%<extra></extra>',
      },
    ];
  }

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    barmode: mode === 'compare' ? 'group' : 'relative',
    font: { color: textColor, family: 'Inter, system-ui, sans-serif', size: 12 },
    xaxis: {
      title: { text: 'Computational Basis State', font: { color: mutedColor, size: 11 } },
      tickfont: { color: textColor, family: 'JetBrains Mono, monospace', size: 11 },
      gridcolor: gridColor,
      tickangle: states.length > 12 ? -45 : 0,
    },
    yaxis: {
      title: {
        text: mode === 'counts' ? 'Shot Counts' : 'Probability (%)',
        font: { color: mutedColor, size: 11 },
      },
      tickfont: { color: mutedColor, size: 11 },
      gridcolor: gridColor,
      range: [0, yMax],
      zeroline: false,
    },
    legend: {
      orientation: 'h',
      y: 1.12,
      x: 0,
      font: { color: textColor, size: 11 },
    },
    margin: { t: 42, b: 56, l: 54, r: 16 },
    bargap: 0.25,
    hoverlabel: {
      bgcolor: isDark ? '#0f172a' : '#ffffff',
      bordercolor: '#22d3ee',
      font: { color: textColor, size: 12 },
    },
  };

  const tabClass = (active) =>
    `px-2.5 py-1 rounded-md text-xs font-medium transition ${
      active
        ? 'bg-cyan-500 text-slate-950 font-semibold'
        : 'bg-white/5 text-[var(--lab-muted)] hover:text-[var(--lab-text)] border border-[var(--lab-border)]'
    }`;

  return (
    <div style={{ width }} className="sci-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2 border-b border-[var(--lab-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              {title}
            </h3>
            <span
              className={`sci-badge ${
                simulationMode === 'noisy'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {simulationMode === 'noisy' ? 'Noisy Aer' : 'Ideal Qiskit'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--lab-muted)] mt-0.5">
            {totalShots.toLocaleString()} shots · {states.length} non-zero/sampled states
            {tvd !== null && ` · TVD vs Ideal: ${(tvd * 100).toFixed(2)}%`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" className={tabClass(mode === 'counts')} onClick={() => setMode('counts')}>
            Counts
          </button>
          <button
            type="button"
            className={tabClass(mode === 'probability')}
            onClick={() => setMode('probability')}
          >
            Prob %
          </button>
          <button type="button" className={tabClass(mode === 'compare')} onClick={() => setMode('compare')}>
            Compare Ideal
          </button>
        </div>
      </div>

      <div className="px-2 pb-2">
        <Plot
          data={data}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler
          style={{ width: '100%', height }}
        />
      </div>
    </div>
  );
}
