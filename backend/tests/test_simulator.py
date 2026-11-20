"""Unit tests for the Qiskit-powered QuantumSimulator engine."""

import math
import pytest

from app.quantum.simulator import QuantumSimulator
from app.schemas.circuit import CircuitConfig, GateConfig, SimulationRequest, NoiseParams


class TestQuantumSimulator:
    def setup_method(self):
        self.simulator = QuantumSimulator()

    def test_hadamard_creates_superposition(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="H", target_qubits=[0])],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=1024, seed=42))
        assert abs(result.probabilities["0"] - 0.5) < 1e-6
        assert abs(result.probabilities["1"] - 0.5) < 1e-6
        assert sum(result.measurements.values()) == 1024

    def test_pauli_x_flips_zero_to_one(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="X", target_qubits=[0])],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=256))
        assert abs(result.probabilities["1"] - 1.0) < 1e-6
        assert result.probabilities.get("0", 0.0) < 1e-6
        assert result.measurements.get("1") == 256

    def test_cnot_gate_on_basis_state(self):
        # Initialize q0=|1>, q1=|0>, then CX(0->1) -> |11>
        config = CircuitConfig(
            num_qubits=2,
            gates=[
                GateConfig(gate_name="X", target_qubits=[0]),
                GateConfig(gate_name="CX", control_qubits=[0], target_qubits=[1]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=200))
        assert abs(result.probabilities["11"] - 1.0) < 1e-6

    def test_bell_state_entanglement(self):
        config = CircuitConfig(
            num_qubits=2,
            gates=[
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="CNOT", control_qubits=[0], target_qubits=[1]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=2000, seed=7))
        assert abs(result.probabilities.get("00", 0.0) - 0.5) < 1e-6
        assert abs(result.probabilities.get("11", 0.0) - 0.5) < 1e-6
        assert result.probabilities.get("01", 0.0) < 1e-6
        assert result.probabilities.get("10", 0.0) < 1e-6
        assert result.measurements.get("01", 0) == 0
        assert result.measurements.get("10", 0) == 0

    def test_swap_gate_exchanges_qubits(self):
        # q0=|1>, q1=|0> -> bitstring "01" (q1 q0); SWAP -> q0=|0>, q1=|1> -> "10"
        config = CircuitConfig(
            num_qubits=2,
            gates=[
                GateConfig(gate_name="X", target_qubits=[0]),
                GateConfig(gate_name="SWAP", target_qubits=[0, 1]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=256))
        assert abs(result.probabilities.get("10", 0.0) - 1.0) < 1e-6

    def test_toffoli_ccx_gate(self):
        # q0=|1>, q1=|1>, q2=|0> -> CCX(0,1 -> 2) -> |111>
        config = CircuitConfig(
            num_qubits=3,
            gates=[
                GateConfig(gate_name="X", target_qubits=[0]),
                GateConfig(gate_name="X", target_qubits=[1]),
                GateConfig(gate_name="CCX", control_qubits=[0, 1], target_qubits=[2]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=256))
        assert abs(result.probabilities.get("111", 0.0) - 1.0) < 1e-6

    def test_quantum_teleportation_deferred_measurement(self):
        # Prepare |psi> = RY(pi/3)|0> on q0 -> P(0)=cos^2(pi/6)=0.75, P(1)=0.25
        # Teleport to q2 via Bell pair (q1, q2) and coherent CX(1->2), CZ(0->2)
        config = CircuitConfig(
            num_qubits=3,
            gates=[
                GateConfig(gate_name="RY", target_qubits=[0], parameters={"angle": math.pi / 3}),
                GateConfig(gate_name="H", target_qubits=[1]),
                GateConfig(gate_name="CX", control_qubits=[1], target_qubits=[2]),
                GateConfig(gate_name="CX", control_qubits=[0], target_qubits=[1]),
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="CX", control_qubits=[1], target_qubits=[2]),
                GateConfig(gate_name="CZ", control_qubits=[0], target_qubits=[2]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=1024, seed=42))
        # In Qiskit bitstring ordering (q2 q1 q0), q2 is index 0
        prob_q2_0 = sum(p for bits, p in result.probabilities.items() if bits[0] == "0")
        prob_q2_1 = sum(p for bits, p in result.probabilities.items() if bits[0] == "1")
        assert abs(prob_q2_0 - 0.75) < 1e-6
        assert abs(prob_q2_1 - 0.25) < 1e-6

    def test_quantum_interference_hzh(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="Z", target_qubits=[0]),
                GateConfig(gate_name="H", target_qubits=[0]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=500))
        assert abs(result.probabilities.get("1", 0.0) - 1.0) < 1e-6

    def test_grover_2_qubit_marks_11(self):
        config = CircuitConfig(
            num_qubits=2,
            gates=[
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="H", target_qubits=[1]),
                GateConfig(gate_name="CZ", control_qubits=[0], target_qubits=[1]),
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="H", target_qubits=[1]),
                GateConfig(gate_name="X", target_qubits=[0]),
                GateConfig(gate_name="X", target_qubits=[1]),
                GateConfig(gate_name="CZ", control_qubits=[0], target_qubits=[1]),
                GateConfig(gate_name="X", target_qubits=[0]),
                GateConfig(gate_name="X", target_qubits=[1]),
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="H", target_qubits=[1]),
            ],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=512))
        assert abs(result.probabilities.get("11", 0.0) - 1.0) < 1e-6

    def test_identity_gate(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="I", target_qubits=[0])],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=100))
        assert abs(result.probabilities["0"] - 1.0) < 1e-6

    def test_rotation_x_pi(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="RX", target_qubits=[0], parameters={"angle": math.pi})],
        )
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=100))
        assert abs(result.probabilities.get("1", 0.0) - 1.0) < 1e-6

    def test_initial_basis_state(self):
        config = CircuitConfig(num_qubits=2, initial_state="10", gates=[])
        result = self.simulator.run(SimulationRequest(circuit=config, num_shots=100))
        # q0=1, q1=0 -> Qiskit bitstring "01" (q1 q0)
        assert abs(result.probabilities.get("01", 0.0) - 1.0) < 1e-6

    def test_noisy_simulation_executes(self):
        config = CircuitConfig(
            num_qubits=2,
            gates=[
                GateConfig(gate_name="H", target_qubits=[0]),
                GateConfig(gate_name="CX", control_qubits=[0], target_qubits=[1]),
            ],
        )
        req = SimulationRequest(
            circuit=config,
            simulation_mode="noisy",
            num_shots=1024,
            noise_params=NoiseParams(gate_error=0.05, measurement_error=0.05),
            seed=123,
        )
        result = self.simulator.run(req)
        assert result.simulation_mode == "noisy"
        assert sum(result.measurements.values()) == 1024

    def test_invalid_qubit_index_raises(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="H", target_qubits=[5])],
        )
        with pytest.raises(ValueError):
            self.simulator.run(SimulationRequest(circuit=config, num_shots=100))

    def test_invalid_gate_name_raises(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="INVALID_GATE", target_qubits=[0])],
        )
        with pytest.raises(ValueError):
            self.simulator.run(SimulationRequest(circuit=config, num_shots=100))

    def test_missing_rotation_parameter_raises(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="RX", target_qubits=[0], parameters={})],
        )
        with pytest.raises(ValueError):
            self.simulator.run(SimulationRequest(circuit=config, num_shots=100))

    def test_non_finite_rotation_parameter_raises(self):
        config = CircuitConfig(
            num_qubits=1,
            gates=[GateConfig(gate_name="RY", target_qubits=[0], parameters={"angle": float("nan")})],
        )
        with pytest.raises(ValueError):
            self.simulator.run(SimulationRequest(circuit=config, num_shots=100))

    def test_duplicate_qubit_indices_raise(self):
        config = CircuitConfig(
            num_qubits=2,
            gates=[GateConfig(gate_name="CX", control_qubits=[0], target_qubits=[0])],
        )
        with pytest.raises(ValueError):
            self.simulator.run(SimulationRequest(circuit=config, num_shots=100))

    def test_max_qubits_exceeded_rejected(self):
        with pytest.raises(Exception):
            CircuitConfig(num_qubits=9, gates=[])
