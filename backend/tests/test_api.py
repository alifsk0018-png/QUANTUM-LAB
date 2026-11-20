"""Integration tests for QUANTUM LAB FastAPI endpoints and persistent storage."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.database import get_db
from app.database.models import Base


@pytest.fixture(scope="module")
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    # Prevent lifespan from creating quantum_lab.db on disk during unit tests
    import app.main as main_mod
    original_create_tables = main_mod.create_tables
    main_mod.create_tables = lambda: Base.metadata.create_all(bind=test_engine)

    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()
        main_mod.create_tables = original_create_tables


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert "qiskit_version" in body
    assert "ai_provider" in body


def test_list_gates_endpoint(client):
    res = client.get("/api/gates")
    assert res.status_code == 200
    gates = res.json()["gates"]
    for name in ("I", "X", "Y", "Z", "H", "S", "T", "RX", "RY", "RZ", "CX", "CZ", "SWAP", "CCX"):
        assert name in gates


def test_simulate_bell_state_api(client):
    payload = {
        "circuit": {
            "num_qubits": 2,
            "gates": [
                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                {"gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
            ],
        },
        "simulation_mode": "ideal",
        "num_shots": 1024,
        "seed": 42,
    }
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert abs(data["probabilities"]["00"] - 0.5) < 1e-6
    assert abs(data["probabilities"]["11"] - 0.5) < 1e-6
    assert sum(data["measurements"].values()) == 1024


def test_simulate_rejects_missing_rotation_param(client):
    payload = {
        "circuit": {
            "num_qubits": 1,
            "gates": [{"gate_name": "RX", "target_qubits": [0], "control_qubits": [], "parameters": {}}],
        },
        "simulation_mode": "ideal",
        "num_shots": 128,
    }
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 400


def test_validate_valid_and_invalid_circuits(client):
    valid_res = client.post(
        "/api/circuit/validate",
        json={"num_qubits": 2, "gates": [{"gate_name": "H", "target_qubits": [0]}]},
    )
    assert valid_res.status_code == 200
    assert valid_res.json()["valid"] is True

    invalid_res = client.post(
        "/api/circuit/validate",
        json={"num_qubits": 1, "gates": [{"gate_name": "CX", "control_qubits": [0], "target_qubits": [1]}]},
    )
    assert invalid_res.status_code == 200
    assert invalid_res.json()["valid"] is False
    assert len(invalid_res.json()["errors"]) > 0


def test_experiment_crud_lifecycle(client):
    create_payload = {
        "name": "Bell State Test Experiment",
        "description": "Automated API test experiment",
        "circuit_config": {
            "num_qubits": 2,
            "gates": [
                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                {"gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
            ],
        },
        "num_qubits": 2,
        "simulation_mode": "ideal",
        "num_shots": 1024,
        "notes": "Initial test note",
    }
    create_res = client.post("/api/experiments", json=create_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    exp_id = created["id"]
    assert created["name"] == "Bell State Test Experiment"
    assert created["gate_count"] == 2

    # Get single
    get_res = client.get(f"/api/experiments/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == exp_id

    # Update
    upd_res = client.put(f"/api/experiments/{exp_id}", json={"name": "Renamed Bell Experiment", "notes": "Updated"})
    assert upd_res.status_code == 200
    assert upd_res.json()["name"] == "Renamed Bell Experiment"

    # List
    list_res = client.get("/api/experiments")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # Delete
    del_res = client.delete(f"/api/experiments/{exp_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

    # Confirm 404 after delete
    missing = client.get(f"/api/experiments/{exp_id}")
    assert missing.status_code == 404


def test_learning_quiz_progress_and_dashboard_summary(client):
    mods = client.get("/api/learning")
    assert mods.status_code == 200
    modules = mods.json()["modules"]
    assert len(modules) == 3
    # Advanced module has 5 distinct lessons (including separate Noise and QEC)
    assert len(modules[2]["lessons"]) == 5

    # Visiting a lesson with a quiz must NOT falsely mark it completed
    visit_res = client.post("/api/learning/beginner/lessons/intro-quantum-computing/visit")
    assert visit_res.status_code == 200
    assert visit_res.json()["completed"] is False

    quiz_res = client.post(
        "/api/quiz/submit",
        json={"module_id": "beginner", "quiz_id": "quiz-intro-qc", "answers": {"q1": 2, "q2": 0}},
    )
    assert quiz_res.status_code == 200
    assert quiz_res.json()["passed"] is True
    assert quiz_res.json()["score"] == 2

    prog_res = client.get("/api/learning/progress")
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert prog_data["stats"]["completed_lessons"] >= 1
    assert prog_data["stats"]["challenges_completed"] >= 1
    assert len(prog_data["achievements"]) >= 1

    summary_res = client.get("/api/dashboard/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["stats"]["completed_lessons"] >= 1
    assert len(summary["recent_activity"]) >= 1


def test_tutor_explain_fallback(client):
    res = client.post(
        "/api/tutor/explain",
        json={
            "message": "Debug my circuit",
            "context_type": "circuit",
            "level": "beginner",
            "circuit_config": {
                "num_qubits": 2,
                "gates": [
                    {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                    {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                ],
            },
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert "explanation" in body
    assert body["is_ai_generated"] is False
    assert "cancel out" in body["explanation"]
