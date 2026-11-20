"""Quantum circuit simulator powered by Qiskit.

This is the core simulation engine. All quantum operations use real Qiskit
primitives — no fake random numbers.
"""

import math
import time
import logging
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

from ..schemas.circuit import (
    CircuitConfig,
    GateConfig,
    SimulationRequest,
    SimulationResponse,
)

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
#  Supported gate catalogue                                           #
# ------------------------------------------------------------------ #

SUPPORTED_GATES: dict[str, dict] = {
    "I":    {"qubits": 1, "params": False},
    "X":    {"qubits": 1, "params": False},
    "Y":    {"qubits": 1, "params": False},
    "Z":    {"qubits": 1, "params": False},
    "H":    {"qubits": 1, "params": False},
    "S":    {"qubits": 1, "params": False},
    "T":    {"qubits": 1, "params": False},
    "RX":   {"qubits": 1, "params": True,  "param_names": ["angle"]},
    "RY":   {"qubits": 1, "params": True,  "param_names": ["angle"]},
    "RZ":   {"qubits": 1, "params": True,  "param_names": ["angle"]},
    "CX":   {"qubits": 2, "params": False, "aliases": ["CNOT"]},
    "CZ":   {"qubits": 2, "params": False},
    "SWAP": {"qubits": 2, "params": False},
    "CCX":  {"qubits": 3, "params": False, "aliases": ["TOFFOLI"]},
}

# Reverse alias map so users can write "CNOT" and we resolve to "CX", etc.
_ALIAS_MAP: dict[str, str] = {}
for _canonical, _meta in SUPPORTED_GATES.items():
    for _alias in _meta.get("aliases", []):
        _ALIAS_MAP[_alias] = _canonical


class QuantumSimulator:
    """Build, validate, and simulate quantum circuits via Qiskit."""

    # ------------------------------------------------------------ #
    #  Validation                                                    #
    # ------------------------------------------------------------ #

    def validate_circuit(self, config: CircuitConfig) -> list[str]:
        """Return a list of human-readable validation errors (empty == valid)."""
        errors: list[str] = []
        num_qubits = config.num_qubits

        if config.initial_state is not None:
            if len(config.initial_state) != num_qubits or any(ch not in ("0", "1") for ch in config.initial_state):
                errors.append(
                    f"Invalid initial_state '{config.initial_state}': must be a binary string of length {num_qubits}."
                )

        for idx, gate in enumerate(config.gates):
            name = gate.gate_name.upper()
            canonical = _ALIAS_MAP.get(name, name)

            # Gate exists?
            if canonical not in SUPPORTED_GATES:
                errors.append(
                    f"Gate #{idx}: unknown gate '{gate.gate_name}'. "
                    f"Supported: {', '.join(sorted(SUPPORTED_GATES))}."
                )
                continue

            meta = SUPPORTED_GATES[canonical]
            required_qubits = meta["qubits"]

            # Qubit indices in range?
            all_qubits = gate.target_qubits + gate.control_qubits
            for q in all_qubits:
                if q < 0 or q >= num_qubits:
                    errors.append(
                        f"Gate #{idx} ({canonical}): qubit index {q} out of "
                        f"range [0, {num_qubits - 1}]."
                    )

            # Correct number of qubits supplied?
            total_supplied = len(gate.target_qubits) + len(gate.control_qubits)
            if required_qubits == 1 and total_supplied != 1:
                errors.append(
                    f"Gate #{idx} ({canonical}): single-qubit gate expects "
                    f"exactly 1 qubit, got {total_supplied}."
                )
            elif required_qubits == 2:
                if canonical in ("CX", "CZ"):
                    if len(gate.control_qubits) != 1 or len(gate.target_qubits) != 1:
                        errors.append(
                            f"Gate #{idx} ({canonical}): needs exactly 1 control "
                            f"and 1 target qubit."
                        )
                elif canonical == "SWAP":
                    if len(gate.target_qubits) != 2:
                        errors.append(
                            f"Gate #{idx} (SWAP): needs exactly 2 target qubits."
                        )
            elif required_qubits == 3:
                if canonical == "CCX":
                    if len(gate.control_qubits) != 2 or len(gate.target_qubits) != 1:
                        errors.append(
                            f"Gate #{idx} (CCX): needs exactly 2 control qubits "
                            f"and 1 target qubit."
                        )

            # Duplicate qubit check
            if len(all_qubits) != len(set(all_qubits)):
                errors.append(
                    f"Gate #{idx} ({canonical}): duplicate qubit indices."
                )

            # Parameters
            if meta["params"]:
                param_names = meta.get("param_names", [])
                for pn in param_names:
                    if pn not in gate.parameters:
                        errors.append(
                            f"Gate #{idx} ({canonical}): missing required "
                            f"parameter '{pn}'."
                        )
                    else:
                        val = gate.parameters[pn]
                        if (
                            isinstance(val, bool)
                            or not isinstance(val, (int, float))
                            or not math.isfinite(float(val))
                        ):
                            errors.append(
                                f"Gate #{idx} ({canonical}): parameter '{pn}' must be a finite number."
                            )
                for pn, val in gate.parameters.items():
                    if pn not in param_names:
                        errors.append(
                            f"Gate #{idx} ({canonical}): unexpected parameter '{pn}'."
                        )
            else:
                if gate.parameters:
                    errors.append(
                        f"Gate #{idx} ({canonical}): gate takes no parameters "
                        f"but got {gate.parameters}."
                    )

        return errors

    # ------------------------------------------------------------ #
    #  Circuit construction                                          #
    # ------------------------------------------------------------ #

    def build_circuit(self, config: CircuitConfig) -> QuantumCircuit:
        """Translate a CircuitConfig into a Qiskit QuantumCircuit."""
        qc = QuantumCircuit(config.num_qubits)

        # Apply optional initial computational basis state (MSB=q_{n-1} ... LSB=q_0 or qubit-indexed left-to-right)
        # Convention: initial_state[q] initializes qubit q (so "10" sets q0=|1>, q1=|0>)
        if config.initial_state:
            for q_idx, bit in enumerate(config.initial_state):
                if bit == "1":
                    qc.x(q_idx)

        for gate in config.gates:
            name = _ALIAS_MAP.get(gate.gate_name.upper(), gate.gate_name.upper())
            t = gate.target_qubits
            c = gate.control_qubits

            if name == "I":
                qc.id(t[0])
            elif name == "X":
                qc.x(t[0])
            elif name == "Y":
                qc.y(t[0])
            elif name == "Z":
                qc.z(t[0])
            elif name == "H":
                qc.h(t[0])
            elif name == "S":
                qc.s(t[0])
            elif name == "T":
                qc.t(t[0])
            elif name == "RX":
                qc.rx(float(gate.parameters["angle"]), t[0])
            elif name == "RY":
                qc.ry(float(gate.parameters["angle"]), t[0])
            elif name == "RZ":
                qc.rz(float(gate.parameters["angle"]), t[0])
            elif name == "CX":
                qc.cx(c[0], t[0])
            elif name == "CZ":
                qc.cz(c[0], t[0])
            elif name == "SWAP":
                qc.swap(t[0], t[1])
            elif name == "CCX":
                qc.ccx(c[0], c[1], t[0])

        return qc

    # ------------------------------------------------------------ #
    #  Ideal simulation                                              #
    # ------------------------------------------------------------ #

    def simulate_ideal(
        self, qc: QuantumCircuit, num_shots: int, num_qubits: int, seed: int | None = None
    ) -> dict:
        """Run an ideal (noiseless) statevector simulation."""
        sv = Statevector.from_instruction(qc)
        sv_array = np.asarray(sv)

        # Statevector as [[re, im], ...]
        statevector = [[float(z.real), float(z.imag)] for z in sv_array]

        # Exact probabilities keyed by bitstring
        probs_array = np.abs(sv_array) ** 2
        probabilities: dict[str, float] = {}
        for i, p in enumerate(probs_array):
            label = format(i, f"0{num_qubits}b")
            if p > 1e-15:
                probabilities[label] = round(float(p), 10)

        # Sampled measurement counts with optional seed for reproducibility
        if seed is not None:
            sv = Statevector(sv_array)
            sv.seed(seed)
        counts = sv.sample_counts(num_shots)
        measurements: dict[str, int] = {}
        for bitstring, count in counts.items():
            # Qiskit may return strings with or without leading zeros
            key = bitstring.zfill(num_qubits)
            measurements[key] = int(count)

        return {
            "statevector": statevector,
            "probabilities": probabilities,
            "measurements": measurements,
            "metadata": {
                "backend": "qiskit.quantum_info.Statevector",
                "seed": seed,
                "is_hardware": False,
            },
        }

    # ------------------------------------------------------------ #
    #  Noisy simulation (Aer)                                        #
    # ------------------------------------------------------------ #

    def simulate_noisy(
        self, qc: QuantumCircuit, num_shots: int, num_qubits: int,
        gate_error: float = 0.01, measurement_error: float = 0.01,
        seed: int | None = None,
    ) -> dict:
        """Run a noisy simulation via qiskit-aer if available."""
        try:
            from qiskit_aer import AerSimulator
            from qiskit_aer.noise import NoiseModel, depolarizing_error, ReadoutError

            noise_model = NoiseModel()

            # Depolarizing error on every single-qubit gate
            if gate_error > 0:
                dep_error_1q = depolarizing_error(gate_error, 1)
                noise_model.add_all_qubit_quantum_error(dep_error_1q, ["id", "x", "y", "z", "h", "s", "t", "rx", "ry", "rz"])

                # Depolarizing error on two-qubit gates
                dep_error_2q = depolarizing_error(min(gate_error * 2, 0.75), 2)
                noise_model.add_all_qubit_quantum_error(dep_error_2q, ["cx", "cz", "swap"])

                # Depolarizing error on three-qubit gates (e.g. Toffoli)
                dep_error_3q = depolarizing_error(min(gate_error * 3, 0.75), 3)
                noise_model.add_all_qubit_quantum_error(dep_error_3q, ["ccx"])

            # Readout error
            if measurement_error > 0:
                p1given0 = measurement_error
                p0given1 = measurement_error
                ro_error = ReadoutError(
                    [[1 - p1given0, p1given0], [p0given1, 1 - p0given1]]
                )
                noise_model.add_all_qubit_readout_error(ro_error)

            # We need measurement instructions for the Aer backend
            meas_qc = qc.copy()
            meas_qc.measure_all()

            backend = AerSimulator(noise_model=noise_model)
            run_kwargs = {"shots": num_shots}
            if seed is not None:
                run_kwargs["seed_simulator"] = seed
            result = backend.run(meas_qc, **run_kwargs).result()
            raw_counts = result.get_counts()

            measurements: dict[str, int] = {}
            for bitstring, count in raw_counts.items():
                # Aer may return space-separated classical/quantum registers
                clean = bitstring.replace(" ", "").zfill(num_qubits)
                measurements[clean] = measurements.get(clean, 0) + int(count)

            # Derive noisy empirical probabilities from counts
            total = sum(measurements.values())
            probabilities = {k: round(v / total, 10) for k, v in measurements.items()}

            # Compute ideal statevector & theoretical probabilities for comparison
            sv = Statevector.from_instruction(qc)
            sv_array = np.asarray(sv)
            statevector = [[float(z.real), float(z.imag)] for z in sv_array]
            ideal_probs_array = np.abs(sv_array) ** 2
            ideal_probabilities = {
                format(i, f"0{num_qubits}b"): round(float(p), 10)
                for i, p in enumerate(ideal_probs_array)
                if p > 1e-15
            }

            return {
                "statevector": statevector,
                "probabilities": probabilities,
                "measurements": measurements,
                "metadata": {
                    "backend": "qiskit_aer.AerSimulator",
                    "gate_error": gate_error,
                    "measurement_error": measurement_error,
                    "ideal_probabilities": ideal_probabilities,
                    "seed": seed,
                    "is_hardware": False,
                },
            }

        except ImportError:
            logger.warning(
                "qiskit-aer not installed — falling back to ideal simulation "
                "for noisy request."
            )
            result = self.simulate_ideal(qc, num_shots, num_qubits, seed=seed)
            result["metadata"]["warning"] = (
                "qiskit-aer not available; results are from ideal statevector simulation."
            )
            return result

    # ------------------------------------------------------------ #
    #  Public entry-point                                            #
    # ------------------------------------------------------------ #

    def run(self, request: SimulationRequest) -> SimulationResponse:
        """Validate → build → simulate → return SimulationResponse."""
        config = request.circuit

        # 1. Validate
        errors = self.validate_circuit(config)
        if errors:
            raise ValueError("Circuit validation failed: " + "; ".join(errors))

        # 2. Build
        qc = self.build_circuit(config)

        # 3. Simulate
        start = time.perf_counter()

        extra_meta: dict = {
            "initial_state": config.initial_state or ("0" * config.num_qubits),
            "num_shots": request.num_shots,
        }
        if request.simulation_mode == "noisy":
            noise = request.noise_params
            gate_err = noise.gate_error if noise else 0.01
            meas_err = noise.measurement_error if noise else 0.01
            sim_result = self.simulate_noisy(
                qc, request.num_shots, config.num_qubits,
                gate_error=gate_err, measurement_error=meas_err,
                seed=request.seed,
            )
        else:
            sim_result = self.simulate_ideal(
                qc, request.num_shots, config.num_qubits, seed=request.seed
            )

        elapsed = time.perf_counter() - start

        # Merge any extra metadata from noisy fallback
        extra_meta.update(sim_result.pop("metadata", {}))

        # 4. Build gate sequence description
        gate_sequence = [
            {
                "gate": g.gate_name,
                "targets": g.target_qubits,
                "controls": g.control_qubits,
                "parameters": g.parameters,
            }
            for g in config.gates
        ]

        return SimulationResponse(
            statevector=sim_result["statevector"],
            probabilities=sim_result["probabilities"],
            measurements=sim_result["measurements"],
            circuit_depth=qc.depth(),
            execution_time=round(elapsed, 6),
            simulation_mode=request.simulation_mode,
            num_qubits=config.num_qubits,
            gate_sequence=gate_sequence,
            metadata=extra_meta,
        )
