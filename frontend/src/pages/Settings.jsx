import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Sun,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { useQuantum } from '../context/QuantumContext';
import { getLearningProgress } from '../services/api';

export default function Settings() {
  const { theme, setTheme, profile, updateProfile, resetProfile } = useTheme();
  const { backendHealth, refreshHealth, setSimConfig } = useQuantum();

  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [defaultLevel, setDefaultLevel] = useState(profile.defaultLevel);
  const [defaultMode, setDefaultMode] = useState(profile.defaultMode);
  const [defaultShots, setDefaultShots] = useState(profile.defaultShots);
  const [learnData, setLearnData] = useState(null);

  useEffect(() => {
    getLearningProgress()
      .then(setLearnData)
      .catch(() => null);
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Guest Researcher',
      role,
      defaultLevel,
      defaultMode,
      defaultShots: Math.min(10000, Math.max(1, Number(defaultShots) || 1024)),
    });
    setSimConfig({
      simulation_mode: defaultMode,
      num_shots: Math.min(10000, Math.max(1, Number(defaultShots) || 1024)),
    });
    toast.success('Local guest preferences saved');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
          Profile &amp; Laboratory Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
          Manage local guest researcher preferences, dark/light scientific themes, learning progress, and backend diagnostics.
        </p>
      </div>

      {/* Explicit Local Guest Mode Notice */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 flex items-start gap-3 text-xs text-[var(--lab-text)]">
        <User className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-400">Local Guest Mode Active:</strong> Authentication is intentionally omitted for frictionless local laboratory &amp; ideathon demonstrations. Your experiments and learning progress persist in the local SQLite database, and display preferences persist in browser <code className="font-mono">localStorage</code>.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Profile & Defaults */}
        <form onSubmit={handleSaveProfile} className="sci-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--lab-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--lab-text)]">
              Guest Researcher Profile &amp; Defaults
            </h2>
            <button
              type="button"
              onClick={() => {
                resetProfile();
                setName('Guest Researcher');
                setRole('Student');
                setDefaultLevel('beginner');
                setDefaultMode('ideal');
                setDefaultShots(1024);
                toast.success('Reset to default guest settings');
              }}
              className="text-xs text-[var(--lab-muted)] hover:text-cyan-400 inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
              Display Name
            </label>
            <input
              id="prof-name"
              type="text"
              className="sci-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prof-role" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
                Role
              </label>
              <select
                id="prof-role"
                className="sci-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Student">Engineering / CS Student</option>
                <option value="Educator">University Professor / Educator</option>
                <option value="Beginner">Quantum Beginner</option>
                <option value="Researcher">Researcher / Developer</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-lvl" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
                Default Q-ASSIST Depth
              </label>
              <select
                id="prof-lvl"
                className="sci-input"
                value={defaultLevel}
                onChange={(e) => setDefaultLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prof-mode" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
                Default Simulation Mode
              </label>
              <select
                id="prof-mode"
                className="sci-input"
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value)}
              >
                <option value="ideal">Ideal Statevector</option>
                <option value="noisy">Noisy (Qiskit Aer)</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-shots" className="block text-xs font-semibold text-[var(--lab-muted)] mb-1">
                Default Measurement Shots
              </label>
              <input
                id="prof-shots"
                type="number"
                min={1}
                max={10000}
                className="sci-input font-mono"
                value={defaultShots}
                onChange={(e) => setDefaultShots(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="sci-btn-primary text-xs">
            <Save className="h-4 w-4" />
            Save Preferences
          </button>
        </form>

        {/* Appearance & System Diagnostics */}
        <div className="space-y-5">
          {/* Theme Selection */}
          <div className="sci-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--lab-text)]">Interface Theme</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  theme === 'dark'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                    : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)]'
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark Scientific Lab
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600'
                    : 'border-[var(--lab-border)] bg-[var(--lab-elevated)] text-[var(--lab-muted)]'
                }`}
              >
                <Sun className="h-4 w-4" />
                Light Laboratory
              </button>
            </div>
          </div>

          {/* Learning Summary */}
          <div className="sci-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--lab-text)]">
              <Award className="h-4 w-4 text-amber-400" />
              Learning Progress Summary
            </div>
            {learnData?.stats ? (
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
                  <div className="text-lg font-bold text-cyan-400">
                    {learnData.stats.completed_lessons}/{learnData.stats.total_lessons}
                  </div>
                  <div className="text-[10px] text-[var(--lab-muted)]">Lessons</div>
                </div>
                <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
                  <div className="text-lg font-bold text-emerald-400">
                    {learnData.stats.challenges_completed}
                  </div>
                  <div className="text-[10px] text-[var(--lab-muted)]">Quizzes Passed</div>
                </div>
                <div className="rounded-lg bg-[var(--lab-elevated)] p-2.5 border border-[var(--lab-border)]">
                  <div className="text-lg font-bold text-amber-400">
                    {learnData.stats.achievements_count}
                  </div>
                  <div className="text-[10px] text-[var(--lab-muted)]">Badges</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--lab-muted)]">Connect backend to load learning progress.</p>
            )}
          </div>

          {/* Live Backend Diagnostics */}
          <div className="sci-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--lab-text)]">
                <Server className="h-4 w-4 text-cyan-400" />
                Backend &amp; Qiskit Diagnostics
              </div>
              <button
                type="button"
                onClick={refreshHealth}
                className="sci-btn-secondary px-2.5 py-1 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[var(--lab-border)]">
                <span className="text-[var(--lab-muted)]">API Status</span>
                <span className={backendHealth?.online ? 'text-emerald-400 inline-flex items-center gap-1' : 'text-rose-400'}>
                  {backendHealth?.online && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {backendHealth?.online ? 'Healthy' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--lab-border)]">
                <span className="text-[var(--lab-muted)]">Qiskit Version</span>
                <span className="text-[var(--lab-text)]">{backendHealth?.qiskit_version || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--lab-border)]">
                <span className="text-[var(--lab-muted)]">Qiskit Aer Noise</span>
                <span className="text-[var(--lab-text)]">
                  {backendHealth?.aer_available ? 'Installed' : 'Not available'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--lab-border)]">
                <span className="text-[var(--lab-muted)]">AI Tutor Mode</span>
                <span className="text-[var(--lab-text)]">
                  {backendHealth?.ai_configured
                    ? `${backendHealth.ai_provider} (${backendHealth.ai_model})`
                    : 'Non-AI Educational Fallback'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--lab-muted)]">Execution Limits</span>
                <span className="text-[var(--lab-text)]">
                  Max {backendHealth?.max_qubits ?? 8}Q · {backendHealth?.max_shots ?? 10000} shots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
