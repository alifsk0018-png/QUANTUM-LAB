import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  Beaker,
  Bot,
  Cpu,
  FlaskConical,
  FolderArchive,
  GraduationCap,
  PlusCircle,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  getDashboardSummary,
  getExperiments,
  getLearningModules,
  getLearningProgress,
} from '../services/api';
import { useQuantum } from '../context/QuantumContext';
import { useTheme } from '../context/ThemeContext';
import { PRESET_EXPERIMENTS } from '../data/experiments';

const CONCEPT_CARDS = [
  {
    title: 'Superposition',
    formula: '|ψ⟩ = α|0⟩ + β|1⟩',
    description:
      'Qubits exist in coherent complex linear combinations of basis states until measured.',
    accent: 'from-cyan-500/20 to-blue-500/5 border-cyan-500/25',
  },
  {
    title: 'Entanglement',
    formula: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
    description:
      'Non-separable multi-qubit correlations where measuring one qubit constrains the other.',
    accent: 'from-purple-500/20 to-blue-500/5 border-purple-500/25',
  },
  {
    title: 'Interference',
    formula: 'H · Z · H |0⟩ = |1⟩',
    description:
      'Opposite-phase amplitudes cancel destructively while aligned phases amplify solutions.',
    accent: 'from-blue-500/20 to-cyan-500/5 border-blue-500/25',
  },
  {
    title: 'Quantum Gates',
    formula: 'U†U = I',
    description:
      'Reversible unitary transformations rotating statevectors across Hilbert space.',
    accent: 'from-emerald-500/20 to-cyan-500/5 border-emerald-500/25',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useTheme();
  const { backendHealth, loadCircuit, resetCircuit } = useQuantum();

  const [summary, setSummary] = useState(null);
  const [recentExperiments, setRecentExperiments] = useState([]);
  const [modules, setModules] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [sumRes, expRes, modRes, progRes] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getExperiments(0, 5).catch(() => ({ experiments: [] })),
          getLearningModules().catch(() => ({ modules: [] })),
          getLearningProgress().catch(() => ({ progress: [] })),
        ]);
        if (!active) return;
        setSummary(sumRes);
        setRecentExperiments(expRes?.experiments || []);
        setModules(modRes?.modules || []);
        setProgressRecords(progRes?.progress || []);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  const stats = summary?.stats || {
    total_experiments: 0,
    saved_circuits: 0,
    completed_lessons: 0,
    total_lessons: 0,
    challenges_completed: 0,
    achievements_count: 0,
  };

  const recentActivity = summary?.recent_activity || [];

  const handleStartNew = () => {
    resetCircuit(false);
    navigate('/circuit-builder');
  };

  const handleLoadExperimentToLab = (exp) => {
    if (exp?.circuit_config) {
      loadCircuit(exp.circuit_config, true);
    }
    navigate('/laboratory');
  };

  const completedSet = new Set(
    progressRecords.filter((p) => p.completed).map((p) => `${p.module_id}:${p.lesson_id}`)
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="sci-card relative overflow-hidden p-6 sm:p-7 bg-gradient-to-br from-cyan-500/10 via-[var(--lab-surface)] to-purple-500/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome back, {profile.name} · Explore. Experiment. Understand. Innovate.
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--lab-text)]">
              QUANTUM <span className="text-cyan-400">LAB</span> Control Center
            </h1>
            <p className="text-sm text-[var(--lab-muted)] leading-relaxed">
              Design multi-qubit circuits, execute genuine IBM Qiskit statevector &amp; noisy Aer
              simulations, inspect 3D Bloch/Q-Sphere states, and learn directly from Q-ASSIST.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button type="button" onClick={handleStartNew} className="sci-btn-primary">
              <PlusCircle className="h-4 w-4" />
              Start New Experiment
            </button>
            <Link to="/laboratory" className="sci-btn-secondary">
              <FlaskConical className="h-4 w-4 text-cyan-400" />
              Open Quantum Laboratory
            </Link>
          </div>
        </div>

        {/* Backend telemetry strip */}
        <div className="mt-5 pt-4 border-t border-[var(--lab-border)] flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--lab-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                backendHealth?.online ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            API: {backendHealth?.online ? 'Connected' : 'Disconnected'}
          </span>
          <span>Qiskit: {backendHealth?.qiskit_version || '—'}</span>
          <span>Aer Noise: {backendHealth?.aer_available ? 'Ready' : 'Unavailable'}</span>
          <span>
            Q-ASSIST: {backendHealth?.ai_configured ? `${backendHealth.ai_provider} Live` : 'Educational Fallback'}
          </span>
        </div>
      </section>

      {/* Real Database Statistics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="sci-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lab-muted)]">
              Total Experiments
            </span>
            <Beaker className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[var(--lab-text)]">
            {loading ? '—' : stats.total_experiments}
          </div>
          <p className="text-xs text-[var(--lab-muted)] mt-1">Persisted in SQLite database</p>
        </div>

        <div className="sci-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lab-muted)]">
              Saved Circuits
            </span>
            <FolderArchive className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[var(--lab-text)]">
            {loading ? '—' : stats.saved_circuits}
          </div>
          <p className="text-xs text-[var(--lab-muted)] mt-1">Ready to reopen &amp; compare</p>
        </div>

        <div className="sci-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lab-muted)]">
              Completed Lessons
            </span>
            <GraduationCap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[var(--lab-text)]">
            {loading ? '—' : `${stats.completed_lessons} / ${stats.total_lessons}`}
          </div>
          <p className="text-xs text-[var(--lab-muted)] mt-1">Verified via passed quizzes</p>
        </div>

        <div className="sci-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lab-muted)]">
              Challenges Completed
            </span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[var(--lab-text)]">
            {loading ? '—' : stats.challenges_completed}
          </div>
          <p className="text-xs text-[var(--lab-muted)] mt-1">
            {stats.achievements_count || 0} achievement badge(s) earned
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Experiment Shortcuts */}
          <div className="sci-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--lab-text)]">
                  Quick Experiment Shortcuts
                </h2>
                <p className="text-xs text-[var(--lab-muted)]">
                  Launch curated Qiskit demonstrations in one click.
                </p>
              </div>
              <Link
                to="/experiments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
              >
                All Experiments <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRESET_EXPERIMENTS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => navigate(`/experiments?preset=${exp.id}`)}
                  className="text-left rounded-xl border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-3.5 hover:border-cyan-400/60 hover:bg-cyan-500/5 transition group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-cyan-400">
                      EXP #{exp.number} · {exp.circuit.num_qubits}Q
                    </span>
                    <span className="sci-badge bg-white/5 text-[var(--lab-muted)]">
                      {exp.difficulty}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[var(--lab-text)] group-hover:text-cyan-400 transition">
                    {exp.title}
                  </div>
                  <p className="text-xs text-[var(--lab-muted)] mt-1 line-clamp-2">
                    {exp.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Experiments & Saved Circuits */}
          <div className="sci-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--lab-text)]">
                  Recent Experiments &amp; Saved Circuits
                </h2>
                <p className="text-xs text-[var(--lab-muted)]">
                  Live circuits loaded from your persistent SQLite workspace.
                </p>
              </div>
              <Link
                to="/saved"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
              >
                Manage All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentExperiments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--lab-border)] p-6 text-center">
                <p className="text-sm font-medium text-[var(--lab-text)]">
                  No saved experiments yet
                </p>
                <p className="text-xs text-[var(--lab-muted)] mt-1 mb-3">
                  Run a simulation in the Quantum Laboratory or Circuit Builder and save it to view history here.
                </p>
                <Link to="/laboratory" className="sci-btn-secondary text-xs">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  Run Your First Simulation
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--lab-border)]">
                {recentExperiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--lab-text)] truncate">
                        {exp.name}
                      </div>
                      <div className="text-xs font-mono text-[var(--lab-muted)] mt-0.5">
                        {exp.num_qubits} qubits · {exp.gate_count} gates · {exp.simulation_mode} ·{' '}
                        {exp.num_shots} shots
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadExperimentToLab(exp)}
                        className="sci-btn-secondary px-2.5 py-1 text-xs"
                      >
                        <Workflow className="h-3.5 w-3.5 text-cyan-400" />
                        Reopen Circuit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantum Concept Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONCEPT_CARDS.map((c) => (
              <div
                key={c.title}
                className={`rounded-xl border bg-gradient-to-br ${c.accent} p-4 space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--lab-text)]">{c.title}</h3>
                  <code className="text-[11px] font-mono text-cyan-400">{c.formula}</code>
                </div>
                <p className="text-xs text-[var(--lab-muted)] leading-relaxed">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Q-ASSIST shortcut, Learning Progress, DB Activity */}
        <div className="space-y-6">
          {/* AI Quantum Tutor Shortcut */}
          <div className="sci-card p-5 bg-gradient-to-br from-purple-500/10 via-[var(--lab-surface)] to-cyan-500/10 border-cyan-500/25">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--lab-text)]">Q-ASSIST AI Tutor</h2>
                <p className="text-xs text-[var(--lab-muted)]">Your Intelligent Quantum Guide</p>
              </div>
            </div>
            <p className="text-xs text-[var(--lab-muted)] leading-relaxed mb-4">
              Ask Q-ASSIST to explain quantum gates, debug your circuit, or interpret real Qiskit
              simulator probabilities at Beginner, Intermediate, or Advanced depth.
            </p>
            <Link to="/tutor" className="sci-btn-primary w-full text-xs">
              <Bot className="h-4 w-4" />
              Open Q-ASSIST Workspace
            </Link>
          </div>

          {/* Learning Progress & Available Lessons */}
          <div className="sci-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--lab-text)]">Learning Progress</h2>
              <Link to="/academy" className="text-xs font-semibold text-cyan-400 hover:underline">
                Academy
              </Link>
            </div>

            {modules.length === 0 ? (
              <p className="text-xs text-[var(--lab-muted)]">Loading curriculum...</p>
            ) : (
              <div className="space-y-3">
                {modules.map((mod) => {
                  const total = mod.lessons?.length || 0;
                  const done = (mod.lessons || []).filter((l) =>
                    completedSet.has(`${mod.id}:${l.id}`)
                  ).length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={mod.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--lab-text)] truncate pr-2">
                          {mod.title}
                        </span>
                        <span className="font-mono text-cyan-400 shrink-0">
                          {done}/{total}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Database Recent Activity */}
          <div className="sci-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-[var(--lab-text)]">Recent Activity</h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--lab-muted)]">SQLite Live</span>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-xs text-[var(--lab-muted)]">
                No recorded activity yet. Save an experiment or complete a quiz in the Academy!
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.map((item, idx) => (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    className="flex items-start gap-2.5 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-2.5 text-xs"
                  >
                    <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--lab-text)] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[var(--lab-muted)] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
