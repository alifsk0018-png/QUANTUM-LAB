# QUANTUM LAB — User Guide

Welcome to **QUANTUM LAB** (*Explore. Experiment. Understand. Innovate.*).

---

## 1. Navigation Overview

Use the collapsible left sidebar to switch between all 10 workspaces:
1. **Dashboard** — Real-time stats from your SQLite database, recent experiments, learning progress, and shortcuts.
2. **Quantum Laboratory** — Configure qubit counts (`1–8`), initialize `|0⟩`/`|1⟩` basis states, apply gates, inspect gate math, and simulate.
3. **Circuit Builder** — Visual drag-and-drop gate editor with Undo/Redo, JSON export, and OpenQASM 2.0 preview.
4. **Quantum Experiments** — 5 guided physics & algorithm experiments with step-by-step procedures and Q-ASSIST explanations.
5. **Quantum Visualizer** — Multi-panel 3D Bloch Sphere, Q-Sphere, Measurement Histogram, and Statevector amplitude table.
6. **AI Quantum Tutor (Q-ASSIST)** — Conversational guide with Beginner / Intermediate / Advanced explanations grounded in your actual circuit and simulator data.
7. **Learning Academy** — Structured 3-level curriculum with interactive circuits, graded quizzes, and achievement badges.
8. **Research Workspace** — Reproducible runs with random seeds, side-by-side distribution comparison, lab notes, and JSON / CSV / PDF report export.
9. **Saved Experiments** — Manage, rename, annotate, export, delete, or reopen saved circuits.
10. **Profile & Settings** — Local Guest Mode profile, Dark/Light theme toggle, and live Qiskit backend diagnostics.

---

## 2. Understanding Qiskit Conventions

- **Little-Endian Bitstring Ordering**: In Qiskit, `q0` is the **rightmost** bit and `q(n-1)` is the **leftmost** bit (`|q_{n-1} ... q_1 q_0⟩`). For example, initializing `q0 = |1⟩, q1 = |0⟩` displays as `|01⟩`.
- **Bloch Sphere for Multi-Qubit States**: A single-qubit Bloch sphere can only show a single qubit's reduced state $\rho_{q_k}$. When qubits are entangled (for example in a Bell state), each qubit's Bloch vector shrinks to the center (`Purity = 0.5`). QUANTUM LAB explicitly notifies you when entanglement occurs and provides the **Q-Sphere** and **Statevector** views to inspect correlations and relative phases.

---

## 3. Ideal vs. Noisy Simulation Modes

- **Ideal Mode**: Computes exact complex statevectors and exact theoretical probabilities, then samples finite measurement shots.
- **Noisy Mode**: Uses Qiskit Aer's `NoiseModel` with configurable **Gate Depolarizing Error** and **Readout Measurement Error** sliders. Switch to the **Compare Ideal** tab in the histogram to see how noise leaks probability into unintended basis states and increases Total Variation Distance (TVD).

---

## 4. Configuring Optional Live AI (Q-ASSIST)

QUANTUM LAB works out of the box without an API key by using deterministic circuit diagnostics and verified simulator summaries. To enable live LLM explanations:
1. Copy `backend/.env.example` to `backend/.env`.
2. Set `AI_PROVIDER` (`gemini`, `openai`, or `anthropic`) and `AI_API_KEY`.
3. Restart the FastAPI server and verify `Q-ASSIST: Live` appears in the Dashboard / Settings diagnostics.
