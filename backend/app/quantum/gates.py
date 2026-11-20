"""Comprehensive gate information for the frontend gate palette.

Every matrix is given as a nested list of [real, imag] pairs and is
mathematically correct.
"""

import math

_S2 = 1.0 / math.sqrt(2)

GATE_INFO: dict[str, dict] = {
    "I": {
        "name": "Identity",
        "symbol": "I",
        "description": (
            "The Identity gate leaves the qubit state unchanged. "
            "It is useful as a placeholder or to maintain circuit timing."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0]],
            [[0, 0], [1, 0]],
        ],
    },
    "X": {
        "name": "Pauli-X (NOT)",
        "symbol": "X",
        "description": (
            "The Pauli-X gate is the quantum equivalent of a classical NOT gate. "
            "It flips |0⟩ to |1⟩ and |1⟩ to |0⟩, performing a π rotation "
            "around the X-axis of the Bloch sphere."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[0, 0], [1, 0]],
            [[1, 0], [0, 0]],
        ],
    },
    "Y": {
        "name": "Pauli-Y",
        "symbol": "Y",
        "description": (
            "The Pauli-Y gate performs a π rotation around the Y-axis of the "
            "Bloch sphere. It maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[0, 0], [0, -1]],
            [[0, 1], [0, 0]],
        ],
    },
    "Z": {
        "name": "Pauli-Z",
        "symbol": "Z",
        "description": (
            "The Pauli-Z gate performs a π rotation around the Z-axis. "
            "It leaves |0⟩ unchanged and maps |1⟩ to -|1⟩, introducing a "
            "relative phase of π."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0]],
            [[0, 0], [-1, 0]],
        ],
    },
    "H": {
        "name": "Hadamard",
        "symbol": "H",
        "description": (
            "The Hadamard gate creates an equal superposition. It maps |0⟩ to "
            "(|0⟩+|1⟩)/√2 and |1⟩ to (|0⟩−|1⟩)/√2. It is fundamental "
            "for quantum algorithms and is its own inverse."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[_S2, 0], [_S2, 0]],
            [[_S2, 0], [-_S2, 0]],
        ],
    },
    "S": {
        "name": "S (Phase)",
        "symbol": "S",
        "description": (
            "The S gate (also called the √Z gate) adds a phase of π/2 to the "
            "|1⟩ state. It is equivalent to a Z-rotation by π/2 and is the "
            "square root of the Z gate."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0]],
            [[0, 0], [0, 1]],
        ],
    },
    "T": {
        "name": "T (π/8)",
        "symbol": "T",
        "description": (
            "The T gate adds a phase of π/4 to the |1⟩ state. Together with "
            "the Hadamard and CNOT gates, it forms a universal gate set, "
            "meaning any quantum operation can be approximated."
        ),
        "num_qubits": 1,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0]],
            [[0, 0], [_S2, _S2]],
        ],
    },
    "RX": {
        "name": "Rotation-X",
        "symbol": "RX(θ)",
        "description": (
            "Rotates the qubit state around the X-axis of the Bloch sphere "
            "by angle θ. When θ=π it is equivalent to the Pauli-X gate."
        ),
        "num_qubits": 1,
        "has_parameters": True,
        "parameter_names": ["angle"],
        "matrix": "parametric",
    },
    "RY": {
        "name": "Rotation-Y",
        "symbol": "RY(θ)",
        "description": (
            "Rotates the qubit state around the Y-axis of the Bloch sphere "
            "by angle θ. It can create any real-amplitude superposition."
        ),
        "num_qubits": 1,
        "has_parameters": True,
        "parameter_names": ["angle"],
        "matrix": "parametric",
    },
    "RZ": {
        "name": "Rotation-Z",
        "symbol": "RZ(θ)",
        "description": (
            "Rotates the qubit state around the Z-axis of the Bloch sphere "
            "by angle θ. It is equivalent to applying a phase shift."
        ),
        "num_qubits": 1,
        "has_parameters": True,
        "parameter_names": ["angle"],
        "matrix": "parametric",
    },
    "CX": {
        "name": "Controlled-X (CNOT)",
        "symbol": "CX",
        "description": (
            "The Controlled-NOT gate flips the target qubit when the control "
            "qubit is |1⟩. It is essential for creating entanglement and is "
            "one of the most important two-qubit gates."
        ),
        "num_qubits": 2,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0], [0, 0], [0, 0]],
            [[0, 0], [1, 0], [0, 0], [0, 0]],
            [[0, 0], [0, 0], [0, 0], [1, 0]],
            [[0, 0], [0, 0], [1, 0], [0, 0]],
        ],
    },
    "CZ": {
        "name": "Controlled-Z",
        "symbol": "CZ",
        "description": (
            "The Controlled-Z gate applies a Z gate on the target qubit when "
            "the control qubit is |1⟩. It flips the phase of the |11⟩ state "
            "and is symmetric in its two inputs."
        ),
        "num_qubits": 2,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0], [0, 0], [0, 0]],
            [[0, 0], [1, 0], [0, 0], [0, 0]],
            [[0, 0], [0, 0], [1, 0], [0, 0]],
            [[0, 0], [0, 0], [0, 0], [-1, 0]],
        ],
    },
    "SWAP": {
        "name": "SWAP",
        "symbol": "SWAP",
        "description": (
            "The SWAP gate exchanges the states of two qubits. It can be "
            "decomposed into three CNOT gates."
        ),
        "num_qubits": 2,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": [
            [[1, 0], [0, 0], [0, 0], [0, 0]],
            [[0, 0], [0, 0], [1, 0], [0, 0]],
            [[0, 0], [1, 0], [0, 0], [0, 0]],
            [[0, 0], [0, 0], [0, 0], [1, 0]],
        ],
    },
    "CCX": {
        "name": "Toffoli (CCX)",
        "symbol": "CCX",
        "description": (
            "The Toffoli gate (Controlled-Controlled-X) flips the target qubit "
            "only when both control qubits are |1⟩. It is a universal "
            "reversible gate for classical computation."
        ),
        "num_qubits": 3,
        "has_parameters": False,
        "parameter_names": [],
        "matrix": "8x8_see_docs",
    },
}


def get_all_gates() -> dict[str, dict]:
    """Return the full gate catalogue."""
    return GATE_INFO


def get_gate_info(gate_name: str) -> dict | None:
    """Return info for a specific gate, or None if unknown."""
    return GATE_INFO.get(gate_name.upper())
