import React from 'react';

export default function QuantumLogo({ size = 34, showWordmark = true, compact = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="14" className="fill-slate-900 dark:fill-[#0a1224]" />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="13"
          stroke="url(#qLogoGrad)"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="21"
          ry="8.5"
          transform="rotate(-32 32 32)"
          stroke="#22D3EE"
          strokeWidth="2.4"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="21"
          ry="8.5"
          transform="rotate(32 32 32)"
          stroke="#3B82F6"
          strokeWidth="2.4"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="21"
          ry="8.5"
          transform="rotate(90 32 32)"
          stroke="#8B5CF6"
          strokeWidth="2"
          strokeOpacity="0.85"
        />
        <circle cx="32" cy="32" r="5" fill="#22D3EE" />
        <circle cx="48" cy="22" r="2.6" fill="#38BDF8" />
        <circle cx="16" cy="42" r="2.6" fill="#A78BFA" />
        <defs>
          <linearGradient id="qLogoGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22D3EE" />
            <stop offset="0.5" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-extrabold tracking-wider text-[var(--lab-text)]">
            QUANTUM <span className="text-cyan-400">LAB</span>
          </div>
          {!compact && (
            <div className="text-[10px] font-medium tracking-wide text-[var(--lab-muted)] truncate">
              Explore. Experiment. Understand.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
