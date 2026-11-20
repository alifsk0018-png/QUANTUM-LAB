export const PRESET_EXPERIMENTS = [
  {
    id: 'superposition',
    number: 1,
    title: 'Quantum Superposition',
    subtitle: 'Create an equal superposition of |0⟩ and |1⟩ using the Hadamard gate.',
    difficulty: 'Beginner',
    category: 'Foundations',
    introduction:
      'Unlike a classical bit which must be strictly 0 or 1, a qubit can exist in a coherent linear combination α|0⟩ + β|1⟩. Applying a Hadamard (H) gate to |0⟩ transforms it into |+⟩ = (|0⟩ + |1⟩)/√2, yielding a 50% probability of observing 0 or 1 upon measurement.',
    objectives: [
      'Initialize a single qubit in the computational basis state |0⟩.',
      'Apply the Hadamard gate (H) to rotate |0⟩ onto the Bloch sphere equator (+X axis).',
      'Observe how theoretical 50/50 probabilities translate into shot-sampled measurement counts.',
      'Compare Ideal statevector execution against Noisy Aer execution.',
    ],
    procedure: [
      'Initialize register of 1 qubit in state |0⟩.',
      'Apply Hadamard gate H on q0.',
      'Execute simulation across 1,024 measurement shots.',
      'Inspect the Statevector (1/√2 ≈ 0.7071 for |0⟩ and |1⟩), Bloch Sphere (+X), and Histogram.',
    ],
    circuit: {
      num_qubits: 1,
      initial_state: '0',
      gates: [
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
      ],
    },
    expectedInsights:
      'Statevector amplitudes are [0.7071, 0.7071] with 0° relative phase. The Bloch vector points along +X (θ = 90°, φ = 0°). Finite-shot sampling naturally fluctuates around 512/512 counts.',
  },
  {
    id: 'entanglement',
    number: 2,
    title: 'Quantum Entanglement (Bell State)',
    subtitle: 'Generate the maximally entangled |Φ⁺⟩ Bell pair with Hadamard + CNOT.',
    difficulty: 'Intermediate',
    category: 'Correlations',
    introduction:
      'Quantum entanglement binds two qubits into a shared non-separable state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Neither qubit possesses a definite individual state before measurement, yet measuring q0 instantaneously determines q1 — they always yield matching outcomes (00 or 11).',
    objectives: [
      'Create superposition on control qubit q0 via Hadamard (H).',
      'Correlate q0 and q1 using Controlled-NOT (CX: q0 → q1).',
      'Verify that |01⟩ and |10⟩ have zero ideal probability while |00⟩ and |11⟩ are 50% each.',
      'Observe why a single-qubit Bloch sphere reduces to the origin (purity 0.5) for entangled qubits and why Q-Sphere is required.',
    ],
    procedure: [
      'Initialize a 2-qubit register in |00⟩.',
      'Apply Hadamard H on q0 to form (|0⟩+|1⟩)|0⟩/√2.',
      'Apply CX with control q0 and target q1 to form (|00⟩+|11⟩)/√2.',
      'Run Ideal simulation, then try Noisy mode to watch error leakage into |01⟩ and |10⟩.',
    ],
    circuit: {
      num_qubits: 2,
      initial_state: '00',
      gates: [
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'CX', target_qubits: [1], control_qubits: [0], parameters: {} },
      ],
    },
    expectedInsights:
      'Ideal statevector has equal amplitudes 1/√2 on |00⟩ and |11⟩. Each individual qubit has reduced purity 0.5 (maximally mixed center of the Bloch sphere).',
  },
  {
    id: 'teleportation',
    number: 3,
    title: 'Quantum Teleportation',
    subtitle: 'Transfer an unknown single-qubit state from q0 to q2 using a Bell pair.',
    difficulty: 'Advanced',
    category: 'Protocols',
    introduction:
      'Quantum teleportation transfers an arbitrary state |ψ⟩ from Alice (q0) to Bob (q2) without physically moving the qubit or violating the No-Cloning Theorem. Alice and Bob share an entangled Bell pair (q1, q2); Alice performs a Bell-basis interaction on (q0, q1) and transmits two classical measurement bits so Bob can apply conditional X and Z corrections. Using the Deferred Measurement Principle, those classical corrections are modeled equivalently here as coherent CX(q1→q2) and CZ(q0→q2) gates.',
    objectives: [
      'Prepare a non-trivial arbitrary payload state |ψ⟩ = RY(π/3)|0⟩ on q0 (75% |0⟩, 25% |1⟩).',
      'Entangle ancilla qubit q1 and Bob qubit q2 into a shared Bell pair.',
      'Perform Alice’s Bell-basis entanglement + Hadamard on (q0, q1).',
      'Apply deferred-measurement X and Z recovery operations onto q2 and verify q2 inherits 75% |0⟩ / 25% |1⟩.',
    ],
    procedure: [
      'Prepare |ψ⟩ on q0 using RY(π/3) (cos²(π/6) = 75% |0⟩, sin²(π/6) = 25% |1⟩).',
      'Create a Bell pair across (q1, q2) via H(q1) followed by CX(q1 → q2).',
      'Bell-analyze Alice’s qubits: CX(q0 → q1) then H(q0).',
      'Apply conditional corrections CX(q1 → q2) and CZ(q0 → q2); check Bob’s marginal probability on q2 (leftmost bit in Qiskit bitstrings).',
    ],
    circuit: {
      num_qubits: 3,
      initial_state: '000',
      gates: [
        { gate_name: 'RY', target_qubits: [0], control_qubits: [], parameters: { angle: Math.PI / 3 } },
        { gate_name: 'H', target_qubits: [1], control_qubits: [], parameters: {} },
        { gate_name: 'CX', target_qubits: [2], control_qubits: [1], parameters: {} },
        { gate_name: 'CX', target_qubits: [1], control_qubits: [0], parameters: {} },
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'CX', target_qubits: [2], control_qubits: [1], parameters: {} },
        { gate_name: 'CZ', target_qubits: [2], control_qubits: [0], parameters: {} },
      ],
    },
    expectedInsights:
      'In Qiskit little-endian ordering (q2 q1 q0), outcomes starting with "0" (000, 001, 010, 011) sum to exactly 75.0%, and outcomes starting with "1" (100, 101, 110, 111) sum to 25.0% — proving |ψ⟩ arrived intact on Bob’s qubit q2!',
  },
  {
    id: 'interference',
    number: 4,
    title: 'Quantum Interference',
    subtitle: 'Observe destructive and constructive amplitude interference via H → Z → H.',
    difficulty: 'Intermediate',
    category: 'Mechanics',
    introduction:
      'Quantum probability amplitudes can be positive, negative, or complex. When two computational paths reach a state with opposite signs, they cancel completely (destructive interference). In H · Z · H |0⟩, the first H creates (|0⟩ + |1⟩)/√2, Z flips |1⟩’s sign to (|0⟩ − |1⟩)/√2, and the final H cancels |0⟩ completely while reinforcing |1⟩ to 100%.',
    objectives: [
      'Understand why classical probabilities cannot cancel out, whereas quantum amplitudes can.',
      'Track relative phase evolution from |+⟩ to |−⟩ after a Pauli-Z gate.',
      'Observe complete destructive interference of |0⟩ and 100% constructive amplification of |1⟩.',
    ],
    procedure: [
      'Initialize q0 in |0⟩.',
      'Apply Hadamard (H) to reach |+⟩ = (|0⟩ + |1⟩)/√2.',
      'Apply Pauli-Z (Z) to invert the |1⟩ phase, forming |−⟩ = (|0⟩ − |1⟩)/√2.',
      'Apply a second Hadamard (H): the |0⟩ paths cancel (+1/2 − 1/2 = 0) and |1⟩ paths reinforce (+1/2 + 1/2 = 1).',
    ],
    circuit: {
      num_qubits: 1,
      initial_state: '0',
      gates: [
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'Z', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
      ],
    },
    expectedInsights:
      'Even though Z alone never changes Z-basis measurement probabilities on |+⟩, sandwiching Z between Hadamards converts phase contrast into a deterministic 100% |1⟩ outcome.',
  },
  {
    id: 'grover',
    number: 5,
    title: "Grover's Quantum Search",
    subtitle: 'Locate the marked state |11⟩ in an unsorted 4-item space in a single query.',
    difficulty: 'Advanced',
    category: 'Algorithms',
    introduction:
      "Grover's algorithm searches an unstructured database of N items in O(√N) oracle queries instead of classical O(N). For N = 4 states (2 qubits), classical search checks 2.25 items on average (up to 3–4 worst case). Grover’s algorithm prepares a uniform superposition, marks |11⟩ with a phase flip via CZ, and applies the diffusion operator (inversion about the mean) to reach 100% probability in 1 query!",
    objectives: [
      'Prepare a uniform 4-state superposition using H ⊗ H.',
      'Mark target item |11⟩ with a negative phase (-1) using a Controlled-Z (CZ) phase oracle.',
      'Apply the 2-qubit Grover diffusion operator (H⊗H → X⊗X → CZ → X⊗X → H⊗H).',
      'Compare 1 quantum oracle query against classical search query complexity.',
    ],
    procedure: [
      'Apply H to q0 and q1 to create uniform amplitudes [0.5, 0.5, 0.5, 0.5].',
      'Oracle: Apply CZ(q0, q1) to flip the phase of |11⟩ to -0.5.',
      'Diffuser: Apply H(q0), H(q1), X(q0), X(q1), CZ(q0, q1), X(q0), X(q1), H(q0), H(q1).',
      'Run Ideal simulation and verify |11⟩ reaches 100.0% probability in 1 iteration.',
    ],
    circuit: {
      num_qubits: 2,
      initial_state: '00',
      gates: [
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'H', target_qubits: [1], control_qubits: [], parameters: {} },
        { gate_name: 'CZ', target_qubits: [1], control_qubits: [0], parameters: {} },
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'H', target_qubits: [1], control_qubits: [], parameters: {} },
        { gate_name: 'X', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'X', target_qubits: [1], control_qubits: [], parameters: {} },
        { gate_name: 'CZ', target_qubits: [1], control_qubits: [0], parameters: {} },
        { gate_name: 'X', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'X', target_qubits: [1], control_qubits: [], parameters: {} },
        { gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} },
        { gate_name: 'H', target_qubits: [1], control_qubits: [], parameters: {} },
      ],
    },
    classicalComparison: {
      searchSpaceSize: 4,
      markedState: '|11⟩',
      quantumQueries: 1,
      quantumSuccessProb: '100% (ideal)',
      classicalAverageQueries: 2.25,
      classicalWorstCaseQueries: 3,
      asymptoticClassical: 'O(N)',
      asymptoticQuantum: 'O(√N)',
    },
    expectedInsights:
      'Amplitude amplification boosts |11⟩ from 25% (1/4) to 100% in just 1 oracle evaluation, whereas random classical probing has only a 25% chance on the first guess and averages 2.25 checks.',
  },
];
