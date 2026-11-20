"""Structured quantum computing learning academy curriculum, quizzes, progress, and badges."""

from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from ..database.models import LearningProgress, QuizResult, Achievement
from ..schemas.learning import (
    LessonContent,
    QuizQuestion,
    Quiz,
    Lesson,
    Module,
    QuizSubmission,
    QuizResultResponse,
)

# ------------------------------------------------------------------ #
#  Curriculum Definition (Beginner / Intermediate / Advanced)          #
# ------------------------------------------------------------------ #

CURRICULUM: list[Module] = [
    Module(
        id="beginner",
        title="Level 1: Quantum Foundations",
        description="Start your quantum journey: learn what qubits are, how superposition works, and what happens during measurement.",
        level="beginner",
        icon="atom",
        lessons=[
            Lesson(
                id="intro-quantum-computing",
                title="Introduction to Quantum Computing",
                description="Discover why quantum computers exist, how they differ from classical machines, and where they provide speedups.",
                order=1,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Classical computers process information as deterministic binary digits (bits) that are strictly 0 or 1. "
                            "Quantum computers harness quantum mechanics — specifically superposition, entanglement, and interference — "
                            "to manipulate complex probability amplitudes across exponentially large state spaces."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="N qubits span a 2^N dimensional complex Hilbert space (e.g., 50 qubits → 2^50 ≈ 1.12 × 10^15 amplitudes).",
                    ),
                    LessonContent(
                        type="text",
                        content=(
                            "Importantly, quantum computers are not simply 'faster classical CPUs' for every task. "
                            "They excel at structured problems where quantum interference amplifies correct answers and cancels wrong ones, "
                            "such as quantum chemistry simulation, integer factorization (Shor's algorithm), and unstructured search (Grover's algorithm)."
                        ),
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: Single-Qubit Superposition",
                            "num_qubits": 1,
                            "gates": [{"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}}],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-intro-qc",
                    title="Quantum Foundations Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="How many complex amplitudes describe a pure state of n qubits?",
                            options=["2n", "n^2", "2^n", "n!"],
                            correct_answer=2,
                            explanation="Each qubit doubles the dimension of the state space, giving 2^n computational basis amplitudes.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="Which three quantum phenomena power quantum algorithms?",
                            options=[
                                "Superposition, entanglement, and interference",
                                "Overclocking, pipelining, and caching",
                                "Gravity, friction, and magnetism",
                                "Thermal noise, bit flips, and decoherence",
                            ],
                            correct_answer=0,
                            explanation="Quantum algorithms rely on superposition, entanglement, and constructive/destructive interference.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="classical-bits-vs-qubits",
                title="Classical Bits vs. Qubits",
                description="Understand Dirac ket notation, complex probability amplitudes, and normalization.",
                order=2,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "A classical bit has two discrete states: 0 or 1. A qubit has two computational basis states written in Dirac notation "
                            "as |0⟩ = [1, 0]ᵀ and |1⟩ = [0, 1]ᵀ, and any pure single-qubit state is a normalized linear combination of the two."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="|ψ⟩ = α|0⟩ + β|1⟩,   where α, β ∈ ℂ   and   |α|² + |β|² = 1",
                    ),
                    LessonContent(
                        type="text",
                        content=(
                            "The Bloch sphere provides a geometric representation of any pure single-qubit state using two angles: "
                            "polar angle θ ∈ [0, π] and azimuthal phase φ ∈ [0, 2π). Note that |0⟩ sits at the north pole and |1⟩ at the south pole."
                        ),
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: Flip |0⟩ to |1⟩ with Pauli-X",
                            "num_qubits": 1,
                            "gates": [{"gate_name": "X", "target_qubits": [0], "control_qubits": [], "parameters": {}}],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-bits-vs-qubits",
                    title="Bits & Qubits Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="If a qubit is in state |ψ⟩ = α|0⟩ + β|1⟩ with α = 0.6, what must |β| equal for a valid normalized state?",
                            options=["0.4", "0.6", "0.8", "1.0"],
                            correct_answer=2,
                            explanation="Since |α|² + |β|² = 1, 0.36 + |β|² = 1 ⇒ |β|² = 0.64 ⇒ |β| = 0.8.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="Which gate flips |0⟩ deterministically to |1⟩?",
                            options=["Identity (I)", "Pauli-X (X)", "Pauli-Z (Z)", "S gate"],
                            correct_answer=1,
                            explanation="Pauli-X is the quantum NOT gate and swaps the amplitudes of |0⟩ and |1⟩.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-superposition",
                title="Quantum Superposition",
                description="Explore how the Hadamard gate creates equal superpositions and relative phases.",
                order=3,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Superposition means a quantum system exists in a coherent linear combination of basis states before measurement. "
                            "Unlike a classical coin whose side is already determined but hidden, superposition carries relative phase information "
                            "that can interfere constructively or destructively in later gates."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2,    H|1⟩ = |−⟩ = (|0⟩ − |1⟩)/√2",
                    ),
                    LessonContent(
                        type="text",
                        content=(
                            "Notice that both |+⟩ and |−⟩ yield 50% |0⟩ and 50% |1⟩ when measured in the Z basis, yet they are orthogonal states! "
                            "Applying a second Hadamard gate proves the difference: H|+⟩ = |0⟩ whereas H|−⟩ = |1⟩."
                        ),
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: H followed by H returns to |0⟩",
                            "num_qubits": 1,
                            "gates": [
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                            ],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-superposition",
                    title="Superposition Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="What is the state after applying H twice to |0⟩ (i.e. H·H|0⟩)?",
                            options=["(|0⟩ + |1⟩)/√2", "|1⟩", "|0⟩", "(|0⟩ − |1⟩)/√2"],
                            correct_answer=2,
                            explanation="The Hadamard gate is self-inverse (H² = I), so H(H|0⟩) = |0⟩ via interference.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="What is the measurement probability of |1⟩ for state |−⟩ = (|0⟩ − |1⟩)/√2?",
                            options=["0%", "25%", "50%", "100%"],
                            correct_answer=2,
                            explanation="The probability is |−1/√2|² = 1/2 = 50%.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-measurement",
                title="Quantum Measurement & Shots",
                description="Learn the Born rule, wavefunction collapse, and why simulators run multiple shots.",
                order=4,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Measurement extracts classical bits from a quantum register. According to the Born rule, "
                            "measuring |ψ⟩ = Σ c_x |x⟩ in the computational basis yields bitstring x with probability P(x) = |c_x|²."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="P(x) = |⟨x|ψ⟩|² = |c_x|²",
                    ),
                    LessonContent(
                        type="text",
                        content=(
                            "Because measurement collapses the quantum state and yields only a single classical outcome per execution, "
                            "we repeat the circuit many times (called 'shots', e.g., 1024 shots). Finite shot counts exhibit statistical sampling "
                            "fluctuations around the exact theoretical probabilities."
                        ),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-measurement",
                    title="Quantum Measurement Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="Why do 1024 shots of H|0⟩ often produce counts like 503 and 521 instead of exactly 512 and 512?",
                            options=[
                                "The Hadamard gate is biased",
                                "Finite random sampling variance from the Born rule",
                                "The simulator has a bug",
                                "Qubits lose energy during measurement",
                            ],
                            correct_answer=1,
                            explanation="Each shot is an independent Bernoulli trial with p = 0.5, producing binomial sampling variance.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="Is projective measurement a reversible unitary operation?",
                            options=["Yes, always reversible", "No, measurement is irreversible", "Only for 1 qubit", "Only for Bell states"],
                            correct_answer=1,
                            explanation="Measurement collapses the superposition and destroys unmeasured relative phase information.",
                        ),
                    ],
                ),
            ),
        ],
    ),
    Module(
        id="intermediate",
        title="Level 2: Gates, Circuits & Entanglement",
        description="Master unitary gates, multi-qubit circuits, Bell-state entanglement, and quantum interference.",
        level="intermediate",
        icon="cpu",
        lessons=[
            Lesson(
                id="quantum-gates",
                title="Single-Qubit & Parametric Gates",
                description="Explore Pauli, Phase (S, T), and continuous rotation gates (RX, RY, RZ).",
                order=1,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Every valid quantum gate is represented by a unitary matrix U satisfying U†U = I. "
                            "Unitarity guarantees reversibility and preserves the total probability (norm) of the statevector."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="RX(θ) = cos(θ/2)I − i·sin(θ/2)X,   RY(θ) = cos(θ/2)I − i·sin(θ/2)Y,   RZ(θ) = exp(−iθZ/2)",
                    ),
                    LessonContent(
                        type="text",
                        content=(
                            "Phase gates like Z (π), S (π/2), and T (π/4) do not change Z-basis measurement probabilities on their own, "
                            "but they alter relative phases that dramatically change interference outcomes once Hadamard or rotation gates follow."
                        ),
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: RY(π/2) Rotation",
                            "num_qubits": 1,
                            "gates": [{"gate_name": "RY", "target_qubits": [0], "control_qubits": [], "parameters": {"angle": 1.5707963268}}],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-gates",
                    title="Quantum Gates Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="What mathematical property must every quantum gate matrix U satisfy?",
                            options=["Symmetric (U = Uᵀ)", "Unitary (U†U = I)", "Singular (det U = 0)", "Diagonal"],
                            correct_answer=1,
                            explanation="Unitary operators preserve inner products and total probability norms.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="Applying RX(π) to |0⟩ produces (up to global phase):",
                            options=["|0⟩", "|1⟩", "|+⟩", "|−⟩"],
                            correct_answer=1,
                            explanation="RX(π) = −iX, which rotates |0⟩ by 180° around the X axis to −i|1⟩ (100% probability of |1⟩).",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-circuits",
                title="Multi-Qubit Quantum Circuits",
                description="Learn tensor products, controlled gates (CNOT, CZ, Toffoli), and circuit depth.",
                order=2,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Multi-qubit states live in the tensor product space of individual qubits. "
                            "Controlled gates such as CNOT (CX), CZ, and Toffoli (CCX) apply an operation to a target qubit "
                            "conditioned on one or more control qubits being in state |1⟩."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="CNOT|a, b⟩ = |a, b ⊕ a⟩,    CCX|a, b, c⟩ = |a, b, c ⊕ (a ∧ b)⟩",
                    ),
                    LessonContent(
                        type="text",
                        content=(
                            "Circuit depth is the longest path of sequential gate layers from input to output. "
                            "Minimizing circuit depth is crucial on real noisy quantum processors because qubits decohere over time."
                        ),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-circuits",
                    title="Multi-Qubit Circuits Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="What is the output of CNOT applied to |10⟩ (qubit 0 control = 1, qubit 1 target = 0)?",
                            options=["|00⟩", "|10⟩", "|11⟩", "|01⟩"],
                            correct_answer=2,
                            explanation="When the control qubit is |1⟩, CNOT flips the target qubit from |0⟩ to |1⟩.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="How many control qubits does a Toffoli (CCX) gate require?",
                            options=["0", "1", "2", "3"],
                            correct_answer=2,
                            explanation="CCX is Controlled-Controlled-X: 2 control qubits and 1 target qubit.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-entanglement",
                title="Quantum Entanglement & Bell States",
                description="Generate maximally entangled Bell states and understand non-separability.",
                order=3,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "A two-qubit state is entangled if it cannot be factored into a tensor product |ψ_A⟩ ⊗ |ψ_B⟩ of single-qubit states. "
                            "Because an entangled qubit has no pure single-qubit state vector of its own, a single-qubit Bloch sphere cannot "
                            "completely represent an entangled multi-qubit state — we use the Q-Sphere or full statevector instead."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="|Φ⁺⟩ = CNOT(H ⊗ I)|00⟩ = (|00⟩ + |11⟩)/√2",
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: Generate Bell State |Φ⁺⟩",
                            "num_qubits": 2,
                            "gates": [
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
                            ],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-entanglement",
                    title="Entanglement Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="In an ideal Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, which outcomes have non-zero probability?",
                            options=["01 and 10", "00 and 11", "All four equally", "Only 11"],
                            correct_answer=1,
                            explanation="Both qubits are perfectly correlated: 50% |00⟩ and 50% |11⟩, with 0% for |01⟩ and |10⟩.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="Can a single-qubit Bloch sphere fully represent an entangled two-qubit state?",
                            options=[
                                "Yes, always",
                                "No — entangled qubits cannot be separated into independent pure single-qubit states",
                                "Only if both qubits use Hadamard",
                                "Only in noisy mode",
                            ],
                            correct_answer=1,
                            explanation="Each qubit's reduced state in a Bell pair is maximally mixed (center of the Bloch sphere), losing correlation info.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-interference",
                title="Quantum Interference",
                description="See how positive and negative amplitudes cancel or reinforce measurement probabilities.",
                order=4,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Unlike classical probabilities which are always non-negative, quantum probability amplitudes are complex numbers. "
                            "When two computational paths lead to the same basis state with opposite signs, they cancel out (destructive interference); "
                            "when they share the same phase, they reinforce (constructive interference)."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="H · Z · H |0⟩ = H · (|0⟩ − |1⟩)/√2 = |1⟩   (amplitude of |0⟩ cancels completely!)",
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: Phase Kick Interference (H → Z → H)",
                            "num_qubits": 1,
                            "gates": [
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "Z", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                            ],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-interference",
                    title="Interference Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="What is the final state of H · Z · H |0⟩?",
                            options=["|0⟩", "|1⟩", "|+⟩", "|−⟩"],
                            correct_answer=1,
                            explanation="H creates |+⟩, Z flips the phase to |−⟩, and H interferes |−⟩ constructively onto |1⟩.",
                        ),
                        QuizQuestion(
                            id="q2",
                            question="What enables destructive interference in quantum circuits?",
                            options=[
                                "Negative or complex relative phases between amplitudes",
                                "Classical bit addition",
                                "Increased shot counts",
                                "Thermal readout errors",
                            ],
                            correct_answer=0,
                            explanation="Complex phases allow amplitudes along different paths to sum to zero.",
                        ),
                    ],
                ),
            ),
        ],
    ),
    Module(
        id="advanced",
        title="Level 3: Algorithms, Teleportation & Noise",
        description="Dive into Grover's search, quantum teleportation, quantum error correction, and noisy NISQ hardware.",
        level="advanced",
        icon="sparkles",
        lessons=[
            Lesson(
                id="quantum-algorithms-overview",
                title="Quantum Algorithms & Complexity",
                description="Understand oracle models, amplitude amplification, and quadratic vs. exponential speedups.",
                order=1,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Quantum algorithms structure unitary transformations so that valid solutions interfere constructively. "
                            "Two landmark families are Fourier-based algorithms (Deutsch-Jozsa, QPE, Shor) and Amplitude Amplification (Grover)."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="Unstructured search: Classical O(N) queries  vs.  Grover's Quantum Search O(√N) queries",
                    ),
                ],
                quiz=Quiz(
                    id="quiz-algorithms",
                    title="Quantum Algorithms Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="What speedup does Grover's algorithm achieve over classical brute-force search for N items?",
                            options=["Constant O(1)", "Quadratic O(√N)", "Exponential O(log N)", "No speedup"],
                            correct_answer=1,
                            explanation="Grover's algorithm finds a marked item in O(√N) oracle queries — provably optimal for unstructured search.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="grovers-search",
                title="Grover's Search Algorithm",
                description="Step through the phase oracle and Grover diffusion operator for a 2-qubit search.",
                order=2,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "For 2 qubits (N = 4 items: |00⟩, |01⟩, |10⟩, |11⟩), a classical search requires 2.25 queries on average "
                            "(up to 3-4 worst case). Grover's algorithm finds the marked state |11⟩ with 100% probability in just ONE iteration!"
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="1) H⊗H → uniform superposition  |  2) Oracle CZ flips sign of |11⟩  |  3) Diffusion amplifies |11⟩ to P=1.0",
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: 2-Qubit Grover Search for |11⟩",
                            "num_qubits": 2,
                            "gates": [
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [1], "control_qubits": [], "parameters": {}},
                                {"gate_name": "CZ", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [1], "control_qubits": [], "parameters": {}},
                                {"gate_name": "X", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "X", "target_qubits": [1], "control_qubits": [], "parameters": {}},
                                {"gate_name": "CZ", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
                                {"gate_name": "X", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "X", "target_qubits": [1], "control_qubits": [], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "H", "target_qubits": [1], "control_qubits": [], "parameters": {}},
                            ],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-grover",
                    title="Grover's Search Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="What are the two core subroutines repeated in Grover's algorithm?",
                            options=[
                                "Phase Oracle and Diffusion (Inversion about the Mean)",
                                "SWAP and Identity",
                                "Readout and Reset",
                                "Pauli-X and Pauli-Y",
                            ],
                            correct_answer=0,
                            explanation="The oracle marks the target state with a negative phase, and the diffuser reflects amplitudes about their mean.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-teleportation",
                title="Quantum Teleportation",
                description="Transfer an unknown quantum state across qubits using entanglement and classical bits.",
                order=3,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Quantum teleportation transfers an unknown state |ψ⟩ from Alice's qubit (q0) to Bob's qubit (q2) "
                            "using a shared Bell pair (q1, q2) and two classical bits of communication. It does NOT violate the "
                            "no-cloning theorem (Alice's original state is destroyed) nor faster-than-light causality (classical bits are required)."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="Prepare |ψ⟩ on q0 → Entangle (q1, q2) → Bell basis on (q0, q1) → Controlled X/Z corrections on q2",
                    ),
                ],
                quiz=Quiz(
                    id="quiz-teleportation",
                    title="Teleportation Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="Does quantum teleportation allow faster-than-light communication?",
                            options=[
                                "Yes, instantaneously",
                                "No — Bob needs two classical bits from Alice to apply the right correction gates",
                                "Only with 3 or more qubits",
                                "Only in vacuum",
                            ],
                            correct_answer=1,
                            explanation="Without Alice's classical measurement results, Bob's qubit appears completely random.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-noise",
                title="Quantum Noise & NISQ Decoherence",
                description="Compare ideal vs. noisy simulations, depolarizing channels, and readout assignment errors.",
                order=4,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Real Noisy Intermediate-Scale Quantum (NISQ) processors experience decoherence, imperfect gate calibrations "
                            "(depolarizing errors), and measurement readout assignment errors. In QUANTUM LAB's simulator, switching from "
                            "Ideal to Noisy mode runs Qiskit Aer with configurable gate and readout error channels."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="Depolarizing channel:  ε(ρ) = (1 − p)ρ + (p / 3)(XρX + YρY + ZρZ)",
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try in Noisy Mode: Bell State Noise Leakage",
                            "num_qubits": 2,
                            "gates": [
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
                            ],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-noise",
                    title="Quantum Noise Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="When simulating a Bell state in Noisy mode, why do small counts of |01⟩ and |10⟩ appear?",
                            options=[
                                "Ideal entanglement naturally produces |01⟩ and |10⟩",
                                "Depolarizing gate errors and readout assignment errors corrupt ideal amplitudes",
                                "Hadamard gates are non-unitary",
                                "Qiskit Aer adds random padding bits",
                            ],
                            correct_answer=1,
                            explanation="Gate depolarization and readout bit-flip errors leak probability into states that are zero in ideal execution.",
                        ),
                    ],
                ),
            ),
            Lesson(
                id="quantum-error-correction",
                title="Quantum Error Correction",
                description="Protect fragile quantum states using entanglement, parity syndromes, and stabilizer codes.",
                order=5,
                content=[
                    LessonContent(
                        type="text",
                        content=(
                            "Because of the No-Cloning Theorem, we cannot copy an arbitrary unknown qubit state α|0⟩ + β|1⟩ for classical redundancy. "
                            "Instead, Quantum Error Correction (QEC) spreads logical information into entangled states across multiple physical qubits "
                            "and measures parity syndromes without collapsing the encoded logical superposition."
                        ),
                    ),
                    LessonContent(
                        type="formula",
                        content="3-Qubit Bit-Flip Code:  |0⟩_L = |000⟩,   |1⟩_L = |111⟩   →   α|0⟩ + β|1⟩ ↦ α|000⟩ + β|111⟩",
                    ),
                    LessonContent(
                        type="circuit",
                        content=json.dumps({
                            "label": "Try It: 3-Qubit Bit-Flip Encoder (|+⟩ → (|000⟩+|111⟩)/√2)",
                            "num_qubits": 3,
                            "gates": [
                                {"gate_name": "H", "target_qubits": [0], "control_qubits": [], "parameters": {}},
                                {"gate_name": "CX", "target_qubits": [1], "control_qubits": [0], "parameters": {}},
                                {"gate_name": "CX", "target_qubits": [2], "control_qubits": [0], "parameters": {}},
                            ],
                        }),
                    ),
                ],
                quiz=Quiz(
                    id="quiz-qec",
                    title="Error Correction Check",
                    passing_score=70,
                    questions=[
                        QuizQuestion(
                            id="q1",
                            question="Why can't classical repetition copying directly clone an unknown state α|0⟩ + β|1⟩?",
                            options=[
                                "The No-Cloning Theorem forbids copying arbitrary unknown quantum states",
                                "Qubits are too slow",
                                "CNOT gates only work on 1 qubit",
                                "Memory limits",
                            ],
                            correct_answer=0,
                            explanation="Unitarity implies no universal cloner exists; QEC uses entanglement and syndrome measurements instead.",
                        ),
                    ],
                ),
            ),
        ],
    ),
]


def _find_quiz(module_id: str, quiz_id: str) -> tuple[Optional[Module], Optional[Lesson], Optional[Quiz]]:
    for mod in CURRICULUM:
        if mod.id == module_id:
            for lesson in mod.lessons:
                if lesson.quiz and lesson.quiz.id == quiz_id:
                    return mod, lesson, lesson.quiz
    # Fallback search across all modules in case quiz_id alone matches
    for mod in CURRICULUM:
        for lesson in mod.lessons:
            if lesson.quiz and lesson.quiz.id == quiz_id:
                return mod, lesson, lesson.quiz
    return None, None, None


def get_all_modules() -> list[Module]:
    return CURRICULUM


def get_module_by_id(module_id: str) -> Optional[Module]:
    for mod in CURRICULUM:
        if mod.id == module_id:
            return mod
    return None


def get_lesson_by_id(module_id: str, lesson_id: str) -> Optional[Lesson]:
    mod = get_module_by_id(module_id)
    if not mod:
        return None
    for lesson in mod.lessons:
        if lesson.id == lesson_id:
            return lesson
    return None


def _award_achievement_if_missing(db: Session, name: str, description: str, icon: str) -> None:
    existing = db.query(Achievement).filter(Achievement.name == name).first()
    if not existing:
        db.add(Achievement(name=name, description=description, icon=icon))
        db.commit()


def get_progress(db: Session) -> list[LearningProgress]:
    return db.query(LearningProgress).all()


def get_achievements(db: Session) -> list[Achievement]:
    return db.query(Achievement).order_by(Achievement.earned_at.desc()).all()


def mark_lesson_read(db: Session, module_id: str, lesson_id: str) -> LearningProgress:
    """Record lesson progress without falsely claiming mastery if a quiz hasn't been passed."""
    lesson = get_lesson_by_id(module_id, lesson_id)
    has_quiz = bool(lesson and lesson.quiz)

    record = (
        db.query(LearningProgress)
        .filter(LearningProgress.module_id == module_id, LearningProgress.lesson_id == lesson_id)
        .first()
    )
    now = datetime.now(timezone.utc)
    if not record:
        record = LearningProgress(
            module_id=module_id,
            lesson_id=lesson_id,
            completed=(not has_quiz),
            score=100.0 if not has_quiz else 0.0,
            completed_at=now if not has_quiz else None,
        )
        db.add(record)
    elif not has_quiz and not record.completed:
        record.completed = True
        record.score = 100.0
        record.completed_at = now
    db.commit()
    db.refresh(record)
    return record


def submit_quiz(db: Session, submission: QuizSubmission) -> QuizResultResponse:
    mod, lesson, quiz = _find_quiz(submission.module_id, submission.quiz_id)
    if not quiz or not lesson or not mod:
        raise ValueError(f"Quiz '{submission.quiz_id}' not found in module '{submission.module_id}'.")

    score = 0
    total = len(quiz.questions)
    details: list[dict] = []

    for q in quiz.questions:
        selected = submission.answers.get(q.id)
        is_correct = selected == q.correct_answer
        if is_correct:
            score += 1
        details.append({
            "question_id": q.id,
            "selected": selected,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    percentage = round((score / total) * 100.0, 1) if total > 0 else 0.0
    passed = percentage >= quiz.passing_score

    # Persist quiz attempt
    qr = QuizResult(
        module_id=mod.id,
        quiz_id=quiz.id,
        answers=json.dumps(submission.answers),
        score=score,
        total=total,
        passed=passed,
    )
    db.add(qr)

    # Update lesson progress based on real quiz performance
    prog = (
        db.query(LearningProgress)
        .filter(LearningProgress.module_id == mod.id, LearningProgress.lesson_id == lesson.id)
        .first()
    )
    now = datetime.now(timezone.utc)
    if not prog:
        prog = LearningProgress(
            module_id=mod.id,
            lesson_id=lesson.id,
            completed=passed,
            score=percentage,
            completed_at=now if passed else None,
        )
        db.add(prog)
    else:
        prog.score = max(prog.score or 0.0, percentage)
        if passed:
            prog.completed = True
            prog.completed_at = prog.completed_at or now

    db.commit()

    # Check achievements based on real database counts
    if passed:
        _award_achievement_if_missing(
            db,
            "First Quantum Quiz Passed",
            "Demonstrated understanding by passing your first Quantum Academy quiz.",
            "award",
        )
        completed_in_mod = (
            db.query(LearningProgress)
            .filter(LearningProgress.module_id == mod.id, LearningProgress.completed == True)  # noqa: E712
            .count()
        )
        if completed_in_mod >= len(mod.lessons):
            _award_achievement_if_missing(
                db,
                f"{mod.title} Master",
                f"Completed all lessons and quizzes in {mod.title}.",
                "trophy",
            )

    return QuizResultResponse(
        quiz_id=quiz.id,
        score=score,
        total=total,
        passed=passed,
        percentage=percentage,
        details=details,
    )


def get_learning_stats(db: Session) -> dict:
    total_lessons = sum(len(m.lessons) for m in CURRICULUM)
    completed_lessons = (
        db.query(LearningProgress)
        .filter(LearningProgress.completed == True)  # noqa: E712
        .count()
    )
    passed_quizzes = (
        db.query(QuizResult)
        .filter(QuizResult.passed == True)  # noqa: E712
        .count()
    )
    achievements_count = db.query(Achievement).count()
    return {
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "challenges_completed": passed_quizzes,
        "achievements_count": achievements_count,
    }
