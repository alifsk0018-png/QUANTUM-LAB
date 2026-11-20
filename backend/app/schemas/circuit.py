"""Pydantic v2 schemas for quantum circuit simulation."""

from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field


class GateConfig(BaseModel):
    """Configuration for a single quantum gate application."""

    gate_name: str
    target_qubits: list[int]
    control_qubits: list[int] = []
    parameters: dict = {}


class CircuitConfig(BaseModel):
    """Full circuit layout: qubit count + optional initial basis state + ordered gate list."""

    num_qubits: int = Field(ge=1, le=8)
    initial_state: str | None = None
    gates: list[GateConfig] = Field(default_factory=list, max_length=200)


class NoiseParams(BaseModel):
    """Noise model parameters for noisy simulation."""

    gate_error: float = Field(default=0.01, ge=0.0, le=0.5)
    measurement_error: float = Field(default=0.01, ge=0.0, le=0.5)


class SimulationRequest(BaseModel):
    """Payload sent by the frontend to run a simulation."""

    circuit: CircuitConfig
    simulation_mode: Literal["ideal", "noisy"] = "ideal"
    num_shots: int = Field(default=1024, ge=1, le=10000)
    noise_params: NoiseParams | None = None
    seed: int | None = None


class SimulationResponse(BaseModel):
    """Full simulation result returned to the frontend."""

    statevector: list[list[float]]
    probabilities: dict[str, float]
    measurements: dict[str, int]
    circuit_depth: int
    execution_time: float
    simulation_mode: str
    num_qubits: int
    gate_sequence: list[dict]
    metadata: dict = {}
