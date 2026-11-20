<h1 align="center">QUANTUM LAB</h1>

<p align="center">
  <strong>Explore. Experiment. Understand. Innovate.</strong><br/>
  AI-Powered Interactive Quantum Computing Laboratory built with React, FastAPI, IBM Qiskit &amp; Three.js.
</p>

---

## Overview

**QUANTUM LAB** is an interactive virtual quantum laboratory designed for engineering and computer science students, university educators, quantum beginners, and researchers. Users can visually construct multi-qubit circuits, execute genuine Qiskit statevector and noisy Aer simulations, explore interactive 3D Bloch &amp; Q-Sphere state visualizations, test their knowledge in a structured Learning Academy, manage reproducible experiments in SQLite, and ask **Q-ASSIST** for grounded explanations.

---

## Features

- **Dashboard**: Real database-driven statistics (`Total Experiments`, `Saved Circuits`, `Completed Lessons`, `Challenges Completed`), recent activity feed, learning progress, and quick experiment shortcuts.
- **Quantum Laboratory**: Configure 1–8 qubits, toggle initial basis states (`|0⟩`/`|1⟩`), apply 14 single- and multi-qubit gates (`I`, `X`, `Y`, `Z`, `H`, `S`, `T`, `RX`, `RY`, `RZ`, `CX`, `CZ`, `SWAP`, `CCX`), inspect unitary matrices, validate circuits, and execute Ideal or Noisy simulations.
- **Visual Drag-and-Drop Circuit Builder**: Drag gates onto qubit wires, reorder steps, configure control/target wires and rotation angles, Undo/Redo edits, inspect structured JSON &amp; OpenQASM 2.0 previews, and export `.json` circuits.
- **Quantum Experiments Library**: 5 guided interactive experiments — *Superposition*, *Quantum Entanglement (Bell State)*, *Quantum Teleportation (3Q)*, *Quantum Interference (H·Z·H)*, and *Grover's Search (with classical baseline comparison)*.
- **Quantum Visualization Engine**:
  - **3D Bloch Sphere** (Three.js) with partial-trace reduced density matrix calculation for multi-qubit states and explicit entanglement warnings.
  - **3D Q-Sphere** (Three.js) showing amplitudes and relative phases across Hamming-weight latitudes.
  - **Measurement Histogram** (Plotly.js) with Counts, Probability %, and Compare Ideal views + Total Variation Distance.
  - **Statevector Viewer** showing complex amplitudes, magnitude, phase, probabilities, and Dirac ket notation.
- **AI Quantum Tutor (Q-ASSIST)**: Beginner, Intermediate, and Advanced explanations with Quick Actions (*Explain My Circuit*, *Explain My Results*, *What Is Superposition?*, *How Does Entanglement Work?*, *Suggest an Experiment*, *Debug My Circuit*) and a clearly labelled non-AI educational fallback when no LLM API key is configured.
- **Learning Academy**: 3 progressive curriculum levels (Beginner, Intermediate, Advanced) with interactive circuit blocks, database-graded quizzes, and achievement badges.
- **Research Workspace &amp; Saved Experiments**: Reproducible random seeds, side-by-side distribution comparisons, persistent notes, and **JSON / CSV / PDF Report** exports backed by SQLite (migration-ready for PostgreSQL).

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router v6, Lucide React, Plotly.js, Three.js (`@react-three/fiber`, `@react-three/drei`), Axios |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic v2, HTTPX |
| **Quantum Engine** | IBM Qiskit 1.2 (`Statevector`, `QuantumCircuit`), Qiskit Aer 0.15 (`AerSimulator`, `NoiseModel`) |
| **Database** | SQLite via SQLAlchemy 2.0 (configurable `DATABASE_URL` for PostgreSQL migration) |
| **AI Tutor** | Configurable backend LLM provider (`gemini`, `openai`, `anthropic`) + deterministic educational fallback |

---

## Installation &amp; Running Locally

### Prerequisites
- **Python 3.11** (recommended for Qiskit 1.2 / Qiskit Aer 0.15 binary wheels)
- **Node.js 18+ LTS** and **npm**
- **Git**

### 1. Backend Setup (`backend/`)

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Verify the backend health endpoint:
```bash
curl http://127.0.0.1:8000/api/health
```

### 2. Frontend Setup (`frontend/`)

Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser. Vite automatically proxies `/api/*` requests to `http://127.0.0.1:8000`.

---

## Optional AI Configuration (`backend/.env`)

No API key is required to run QUANTUM LAB — Q-ASSIST automatically operates in **Educational Reference Fallback** mode using deterministic circuit diagnostics and verified simulator outputs when `AI_API_KEY` is blank.

To enable live LLM responses, edit `backend/.env`:
```env
AI_PROVIDER=gemini          # gemini | openai | anthropic
AI_API_KEY=your-secret-key
AI_MODEL=gemini-2.0-flash
```
API keys are read strictly on the backend and are never exposed to frontend JavaScript.

---

## Testing

Run the Qiskit simulator unit tests and FastAPI integration tests:
```bash
cd backend
pytest tests/ -v
```

Build the frontend production bundle:
```bash
cd frontend
npm run build
```

---

## Deployment &amp; PostgreSQL Migration Notes

1. **Frontend Production Build**: Run `npm run build` in `frontend/` to generate `frontend/dist/`, which can be served via Nginx, Vercel, Netlify, or static hosting with `/api` proxied to FastAPI (or set `VITE_API_URL` at build time).
2. **Backend Production Server**: Run `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`.
3. **PostgreSQL Migration**: Install `psycopg2-binary` in your backend environment and set `DATABASE_URL=postgresql+psycopg2://user:password@host:5432/quantum_lab` in `backend/.env`. SQLAlchemy will automatically initialize the `experiments`, `learning_progress`, `quiz_results`, and `achievements` tables on startup.

---

## Documentation

- [System Architecture](documentation/architecture.md)
- [REST API Reference](documentation/API.md)
- [User Guide](documentation/user-guide.md)
