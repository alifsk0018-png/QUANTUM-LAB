import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from '../ui/ErrorBoundary';

function complexMag([re, im]) {
  return Math.sqrt(re * re + im * im);
}

function complexPhase([re, im]) {
  return Math.atan2(im, re);
}

function basisLabel(index, numQubits) {
  return `|${index.toString(2).padStart(numQubits, '0')}⟩`;
}

function qspherePositions(numQubits) {
  const n = numQubits;
  const dim = 1 << n;
  const byWeight = {};

  for (let i = 0; i < dim; i++) {
    let w = 0;
    let v = i;
    while (v) {
      w += v & 1;
      v >>= 1;
    }
    if (!byWeight[w]) byWeight[w] = [];
    byWeight[w].push(i);
  }

  const positions = new Array(dim);
  for (let w = 0; w <= n; w++) {
    const group = byWeight[w] || [];
    const theta = n === 0 ? 0 : (w / n) * Math.PI;
    group.forEach((idx, k) => {
      const azimuth = group.length === 1 ? 0 : (2 * Math.PI * k) / group.length;
      positions[idx] = [
        Math.sin(theta) * Math.cos(azimuth),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(azimuth),
      ];
    });
  }
  return positions;
}

function phaseToColor(phaseRad) {
  const hue = ((phaseRad * 180) / Math.PI + 360) % 360;
  return `hsl(${hue}, 85%, 60%)`;
}

function WireframeSphereQ({ numQubits }) {
  const rings = useMemo(() => {
    const list = [];
    for (let w = 1; w < numQubits; w++) {
      const theta = (w / numQubits) * Math.PI;
      const r = Math.sin(theta);
      const y = Math.cos(theta);
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push([r * Math.cos(a), y, r * Math.sin(a)]);
      }
      list.push(pts);
    }
    return list;
  }, [numQubits]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#1e3a5f" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" wireframe transparent opacity={0.12} />
      </mesh>
      {rings.map((pts, idx) => (
        <Line key={idx} points={pts} color="#38bdf8" lineWidth={1} transparent opacity={0.28} />
      ))}
    </group>
  );
}

function StatePoint({ position, amplitude, phase, label, maxAmplitude, showLabel }) {
  const normalised = maxAmplitude > 0 ? amplitude / maxAmplitude : 0;
  const radius = 0.03 + normalised * 0.085;
  const color = phaseToColor(phase);

  if (amplitude < 1e-6) return null;

  return (
    <group>
      {/* Spoke from origin to state point */}
      <Line points={[[0, 0, 0], position]} color={color} lineWidth={1.8} transparent opacity={0.6} />

      <group position={position}>
        <mesh>
          <sphereGeometry args={[radius * 1.75, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} />
        </mesh>
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
        </mesh>
        {showLabel && (
          <Text position={[0, radius + 0.09, 0]} fontSize={0.085} color="#e2e8f0" anchorX="center" anchorY="bottom">
            {label}
          </Text>
        )}
      </group>
    </group>
  );
}

function QSphereScene({ statevector, numQubits }) {
  const positions = useMemo(() => qspherePositions(numQubits), [numQubits]);
  const amplitudes = useMemo(() => statevector.map((amp) => complexMag(amp)), [statevector]);
  const phases = useMemo(() => statevector.map((amp) => complexPhase(amp)), [statevector]);
  const maxAmp = useMemo(() => Math.max(...amplitudes, 1e-9), [amplitudes]);

  // Cap rendered 3D text labels to top 16 non-zero states to keep WebGL smooth on 6-8 qubit states
  const labeledIndices = useMemo(() => {
    const ranked = amplitudes
      .map((amp, idx) => ({ amp, idx }))
      .filter((item) => item.amp > 1e-6)
      .sort((a, b) => b.amp - a.amp)
      .slice(0, 16);
    return new Set(ranked.map((r) => r.idx));
  }, [amplitudes]);

  return (
    <>
      <ambientLight intensity={0.65} />
      <pointLight position={[5, 5, 5]} intensity={0.75} />

      <WireframeSphereQ numQubits={numQubits} />

      <Line points={[[0, -1.15, 0], [0, 1.15, 0]]} color="#34d399" lineWidth={1} transparent opacity={0.25} />
      <Line points={[[-1.15, 0, 0], [1.15, 0, 0]]} color="#f87171" lineWidth={1} transparent opacity={0.25} />
      <Line points={[[0, 0, -1.15], [0, 0, 1.15]]} color="#60a5fa" lineWidth={1} transparent opacity={0.25} />

      <Text position={[0, 1.24, 0]} fontSize={0.095} color="#34d399" anchorX="center" anchorY="bottom">
        |{'0'.repeat(numQubits)}⟩
      </Text>
      <Text position={[0, -1.24, 0]} fontSize={0.095} color="#34d399" anchorX="center" anchorY="top">
        |{'1'.repeat(numQubits)}⟩
      </Text>

      {statevector.map((amp, idx) => (
        <StatePoint
          key={idx}
          position={positions[idx]}
          amplitude={amplitudes[idx]}
          phase={phases[idx]}
          label={basisLabel(idx, numQubits)}
          maxAmplitude={maxAmp}
          showLabel={labeledIndices.has(idx)}
        />
      ))}

      <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={6} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export default function QSphere({
  statevector = [[1, 0], [0, 0]],
  numQubits = 1,
  width = '100%',
  height = '420px',
}) {
  const dim = 1 << numQubits;
  const sv = useMemo(() => {
    const arr = [...(statevector || [])];
    while (arr.length < dim) arr.push([0, 0]);
    return arr.slice(0, dim);
  }, [statevector, dim]);

  const stops = [0, 60, 120, 180, 240, 300];

  return (
    <div
      style={{ width }}
      className="relative rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#080d1b] via-[#0c1428] to-[#080d1a] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Q-Sphere (Multi-Qubit Amplitude & Phase)
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {numQubits}Q · {dim} states
        </span>
      </div>

      <div style={{ height }} className="relative w-full">
        <ErrorBoundary fallbackTitle="3D Q-Sphere Renderer Unavailable">
          <Canvas
            camera={{ position: [2.2, 1.8, 2.2], fov: 45 }}
            style={{ background: 'transparent' }}
            gl={{ antialias: true, alpha: true }}
          >
            <QSphereScene statevector={sv} numQubits={numQubits} />
          </Canvas>
        </ErrorBoundary>

        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-[#080d1b]/85 px-2.5 py-1.5 backdrop-blur-md">
          <span className="text-[10px] text-slate-400 mr-1">Phase</span>
          {stops.map((h) => (
            <span
              key={h}
              className="w-3 h-3 rounded-full inline-block"
              style={{ background: `hsl(${h}, 85%, 60%)` }}
              title={`${h}°`}
            />
          ))}
          <span className="text-[10px] font-mono text-slate-400 ml-1">0°–360°</span>
        </div>
      </div>
    </div>
  );
}
