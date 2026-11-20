"""Pydantic v2 schemas for experiment CRUD."""

from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ExperimentCreate(BaseModel):
    """Payload to create a new experiment."""

    name: str
    description: str = ""
    circuit_config: dict
    num_qubits: int
    simulation_mode: str = "ideal"
    num_shots: int = 1024
    results: dict | None = None
    notes: str = ""


class ExperimentUpdate(BaseModel):
    """Partial-update payload for an experiment."""

    name: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    results: Optional[dict] = None


class ExperimentResponse(BaseModel):
    """Single experiment returned to the frontend."""

    id: int
    name: str
    description: str
    circuit_config: dict
    num_qubits: int
    gate_count: int
    simulation_mode: str
    num_shots: int
    results: dict | None
    notes: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExperimentListResponse(BaseModel):
    """Paginated list of experiments."""

    experiments: list[ExperimentResponse]
    total: int
