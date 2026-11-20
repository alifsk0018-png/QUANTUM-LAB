import React from 'react';
import { Cpu, Activity } from 'lucide-react';

const SHOT_PRESETS = [100, 512, 1024, 4096, 8192];

export default function SimulationControls({
  simConfig,
  onChange,
  aerAvailable = true,
}) {
  const mode = simConfig?.simulation_mode || 'ideal';
  const shots = simConfig?.num_shots ?? 1024;
  const gateErr = simConfig?.noise_params?.gate_error ?? 0.01;
  const measErr = simConfig?.noise_params?.measurement_error ?? 0.01;
  const seed = simConfig?.seed ?? '';

  return (
    <div className="sci-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Simulation Configuration
        </span>
        <span className="text-[11px] font-mono text-[var(--lab-muted)]">
          Qiskit Engine
        </span>
      </div>

      {/* Mode Selector */}
      <div>
        <span className="block text-[11px] font-semibold text-[var(--lab-muted)] mb-1.5">
          Simulation Mode
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ simulation_mode: 'ideal' })}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              mode === 'ideal'
                ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Ideal (Exact)
          </button>

          <button
            type="button"
            onClick={() => onChange({ simulation_mode: 'noisy' })}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              mode === 'noisy'
                ? 'border-amber-400 bg-amber-500/15 text-amber-400'
                : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Noisy (Aer)
          </button>
        </div>

        {mode === 'noisy' && !aerAvailable && (
          <p className="text-[11px] text-amber-400 mt-1.5">
            Note: qiskit-aer is unavailable on backend — backend will fall back to ideal simulation with a warning.
          </p>
        )}
      </div>

      {/* Measurement Shots */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="sim-shots" className="text-[11px] font-semibold text-[var(--lab-muted)]">
            Measurement Shots
          </label>
          <span className="text-xs font-mono text-cyan-400">{shots}</span>
        </div>
        <input
          id="sim-shots"
          type="number"
          min={1}
          max={10000}
          value={shots}
          onChange={(e) => {
            const v = Math.min(10000, Math.max(1, Number(e.target.value) || 1));
            onChange({ num_shots: v });
          }}
          className="sci-input py-1.5 text-xs font-mono mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {SHOT_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ num_shots: s })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                shots === s
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                  : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Noisy Parameters */}
      {mode === 'noisy' && (
        <div className="space-y-3 pt-2 border-t border-[var(--lab-border)]">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-[var(--lab-muted)]">Gate Depolarizing Error</span>
              <span className="font-mono text-amber-400">{(gateErr * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.25}
              step={0.005}
              value={gateErr}
              onChange={(e) =>
                onChange({
                  noise_params: { gate_error: parseFloat(e.target.value), measurement_error: measErr },
                })
              }
              className="w-full accent-amber-400"
              aria-label="Gate error rate"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-[var(--lab-muted)]">Readout Measurement Error</span>
              <span className="font-mono text-amber-400">{(measErr * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.25}
              step={0.005}
              value={measErr}
              onChange={(e) =>
                onChange({
                  noise_params: { gate_error: gateErr, measurement_error: parseFloat(e.target.value) },
                })
              }
              className="w-full accent-amber-400"
              aria-label="Measurement readout error rate"
            />
          </div>
        </div>
      )}

      {/* Reproducibility Seed */}
      <div>
        <label htmlFor="sim-seed" className="block text-[11px] font-semibold text-[var(--lab-muted)] mb-1">
          Random Seed (Optional Reproducibility)
        </label>
        <input
          id="sim-seed"
          type="number"
          value={seed}
          onChange={(e) => onChange({ seed: e.target.value })}
          placeholder="Auto (leave empty or enter integer, e.g. 42)"
          className="sci-input py-1.5 text-xs font-mono"
        />
      </div>
    </div>
  );
}
