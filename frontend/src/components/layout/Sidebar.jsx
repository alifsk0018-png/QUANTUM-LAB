import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Workflow,
  Beaker,
  Orbit,
  Bot,
  GraduationCap,
  Microscope,
  FolderArchive,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import QuantumLogo from '../ui/QuantumLogo';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview stats activity' },
  { to: '/laboratory', label: 'Quantum Laboratory', icon: FlaskConical, keywords: 'lab gates simulate qubits' },
  { to: '/circuit-builder', label: 'Circuit Builder', icon: Workflow, keywords: 'drag drop editor canvas qasm' },
  { to: '/experiments', label: 'Quantum Experiments', icon: Beaker, keywords: 'superposition entanglement teleportation interference grover' },
  { to: '/visualizer', label: 'Quantum Visualizer', icon: Orbit, keywords: 'bloch qsphere statevector histogram' },
  { to: '/tutor', label: 'AI Quantum Tutor', icon: Bot, keywords: 'q-assist chat ai explain debug' },
  { to: '/academy', label: 'Learning Academy', icon: GraduationCap, keywords: 'lessons quizzes badges curriculum' },
  { to: '/research', label: 'Research Workspace', icon: Microscope, keywords: 'compare export csv json pdf notes' },
  { to: '/saved', label: 'Saved Experiments', icon: FolderArchive, keywords: 'history database rename delete load' },
  { to: '/settings', label: 'Profile & Settings', icon: Settings, keywords: 'guest preferences theme diagnostics' },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  backendOnline,
}) {
  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
        : 'text-[var(--lab-muted)] hover:bg-white/5 hover:text-[var(--lab-text)] border border-transparent'
    }`;

  const content = (
    <div className="flex h-full flex-col bg-[var(--lab-surface)] border-r border-[var(--lab-border)]">
      {/* Brand header */}
      <div className="flex items-center justify-between px-3.5 h-16 border-b border-[var(--lab-border)]">
        <NavLink to="/" onClick={onCloseMobile} className="min-w-0">
          <QuantumLogo size={34} showWordmark={!collapsed} />
        </NavLink>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex rounded-lg p-1.5 text-[var(--lab-muted)] hover:bg-white/5 hover:text-cyan-400 transition"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden rounded-lg p-1.5 text-[var(--lab-muted)] hover:bg-white/5 hover:text-[var(--lab-text)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation items */}
      <nav aria-label="Primary Navigation" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={linkClass}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Engine Status Footer */}
      <div className="p-3 border-t border-[var(--lab-border)]">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } rounded-lg bg-[var(--lab-elevated)] border border-[var(--lab-border)] px-2.5 py-2 text-xs`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            {!collapsed && (
              <span className="truncate font-mono text-[11px] text-[var(--lab-muted)]">
                Qiskit {backendOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-cyan-400">v1.0</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">{content}</aside>
        </div>
      )}
    </>
  );
}
