import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  HelpCircle,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useQuantum } from '../../context/QuantumContext';
import { GATE_LIST } from '../../data/gates';
import { PRESET_EXPERIMENTS } from '../../data/experiments';
import { NAV_ITEMS } from './Sidebar';
import QuantumLogo from '../ui/QuantumLogo';
import Modal from '../ui/Modal';

export default function TopBar({ onOpenMobileMenu, sidebarCollapsed }) {
  const navigate = useNavigate();
  const { theme, toggleTheme, profile } = useTheme();
  const { notifications, markAllNotificationsRead, backendHealth } = useQuantum();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const items = [];

    NAV_ITEMS.forEach((nav) => {
      if (
        nav.label.toLowerCase().includes(q) ||
        nav.keywords.toLowerCase().includes(q)
      ) {
        items.push({ type: 'Page', title: nav.label, subtitle: nav.to, to: nav.to });
      }
    });

    PRESET_EXPERIMENTS.forEach((exp) => {
      if (
        exp.title.toLowerCase().includes(q) ||
        exp.subtitle.toLowerCase().includes(q)
      ) {
        items.push({
          type: 'Experiment',
          title: exp.title,
          subtitle: exp.difficulty,
          to: `/experiments?preset=${exp.id}`,
        });
      }
    });

    GATE_LIST.forEach((g) => {
      if (
        g.name.toLowerCase().includes(q) ||
        g.gate_name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      ) {
        items.push({
          type: 'Gate',
          title: `${g.name} (${g.symbol})`,
          subtitle: g.operation,
          to: '/laboratory',
        });
      }
    });

    return items.slice(0, 8);
  }, [searchQuery]);

  const handleSelectSearch = (to) => {
    setSearchQuery('');
    setSearchFocused(false);
    navigate(to);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--lab-border)] bg-[var(--lab-surface)]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* Left: mobile menu + optional logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden rounded-lg p-2 text-[var(--lab-muted)] hover:bg-white/5 hover:text-[var(--lab-text)]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className={sidebarCollapsed ? 'block' : 'lg:hidden'}>
            <QuantumLogo size={30} compact />
          </div>
        </div>

        {/* Center: global search */}
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[var(--lab-muted)] pointer-events-none" />
            <input
              type="search"
              aria-label="Search QUANTUM LAB"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              placeholder="Search gates, experiments, lessons, pages..."
              className="sci-input pl-9 pr-3 py-1.5 text-xs sm:text-sm"
            />
          </div>

          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-surface)] shadow-xl overflow-hidden z-40">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => handleSelectSearch(res.to)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-cyan-500/10 flex items-center justify-between gap-3 border-b last:border-b-0 border-[var(--lab-border)] transition"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--lab-text)] truncate">
                      {res.title}
                    </div>
                    <div className="text-[11px] text-[var(--lab-muted)] truncate">
                      {res.subtitle}
                    </div>
                  </div>
                  <span className="sci-badge bg-cyan-500/15 text-cyan-400 shrink-0">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="rounded-lg p-2 text-[var(--lab-muted)] hover:bg-white/5 hover:text-cyan-400 transition"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Help button */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Open Quantum Lab help"
            title="Lab Help & Conventions"
            className="rounded-lg p-2 text-[var(--lab-muted)] hover:bg-white/5 hover:text-cyan-400 transition"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              aria-label="Notifications"
              title="Notifications"
              className="relative rounded-lg p-2 text-[var(--lab-muted)] hover:bg-white/5 hover:text-cyan-400 transition"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] sci-card shadow-2xl z-40 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--lab-border)]">
                  <span className="text-xs font-semibold text-[var(--lab-text)]">
                    Lab Activity & Notifications
                  </span>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[var(--lab-border)]">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-3.5 py-2.5 text-xs ${
                        n.read ? 'opacity-75' : 'bg-cyan-500/5'
                      }`}
                    >
                      <div className="font-semibold text-[var(--lab-text)]">{n.title}</div>
                      <div className="text-[var(--lab-muted)] mt-0.5">{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu (Local Guest Mode) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] px-2.5 py-1.5 text-xs hover:border-cyan-400/50 transition"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="hidden md:inline font-medium text-[var(--lab-text)] max-w-[115px] truncate">
                {profile.name}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 sci-card shadow-2xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--lab-border)] bg-[var(--lab-elevated)]">
                  <div className="text-xs font-bold text-[var(--lab-text)]">{profile.name}</div>
                  <div className="text-[11px] text-[var(--lab-muted)]">{profile.role} · Local Guest Mode</div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400">
                    <Sparkles className="h-3 w-3" />
                    AI: {backendHealth?.ai_configured ? `Live (${backendHealth.ai_provider})` : 'Educational Fallback'}
                  </div>
                </div>
                <div className="p-1.5 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/10 text-[var(--lab-text)] transition"
                  >
                    Profile & Lab Preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/saved');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/10 text-[var(--lab-text)] transition"
                  >
                    Saved Experiments
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/academy');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/10 text-[var(--lab-text)] transition"
                  >
                    Learning Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal */}
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="QUANTUM LAB — Quick Reference & Scientific Conventions"
        subtitle="Explore. Experiment. Understand. Innovate."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs sm:text-sm text-[var(--lab-text)] leading-relaxed">
          <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-3.5">
            <h3 className="font-semibold text-cyan-400 mb-1">1. Qiskit Bitstring Ordering (Little-Endian)</h3>
            <p className="text-[var(--lab-muted)]">
              In Qiskit outputs (histograms and statevector labels), qubit <code className="font-mono text-cyan-400">q0</code> is
              the <strong>rightmost</strong> bit and <code className="font-mono text-cyan-400">q(n-1)</code> is the{' '}
              <strong>leftmost</strong> bit: e.g., <code className="font-mono text-cyan-400">|q1 q0⟩</code>.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-3.5">
            <h3 className="font-semibold text-[var(--lab-text)] mb-1">2. Bloch Sphere vs. Q-Sphere</h3>
            <p className="text-[var(--lab-muted)]">
              A single-qubit Bloch sphere can only show a single qubit&apos;s reduced state. For entangled multi-qubit
              circuits (like Bell states), each qubit&apos;s Bloch vector shrinks to the origin (purity = 0.5). Use the{' '}
              <strong>Q-Sphere</strong> and <strong>Statevector</strong> tabs to inspect multi-qubit amplitudes and phases.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-3.5">
            <h3 className="font-semibold text-[var(--lab-text)] mb-1">3. Ideal vs. Noisy Simulator Modes</h3>
            <p className="text-[var(--lab-muted)]">
              <strong>Ideal Mode</strong> runs exact Qiskit <code className="font-mono">Statevector</code> simulation.{' '}
              <strong>Noisy Mode</strong> uses <code className="font-mono">qiskit-aer</code> with depolarizing gate errors
              and readout assignment errors. All results are genuine software simulations (not physical quantum hardware).
            </p>
          </div>

          <div className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-3.5">
            <h3 className="font-semibold text-[var(--lab-text)] mb-1">4. Circuit Builder Tips</h3>
            <p className="text-[var(--lab-muted)]">
              Drag any gate from the left palette onto a qubit wire, click gates to adjust targets/controls/rotation angles,
              drag existing gates to reorder steps, or use Undo/Redo anytime.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
