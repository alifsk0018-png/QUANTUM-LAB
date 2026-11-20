"""Experiment CRUD service layer."""

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database.models import Experiment
from ..schemas.experiment import ExperimentCreate, ExperimentUpdate


def create_experiment(db: Session, data: ExperimentCreate) -> Experiment:
    """Persist a new experiment."""
    circuit_config_str = json.dumps(data.circuit_config)
    gate_count = len(data.circuit_config.get("gates", []))
    results_str = json.dumps(data.results) if data.results else None

    experiment = Experiment(
        name=data.name,
        description=data.description,
        circuit_config=circuit_config_str,
        num_qubits=data.num_qubits,
        gate_count=gate_count,
        simulation_mode=data.simulation_mode,
        num_shots=data.num_shots,
        results=results_str,
        notes=data.notes,
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    return experiment


def get_experiments(
    db: Session, skip: int = 0, limit: int = 50
) -> tuple[list[Experiment], int]:
    """Return a paginated list and total count."""
    total = db.query(func.count(Experiment.id)).scalar() or 0
    experiments = (
        db.query(Experiment)
        .order_by(Experiment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return experiments, total


def get_experiment(db: Session, experiment_id: int) -> Optional[Experiment]:
    """Fetch a single experiment by id."""
    return db.query(Experiment).filter(Experiment.id == experiment_id).first()


def update_experiment(
    db: Session, experiment_id: int, data: ExperimentUpdate
) -> Optional[Experiment]:
    """Partial-update an experiment. Returns None if not found."""
    experiment = get_experiment(db, experiment_id)
    if experiment is None:
        return None

    update_data = data.model_dump(exclude_unset=True)

    if "results" in update_data and update_data["results"] is not None:
        update_data["results"] = json.dumps(update_data["results"])
    elif "results" in update_data and update_data["results"] is None:
        update_data["results"] = None

    for field, value in update_data.items():
        setattr(experiment, field, value)

    experiment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(experiment)
    return experiment


def delete_experiment(db: Session, experiment_id: int) -> bool:
    """Delete an experiment. Returns True if deleted, False if not found."""
    experiment = get_experiment(db, experiment_id)
    if experiment is None:
        return False
    db.delete(experiment)
    db.commit()
    return True


def get_experiment_stats(db: Session) -> dict:
    """Aggregate statistics across all experiments."""
    total = db.query(func.count(Experiment.id)).scalar() or 0
    total_qubits = db.query(func.sum(Experiment.num_qubits)).scalar() or 0
    total_gates = db.query(func.sum(Experiment.gate_count)).scalar() or 0
    avg_qubits = db.query(func.avg(Experiment.num_qubits)).scalar() or 0
    avg_gates = db.query(func.avg(Experiment.gate_count)).scalar() or 0

    mode_counts: dict[str, int] = {}
    modes = db.query(Experiment.simulation_mode).all()
    for (m,) in modes:
        mode_counts[m] = mode_counts.get(m, 0) + 1

    return {
        "total_experiments": total,
        "total_circuits": total,
        "total_qubits_used": int(total_qubits),
        "total_gates_used": int(total_gates),
        "average_qubits": round(float(avg_qubits), 2),
        "average_gates": round(float(avg_gates), 2),
        "simulation_modes": mode_counts,
    }
