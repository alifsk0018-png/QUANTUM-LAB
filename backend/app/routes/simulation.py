"""REST endpoints for quantum simulation, circuit validation, and gate metadata."""

from fastapi import APIRouter, HTTPException
from ..schemas.circuit import CircuitConfig, SimulationRequest, SimulationResponse
from ..quantum.simulator import QuantumSimulator
from ..quantum.gates import get_all_gates

router = APIRouter(prefix="/api", tags=["Simulation"])
simulator = QuantumSimulator()


@router.post("/simulate", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest):
    """Validate and execute a quantum circuit on the Qiskit simulation engine."""
    try:
        return simulator.run(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation error: {exc}")


@router.post("/circuit/validate")
def validate_circuit(config: CircuitConfig):
    """Validate a circuit configuration without executing it."""
    errors = simulator.validate_circuit(config)
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "num_qubits": config.num_qubits,
        "gate_count": len(config.gates),
    }


@router.get("/gates")
def list_gates():
    """Return all supported quantum gates with descriptions and unitary matrices."""
    return {"gates": get_all_gates()}
