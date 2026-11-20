# QUANTUM LAB — System Architecture

## Overview

**QUANTUM LAB** is a full-stack, AI-assisted quantum computing education and simulation workbench designed around a strict separation between interactive UI state, deterministic quantum physics simulation, persistent storage, and optional LLM explanation services.

```
┌──────────────────────────────────────────────────────────────────────┐
│                   React 18 + Vite Frontend (SPA)                     │
│  Tailwind CSS · React Router · Plotly.js · Three.js (@react-three)   │
│                                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐               │
│  │ QuantumContext│  │ ThemeContext  │  │ API Service  │               │
│  │ (Circuit+Undo)│  │ (Dark/Light + │  │ (Axios REST) │               │
│  └──────┬───────┘  │ Guest Profile)│  └──────┬───────┘               │
└─────────┼──────────┴───────────────┴─────────┼───────────────────────┘
          │                                    │ HTTP / JSON (/api/*)
┌─────────▼────────────────────────────────────▼───────────────────────┐
│                      FastAPI Backend (Python 3.11)                   │
│  Pydantic v2 Validation · Body Size Guard · Rate Limiter · CORS      │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Simulation  │  │ Experiments  │  │  Learning    │  │ Q-ASSIST  │ │
│  │   Router    │  │   Router     │  │   Router     │  │  Router   │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                │                 │                │       │
│  ┌──────▼──────┐  ┌──────▼─────────────────▼─────┐    ┌─────▼─────┐ │
│  │ Qiskit 1.2  │  │   SQLAlchemy 2.0 ORM Layer   │    │ AI Service│ │
│  │ Statevector │  │   SQLite (Default) ->        │    │ Gemini /  │ │
│  │ & Aer Noise │  │   PostgreSQL Ready           │    │ OpenAI /  │ │
│  └─────────────┘  └──────────────────────────────┘    │ Anthropic │ │
└───────────────────────────────────────────────────────┴───────────┘
```

---

## 1. Frontend Architecture (`frontend/`)

- **Framework**: React 18 with Vite 5 and React Router v6 across 10 routes (`Dashboard`, `Quantum Laboratory`, `Circuit Builder`, `Quantum Experiments`, `Quantum Visualizer`, `AI Quantum Tutor`, `Learning Academy`, `Research Workspace`, `Saved Experiments`, `Profile & Settings`).
- **State Management**:
  - `QuantumContext`: Maintains the canonical structured circuit (`num_qubits`, `initial_state`, `gates`), a 50-step Undo/Redo history stack, simulation configuration (`simulation_mode`, `num_shots`, `noise_params`, `seed`), latest Qiskit simulation output, live backend validation results, health telemetry, and activity notifications.
  - `ThemeContext`: Persists dark/light scientific laboratory mode and Local Guest Mode preferences in `localStorage`.
- **Scientific Visualizations**:
  - `BlochSphere.jsx` (`Three.js` / `@react-three/fiber`): Computes pure Bloch coordinates for 1-qubit states and exact partial-trace reduced density matrices $\rho_k = \mathrm{Tr}_{\neq k}(|\psi\rangle\langle\psi|)$ for multi-qubit states. Explicitly warns users when reduced purity $P < 1$ due to entanglement.
  - `QSphere.jsx` (`Three.js`): Maps basis states across Hamming-weight latitudes, scaling radius by amplitude magnitude $|\psi_x|$ and coloring nodes by relative phase $\arg(\psi_x)$.
  - `MeasurementHistogram.jsx` (`Plotly.js`): Renders shot counts, probability percentages, and side-by-side Ideal-vs-Measured comparisons with Total Variation Distance (TVD).
  - `StatevectorDisplay.jsx`: Displays complex amplitudes, magnitudes, phases, probabilities, and Dirac ket notation.
  - `CircuitDiagram.jsx`: Responsive SVG circuit renderer supporting initial basis chips, single-qubit gates, parametric rotations, control dots, CNOT/Toffoli targets, and SWAP gates.

---

## 2. Backend & Simulation Engine (`backend/`)

- **No Arbitrary Code Execution**: Circuits are represented strictly as validated JSON (`CircuitConfig` Pydantic model: `1..8` qubits, `<= 200` gates, finite numeric parameters). The backend never executes user-supplied Python strings.
- **Modular Simulation Engine (`app/quantum/simulator.py`)**:
  - **Ideal Mode**: Constructs a `qiskit.QuantumCircuit`, computes exact complex amplitudes with `qiskit.quantum_info.Statevector.from_instruction(qc)`, derives theoretical probabilities, and samples `num_shots` outcomes (supporting optional `seed`).
  - **Noisy Mode**: Builds a `qiskit_aer.noise.NoiseModel` with configurable single-, two-, and three-qubit depolarizing gate errors (`cx`, `cz`, `swap`, `ccx`, etc.) plus symmetric readout errors (`ReadoutError`), runs `AerSimulator`, and returns empirical counts alongside ideal theoretical probabilities for comparison.

---

## 3. Database Layer & PostgreSQL Migration Path

- `app/database/database.py` reads `DATABASE_URL` from environment variables (defaulting to `sqlite:///./quantum_lab.db`).
- `app/database/models.py` uses portable SQLAlchemy 2.0 column types (`Integer`, `String`, `Text`, `Boolean`, `Float`, `DateTime`) across 4 tables: `experiments`, `learning_progress`, `quiz_results`, and `achievements`.
- Migrating to PostgreSQL requires only installing `psycopg2-binary` (or `psycopg`) and updating `DATABASE_URL` in `backend/.env` (e.g., `postgresql+psycopg2://user:password@host:5432/quantum_lab`).

---

## 4. Q-ASSIST AI Service & Scientific Integrity

- `app/services/ai_service.py` keeps API keys strictly server-side (`AI_API_KEY`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_URL`) and supports `gemini`, `openai` (or OpenAI-compatible endpoints), and `anthropic`.
- System prompts enforce scientific honesty: distinguish mathematical facts from analogies, cite only verified Qiskit simulator outputs, and never claim software simulations ran on physical quantum hardware.
- If `AI_API_KEY` is omitted or an external request fails, Q-ASSIST automatically returns clearly labelled deterministic educational analysis (`is_ai_generated: false`) based on per-qubit circuit diagnostics and verified simulator statistics.

---

## 5. Security & Reliability Controls

- **Pydantic v2 Schema Validation**: Rejects invalid qubit counts (`<1` or `>8`), invalid shot counts (`<1` or `>10000`), oversized gate sequences (`>200`), and `NaN`/`Infinity` angles.
- **Middleware (`app/main.py`)**: Enforces `MAX_REQUEST_BODY_BYTES` (default 2 MB) and per-IP sliding-window rate limiting (`RATE_LIMIT_PER_MIN`, default 120 req/min) on `/api/simulate`, `/api/tutor/explain`, and `/api/tutor/chat`.
- **CORS**: Restricted to origins specified in `CORS_ORIGINS`.
