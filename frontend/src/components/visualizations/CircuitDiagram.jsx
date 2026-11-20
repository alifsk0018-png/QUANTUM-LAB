import React, { useMemo } from 'react';

const WIRE_Y_SPACING = 56;
const WIRE_Y_START = 52;
const GATE_WIDTH = 44;
const GATE_HEIGHT = 36;
const GATE_X_SPACING = 62;
const GATE_X_START = 112;
const QUBIT_LABEL_X = 14;
const CONTROL_RADIUS = 6;
const SWAP_SIZE = 8;

const GATE_COLORS = {
  X: { fill: '#e11d48', text: '#fff' },
  Y: { fill: '#9333ea', text: '#fff' },
  Z: { fill: '#2563eb', text: '#fff' },
  S: { fill: '#0d9488', text: '#fff' },
  T: { fill: '#059669', text: '#fff' },
  RX: { fill: '#ea580c', text: '#fff' },
  RY: { fill: '#a21caf', text: '#fff' },
  RZ: { fill: '#1d4ed8', text: '#fff' },
  H: { fill: '#eab308', text: '#0f172a' },
  I: { fill: '#475569', text: '#e2e8f0' },
  CX: { fill: '#0891b2', text: '#fff' },
  CNOT: { fill: '#0891b2', text: '#fff' },
  CZ: { fill: '#0284c7', text: '#fff' },
  CCX: { fill: '#d97706', text: '#fff' },
  SWAP: { fill: 'none', text: '#38bdf8' },
  M: { fill: '#334155', text: '#38bdf8' },
  _default: { fill: '#475569', text: '#f1f5f9' },
};

function gateColor(name) {
  const upper = (name || '').toUpperCase();
  return GATE_COLORS[upper] || GATE_COLORS._default;
}

function layoutGates(gates, numQubits) {
  const nextFreeCol = new Array(numQubits).fill(0);
  const placed = [];

  for (const gate of gates || []) {
    const name = (gate.gate_name || gate.gate || gate.name || 'I').toUpperCase();
    const targets = (gate.target_qubits ?? gate.targets ?? [0]).filter(
      (q) => q >= 0 && q < numQubits
    );
    const controls = (gate.control_qubits ?? gate.controls ?? []).filter(
      (q) => q >= 0 && q < numQubits
    );
    const params = gate.parameters ?? gate.params ?? {};

    const allQubits = [...controls, ...targets];
    if (allQubits.length === 0) continue;

    const minQ = Math.min(...allQubits);
    const maxQ = Math.max(...allQubits);

    let col = 0;
    for (let q = minQ; q <= maxQ; q++) {
      col = Math.max(col, nextFreeCol[q]);
    }
    for (let q = minQ; q <= maxQ; q++) {
      nextFreeCol[q] = col + 1;
    }

    placed.push({ name, targets, controls, params, col });
  }

  const totalCols = Math.max(...nextFreeCol, 1);
  return { placed, totalCols };
}

function qubitY(q) {
  return WIRE_Y_START + q * WIRE_Y_SPACING;
}

function gateX(col) {
  return GATE_X_START + col * GATE_X_SPACING;
}

function QubitLabel({ q, initBit }) {
  return (
    <g>
      <text
        x={QUBIT_LABEL_X}
        y={qubitY(q)}
        fill="#38bdf8"
        fontSize={12.5}
        fontFamily='"JetBrains Mono", monospace'
        fontWeight={600}
        dominantBaseline="central"
      >
        q{q}
      </text>
      <rect
        x={QUBIT_LABEL_X + 26}
        y={qubitY(q) - 11}
        width={30}
        height={22}
        rx={5}
        fill={initBit === '1' ? 'rgba(34,211,238,0.18)' : 'rgba(148,163,184,0.12)'}
        stroke={initBit === '1' ? 'rgba(34,211,238,0.6)' : 'rgba(148,163,184,0.3)'}
      />
      <text
        x={QUBIT_LABEL_X + 41}
        y={qubitY(q)}
        fill={initBit === '1' ? '#22d3ee' : '#cbd5e1'}
        fontSize={11}
        fontFamily='"JetBrains Mono", monospace'
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        |{initBit}⟩
      </text>
    </g>
  );
}

function Wire({ q, totalWidth }) {
  return (
    <line
      x1={GATE_X_START - 34}
      y1={qubitY(q)}
      x2={totalWidth - 16}
      y2={qubitY(q)}
      stroke="rgba(148,163,184,0.35)"
      strokeWidth={1.6}
    />
  );
}

function GateBox({ col, q, label, fill, textColor, fontSize = 13 }) {
  const cx = gateX(col);
  const cy = qubitY(q);
  return (
    <g>
      <rect
        x={cx - GATE_WIDTH / 2}
        y={cy - GATE_HEIGHT / 2}
        width={GATE_WIDTH}
        height={GATE_HEIGHT}
        rx={7}
        fill={fill}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy}
        fill={textColor}
        fontSize={fontSize}
        fontFamily='"Inter", sans-serif'
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
}

function ControlDot({ col, q }) {
  return <circle cx={gateX(col)} cy={qubitY(q)} r={CONTROL_RADIUS} fill="#e2e8f0" />;
}

function ControlLine({ col, q1, q2 }) {
  return (
    <line
      x1={gateX(col)}
      y1={qubitY(q1)}
      x2={gateX(col)}
      y2={qubitY(q2)}
      stroke="#cbd5e1"
      strokeWidth={1.6}
    />
  );
}

function CXTarget({ col, q }) {
  const cx = gateX(col);
  const cy = qubitY(q);
  const r = 14;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#080d1b" stroke="#22d3ee" strokeWidth={2} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#22d3ee" strokeWidth={2} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#22d3ee" strokeWidth={2} />
    </g>
  );
}

function SwapX({ col, q }) {
  const cx = gateX(col);
  const cy = qubitY(q);
  return (
    <g>
      <line x1={cx - SWAP_SIZE} y1={cy - SWAP_SIZE} x2={cx + SWAP_SIZE} y2={cy + SWAP_SIZE} stroke="#38bdf8" strokeWidth={2.2} />
      <line x1={cx + SWAP_SIZE} y1={cy - SWAP_SIZE} x2={cx - SWAP_SIZE} y2={cy + SWAP_SIZE} stroke="#38bdf8" strokeWidth={2.2} />
    </g>
  );
}

function renderGate({ name, targets, controls, params, col }, idx) {
  const key = `${name}-${col}-${idx}`;
  const elements = [];
  const isControlled = controls.length > 0;

  if (name === 'SWAP' && !isControlled) {
    const [q1, q2] = targets;
    if (q1 != null && q2 != null) {
      elements.push(<ControlLine key={`${key}-sl`} col={col} q1={q1} q2={q2} />);
      elements.push(<SwapX key={`${key}-sx1`} col={col} q={q1} />);
      elements.push(<SwapX key={`${key}-sx2`} col={col} q={q2} />);
    }
    return <g key={key}>{elements}</g>;
  }

  if (isControlled) {
    const allQ = [...controls, ...targets];
    const minQ = Math.min(...allQ);
    const maxQ = Math.max(...allQ);
    elements.push(<ControlLine key={`${key}-cl`} col={col} q1={minQ} q2={maxQ} />);
    controls.forEach((q, i) => elements.push(<ControlDot key={`${key}-cd-${i}`} col={col} q={q} />));

    if (name === 'CX' || name === 'CNOT' || name === 'CCX' || name === 'TOFFOLI') {
      targets.forEach((q, i) => elements.push(<CXTarget key={`${key}-ct-${i}`} col={col} q={q} />));
    } else if (name === 'CZ') {
      targets.forEach((q, i) => elements.push(<ControlDot key={`${key}-cz-${i}`} col={col} q={q} />));
    } else {
      const c = gateColor(name);
      targets.forEach((q, i) => (
        elements.push(
          <GateBox key={`${key}-gb-${i}`} col={col} q={q} label={name} fill={c.fill} textColor={c.text} />
        )
      ));
    }
    return <g key={key}>{elements}</g>;
  }

  const c = gateColor(name);
  let label = name;
  if (params && Object.keys(params).length > 0) {
    const angle = params.angle ?? params.theta;
    if (angle != null && Number.isFinite(Number(angle))) {
      const deg = ((Number(angle) * 180) / Math.PI).toFixed(0);
      label = `${name}(${deg}°)`;
    }
  }

  targets.forEach((q, i) =>
    elements.push(
      <GateBox
        key={`${key}-sg-${i}`}
        col={col}
        q={q}
        label={label}
        fill={c.fill}
        textColor={c.text}
        fontSize={label.length > 4 ? 9.5 : label.length > 2 ? 11 : 13.5}
      />
    )
  );
  return <g key={key}>{elements}</g>;
}

export default function CircuitDiagram({
  gates = [],
  num_qubits = 1,
  initial_state = null,
  width = '100%',
  title = 'Quantum Circuit Diagram',
}) {
  const { placed, totalCols } = useMemo(
    () => layoutGates(gates, num_qubits),
    [gates, num_qubits]
  );

  const initBits = useMemo(() => {
    const base = (initial_state || '0'.repeat(num_qubits)).padEnd(num_qubits, '0');
    return base.split('');
  }, [initial_state, num_qubits]);

  const svgWidth = Math.max(360, GATE_X_START + totalCols * GATE_X_SPACING + 40);
  const svgHeight = WIRE_Y_START + (num_qubits - 1) * WIRE_Y_SPACING + 44;

  return (
    <div
      style={{ width }}
      className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#080d1b] via-[#0c1428] to-[#080d1a] overflow-x-auto"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-white/5">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{title}</span>
        <span className="text-[11px] font-mono text-slate-400">
          {num_qubits}Q · {gates.length} gates · {totalCols} step{totalCols > 1 ? 's' : ''}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        className="block mx-auto my-1"
      >
        {/* Execution step headers */}
        {Array.from({ length: totalCols }, (_, col) => (
          <text
            key={`step-${col}`}
            x={gateX(col)}
            y={20}
            fill="rgba(148,163,184,0.55)"
            fontSize={10}
            fontFamily='"JetBrains Mono", monospace'
            textAnchor="middle"
          >
            t{col + 1}
          </text>
        ))}

        {Array.from({ length: num_qubits }, (_, q) => (
          <Wire key={`wire-${q}`} q={q} totalWidth={svgWidth} />
        ))}

        {Array.from({ length: num_qubits }, (_, q) => (
          <QubitLabel key={`ql-${q}`} q={q} initBit={initBits[q] || '0'} />
        ))}

        {placed.map((g, i) => renderGate(g, i))}
      </svg>
    </div>
  );
}
