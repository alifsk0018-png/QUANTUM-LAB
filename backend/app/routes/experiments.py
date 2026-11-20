"""REST endpoints for persistent experiment storage and statistics."""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..schemas.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
    ExperimentListResponse,
)
from ..services import experiment_service

router = APIRouter(prefix="/api", tags=["Experiments"])


def _serialize_experiment(exp) -> ExperimentResponse:
    return ExperimentResponse(
        id=exp.id,
        name=exp.name,
        description=exp.description or "",
        circuit_config=json.loads(exp.circuit_config) if isinstance(exp.circuit_config, str) else exp.circuit_config,
        num_qubits=exp.num_qubits,
        gate_count=exp.gate_count,
        simulation_mode=exp.simulation_mode,
        num_shots=exp.num_shots,
        results=json.loads(exp.results) if isinstance(exp.results, str) and exp.results else None,
        notes=exp.notes or "",
        created_at=exp.created_at,
        updated_at=exp.updated_at,
    )


@router.get("/experiments/stats")
def get_stats(db: Session = Depends(get_db)):
    """Return aggregated experiment statistics from SQLite/SQLAlchemy."""
    return experiment_service.get_experiment_stats(db)


@router.get("/experiments", response_model=ExperimentListResponse)
def list_experiments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    experiments, total = experiment_service.get_experiments(db, skip=skip, limit=limit)
    return ExperimentListResponse(
        experiments=[_serialize_experiment(e) for e in experiments],
        total=total,
    )


@router.post("/experiments", response_model=ExperimentResponse, status_code=201)
def create_experiment(data: ExperimentCreate, db: Session = Depends(get_db)):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Experiment name is required.")
    if data.num_qubits < 1 or data.num_qubits > 8:
        raise HTTPException(status_code=400, detail="num_qubits must be between 1 and 8.")
    exp = experiment_service.create_experiment(db, data)
    return _serialize_experiment(exp)


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    exp = experiment_service.get_experiment(db, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return _serialize_experiment(exp)


@router.put("/experiments/{experiment_id}", response_model=ExperimentResponse)
def update_experiment(experiment_id: int, data: ExperimentUpdate, db: Session = Depends(get_db)):
    exp = experiment_service.update_experiment(db, experiment_id, data)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return _serialize_experiment(exp)


@router.delete("/experiments/{experiment_id}")
def delete_experiment(experiment_id: int, db: Session = Depends(get_db)):
    deleted = experiment_service.delete_experiment(db, experiment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    return {"deleted": True, "id": experiment_id}
