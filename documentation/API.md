# QUANTUM LAB — REST API Reference

Base URL (local development): `http://127.0.0.1:8000`
Interactive OpenAPI / Swagger UI: `http://127.0.0.1:8000/docs`

---

## 1. System & Dashboard

### `GET /api/health`
Returns backend health, Qiskit / Qiskit Aer status, AI configuration status, and execution limits.

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "QUANTUM LAB Backend",
  "version": "1.0.0",
  "qiskit_version": "1.2.4",
  "aer_available": true,
  "ai_configured": false,
  "ai_provider": "gemini",
  "ai_model": "gemini-2.0-flash",
  "max_qubits": 8,
  "max_shots": 10000
}
```

### `GET /api/dashboard/summary`
Aggregates real database statistics (experiments, saved circuits, mastered lessons, passed quizzes, earned achievements) and recent activity items.

---

## 2. Quantum Simulation & Validation

### `GET /api/gates`
Returns metadata, descriptions, qubit arity, parameter names, and unitary matrices for all 14 supported gates (`I`, `X`, `Y`, `Z`, `H`, `S`, `T`, `RX`, `RY`, `RZ`, `CX`, `CZ`, `SWAP`, `CCX`).

### `POST /api/circuit/validate`
Validates a `CircuitConfig` without running a simulation.

**Request Body:**
```json
{
  "num_qubits": 2,
  "initial_state": "00",
  "gates": [
    { "gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {} },
    { "gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {} }
  ]
}
```

**Response `200 OK`:**
```json
{
  "valid": true,
  "errors": [],
  "num_qubits": 2,
  "gate_count": 2
}
```

### `POST /api/simulate`
Validates and simulates a quantum circuit using Qiskit (`ideal`) or Qiskit Aer (`noisy`).

**Request Body:**
```json
{
  "circuit": {
    "num_qubits": 2,
    "initial_state": "00",
    "gates": [
      { "gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {} },
      { "gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {} }
    ]
  },
  "simulation_mode": "ideal",
  "num_shots": 1024,
  "noise_params": {
    "gate_error": 0.01,
    "measurement_error": 0.01
  },
  "seed": 42
}
```

**Response `200 OK`:**
```json
{
  "statevector": [[0.70710678, 0.0], [0.0, 0.0], [0.0, 0.0], [0.70710678, 0.0]],
  "probabilities": { "00": 0.5, "11": 0.5 },
  "measurements": { "00": 518, "11": 506 },
  "circuit_depth": 2,
  "execution_time": 0.00412,
  "simulation_mode": "ideal",
  "num_qubits": 2,
  "gate_sequence": [
    { "gate": "H", "targets": [0], "controls": [], "parameters": {} },
    { "gate": "CX", "targets": [1], "controls": [0], "parameters": {} }
  ],
  "metadata": {
    "initial_state": "00",
    "num_shots": 1024,
    "backend": "qiskit.quantum_info.Statevector",
    "seed": 42,
    "is_hardware": false
  }
}
```

**Error Codes:**
- `400 Bad Request`: Invalid gate name, out-of-range qubit index, duplicate qubits, missing or non-finite rotation angle.
- `422 Unprocessable Entity`: Pydantic schema violation (`num_qubits` outside `1..8`, `num_shots` outside `1..10000`, `>200` gates).
- `429 Too Many Requests`: Sliding-window rate limit exceeded.

---

## 3. Persistent Experiments CRUD

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/experiments` | List saved experiments (`skip`, `limit` pagination) |
| `POST` | `/api/experiments` | Save a new experiment (`201 Created`) |
| `GET` | `/api/experiments/{id}` | Retrieve a single experiment (`404` if missing) |
| `PUT` | `/api/experiments/{id}` | Rename, update description, notes, or results |
| `DELETE` | `/api/experiments/{id}` | Permanently delete an experiment |
| `GET` | `/api/experiments/stats` | Aggregated counts and averages across stored experiments |

---

## 4. Learning Academy & Quizzes

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/learning` | List all 3 curriculum modules (`beginner`, `intermediate`, `advanced`) and lessons |
| `GET` | `/api/learning/{module_id}` | Get one module |
| `GET` | `/api/learning/{module_id}/lessons/{lesson_id}` | Get one lesson |
| `POST` | `/api/learning/{module_id}/lessons/{lesson_id}/visit` | Record lesson visit (does not mark quiz lessons completed) |
| `GET` | `/api/learning/progress` | Retrieve per-lesson completion status, scores, earned badges, and stats |
| `POST` | `/api/quiz/submit` | Grade quiz answers (`{ module_id, quiz_id, answers }`), persist attempt, update mastery & badges |

---

## 5. Q-ASSIST AI Tutor

### `POST /api/tutor/explain` & `POST /api/tutor/chat`

**Request Body:**
```json
{
  "message": "Explain my circuit and simulation output",
  "context_type": "circuit",
  "circuit_config": { "num_qubits": 1, "gates": [{ "gate_name": "H", "target_qubits": [0] }] },
  "simulation_results": null,
  "level": "beginner",
  "conversation_history": []
}
```

**Response `200 OK`:**
```json
{
  "explanation": "...",
  "is_ai_generated": false,
  "suggestions": ["Debug my circuit for mistakes or cancellations"],
  "level": "beginner"
}
```
`is_ai_generated` is `true` only when a configured LLM API responds successfully; otherwise `false` indicates the verified educational fallback was used.
