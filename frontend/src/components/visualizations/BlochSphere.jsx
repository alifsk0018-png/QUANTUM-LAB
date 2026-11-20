import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { AlertTriangle } from 'lucide-react';
import ErrorBoundary from '../ui/ErrorBoundary';

/* ------------------------------------------------------------------ */
/*  Quantum math helpers (pure & partial-trace reduced states)        */
/* ------------------------------------------------------------------ */

/**
 * Compute reduced single-qubit Bloch vector (rx, ry, rz), purity, and
 * single-qubit angles for qubit `qubitIndex` from a 2^N statevector.
 * Bit `q` in index `i` follows Qiskit little-endian ordering: (i >> q) & 1.
 */
function computeQubitBlochData(statevector, qubitIndex) {
  const len = Array.isArray(statevector) ? statevector.length : 0;
  if (len < 2) {
    return { rx: 0, ry: 0, rz: 1, norm: 1, purity: 1, theta: 0, phi: 0, isEntangled: false };
  }

  let rho00 = 0;
  let rho11 = 0;
  let rho01Re = 0;
  let rho01Im = 0;

  const mask = 1 << qubitIndex;
  for (let i = 0; i < len; i++) {
    if ((i & mask) !== 0) continue;
    const j = i | mask;
    const [aRe = 0, aIm = 0] = statevector[i] || [0, 0];
    const [bRe = 0, bIm = 0] = statevector[j] || [0, 0];

    rho00 += aRe * aRe + aIm * aIm;
    rho11 += bRe * bRe + bIm * bIm;
    // c_i * conj(c_j) = (aRe + i aIm)(bRe - i bIm)
    rho01Re += aRe * bRe + aIm * bIm;
    rho01Im += aIm * bRe - aRe * bIm;
  }

  const rx = 2 * rho01Re;
  const ry = -2 * rho01Im;
  const rz = rho00 - rho11;
  const normSq = Math.min(1, Math.max(0, rx * rx + ry * ry + rz * rz));
  const norm = Math.sqrt(normSq);
  const purity = 0.5 * (1 + normSq);

  // Polar & azimuthal angles of the Bloch vector
  const theta = norm > 1e-6 ? Math.acos(Math.min(1, Math.max(-1, rz / norm))) : 0;
  let phi = norm > 1e-6 && Math.hypot(rx, ry) > 1e-6 ? Math.atan2(ry, rx) : 0;
  if (phi < 0) phi += 2 * Math.PI;

  const numQubits = Math.max(1, Math.round(Math.log2(len)));
  const isEntangled = numQubits > 1 && purity < 0.995;

  return { rx, ry, rz, norm, purity, theta, phi, isEntangled };
}

/* ------------------------------------------------------------------ */
/*  3D Scene sub-components                                           */
/* ------------------------------------------------------------------ */

function Axis({ start, end, color, label, labelPos }) {
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1.5} transparent opacity={0.7} />
      <Text
        position={labelPos}
        fontSize={0.14}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function StateLabel({ position, label, color = '#e0e0e0' }) {
  return (
    <Text
      position={position}
      fontSize={0.13}
      color={color}
      anchorX="center"
      anchorY="middle"
    >
      {label}
    </Text>
  );
}

function StateArrow({ blochThreeVec, norm }) {
  const arrowData = useMemo(() => {
    const [tx, ty, tz] = blochThreeVec;
    const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
    if (len < 1e-4) return null;

    const dir = new THREE.Vector3(tx, ty, tz).normalize();
    const coneLen = Math.min(0.16, len * 0.35);
    const shaftLen = Math.max(0, len - coneLen * 0.5);
    const shaftEnd = dir.clone().multiplyScalar(shaftLen);
    const conePos = dir.clone().multiplyScalar(Math.max(0, len - coneLen * 0.5));
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    return { shaftEnd: shaftEnd.toArray(), conePos: conePos.toArray(), quat, coneLen, len };
  }, [blochThreeVec]);

  if (!arrowData) {
    // Mixed maximally-entangled center dot
    return (
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.65} />
      </mesh>
    );
  }

  const arrowColor = norm > 0.99 ? '#22d3ee' : '#f59e0b';

  return (
    <group>
      <Line points={[[0, 0, 0], arrowData.shaftEnd]} color={arrowColor} lineWidth={3.5} />
      <mesh position={arrowData.conePos} quaternion={arrowData.quat}>
        <coneGeometry args={[0.055, arrowData.coneLen, 16]} />
        <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={arrowColor} />
      </mesh>
    </group>
  );
}

function WireframeSphereGroup() {
  const equatorPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(a), 0, Math.sin(a)]);
    }
    return pts;
  }, []);

  const meridianPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([Math.cos(a), Math.sin(a), 0]);
    }
    return pts;
  }, []);

  const meridian2Points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push([0, Math.sin(a), Math.cos(a)]);
    }
    return pts;
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#1e3a5f" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" wireframe transparent opacity={0.14} />
      </mesh>
      <Line points={equatorPoints} color="#38bdf8" lineWidth={1} transparent opacity={0.35} />
      <Line points={meridianPoints} color="#38bdf8" lineWidth={1} transparent opacity={0.22} />
      <Line points={meridian2Points} color="#38bdf8" lineWidth={1} transparent opacity={0.22} />
    </group>
  );
}

function BlochScene({ blochThreeVec, norm }) {
  // Right-handed isometric orientation matching Qiskit:
  // math +X (|+⟩) -> three +Z, math +Y (|+i⟩) -> three +X, math +Z (|0⟩) -> three +Y
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 5, 5]} intensity={0.85} />

      <WireframeSphereGroup />

      <Axis start={[0, 0, -1.25]} end={[0, 0, 1.25]} color="#f87171" label="X" labelPos={[0, 0, 1.4]} />
      <Axis start={[-1.25, 0, 0]} end={[1.25, 0, 0]} color="#60a5fa" label="Y" labelPos={[1.4, 0, 0]} />
      <Axis start={[0, -1.25, 0]} end={[0, 1.25, 0]} color="#34d399" label="Z" labelPos={[0, 1.4, 0]} />

      <StateLabel position={[0, 1.18, 0]} label="|0⟩" color="#34d399" />
      <StateLabel position={[0, -1.18, 0]} label="|1⟩" color="#34d399" />
      <StateLabel position={[0, 0, 1.18]} label="|+⟩" color="#f87171" />
      <StateLabel position={[0, 0, -1.18]} label="|−⟩" color="#f87171" />
      <StateLabel position={[1.18, 0, 0]} label="|+i⟩" color="#60a5fa" />
      <StateLabel position={[-1.18, 0, 0]} label="|−i⟩" color="#60a5fa" />

      <StateArrow blochThreeVec={blochThreeVec} norm={norm} />

      <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={5.5} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                           */
/* ------------------------------------------------------------------ */

export default function BlochSphere({
  statevector = [[1, 0], [0, 0]],
  numQubits: numQubitsProp = null,
  width = '100%',
  height = '400px',
}) {
  const numQubits = useMemo(() => {
    if (numQubitsProp) return numQubitsProp;
    if (!statevector || statevector.length < 2) return 1;
    return Math.max(1, Math.round(Math.log2(statevector.length)));
  }, [numQubitsProp, statevector]);

  const [selectedQubit, setSelectedQubit] = useState(0);

  useEffect(() => {
    if (selectedQubit >= numQubits) {
      setSelectedQubit(0);
    }
  }, [numQubits, selectedQubit]);

  const bloch = useMemo(
    () => computeQubitBlochData(statevector, selectedQubit),
    [statevector, selectedQubit]
  );

  // Map math (rx, ry, rz) -> right-handed Three.js (ry, rz, rx)
  const blochThreeVec = useMemo(() => [bloch.ry, bloch.rz, bloch.rx], [bloch]);

  const thetaDeg = ((bloch.theta * 180) / Math.PI).toFixed(1);
  const phiDeg = ((bloch.phi * 180) / Math.PI).toFixed(1);

  return (
    <div
      style={{ width }}
      className="relative rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#080d1b] via-[#0c1428] to-[#080d1a] overflow-hidden"
    >
      {/* Header & Multi-Qubit Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2 border-b border-white/5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Bloch Sphere {numQubits > 1 ? `(Reduced q${selectedQubit})` : '(Single Qubit)'}
          </span>
        </div>

        {numQubits > 1 && (
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: numQubits }, (_, q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQubit(q)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                  selectedQubit === q
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                q{q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Honest scientific notice when qubit is entangled */}
      {bloch.isEntangled && (
        <div className="mx-3 mt-2.5 flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            <strong>Entangled Multi-Qubit State</strong> (Purity = {bloch.purity.toFixed(3)}, |r| ={' '}
            {bloch.norm.toFixed(3)}): Displaying the partial-trace reduced state of{' '}
            <code className="font-mono">q{selectedQubit}</code>. A single-qubit Bloch sphere cannot
            represent cross-qubit correlations — inspect the <strong>Q-Sphere</strong> or{' '}
            <strong>Statevector</strong> for the complete state.
          </span>
        </div>
      )}

      {/* 3D Canvas */}
      <div style={{ height }} className="relative w-full">
        <ErrorBoundary fallbackTitle="3D Bloch Sphere Renderer Unavailable">
          <Canvas
            camera={{ position: [2.35, 1.75, 2.35], fov: 44 }}
            style={{ background: 'transparent' }}
            gl={{ antialias: true, alpha: true }}
          >
            <BlochScene blochThreeVec={blochThreeVec} norm={bloch.norm} />
          </Canvas>
        </ErrorBoundary>

        {/* Bottom-left coordinate telemetry */}
        <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-cyan-500/30 bg-[#080d1b]/85 px-3 py-2 text-xs font-mono text-slate-200 backdrop-blur-md space-y-0.5">
          <div>
            <span className="text-cyan-400">θ</span> = {bloch.norm < 1e-4 ? '— (mixed)' : `${thetaDeg}°`}{' '}
            <span className="text-slate-400 ml-1">
              {bloch.norm >= 1e-4 && `(${bloch.theta.toFixed(3)} rad)`}
            </span>
          </div>
          <div>
            <span className="text-cyan-400">φ</span> = {bloch.norm < 1e-4 ? '— (mixed)' : `${phiDeg}°`}{' '}
            <span className="text-slate-400 ml-1">
              {bloch.norm >= 1e-4 && `(${bloch.phi.toFixed(3)} rad)`}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-0.5 border-t border-white/10">
            r = ({bloch.rx.toFixed(2)}, {bloch.ry.toFixed(2)}, {bloch.rz.toFixed(2)}) · Purity{' '}
            {bloch.purity.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
