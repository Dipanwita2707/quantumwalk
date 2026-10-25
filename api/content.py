"""Small, reviewed starter curriculum. Numeric answers remain simulator-derived."""

ALGORITHMS = [
    {
        "slug": "superposition",
        "title": "One qubit, two possibilities",
        "level": "Beginner",
        "summary": "A Hadamard gate creates equal ideal probabilities for 0 and 1.",
        "qubits": 1,
        "operations": [{"gate": "h", "target": 0}, {"gate": "measure", "target": 0}],
    },
    {
        "slug": "bell-pair",
        "title": "Bell pair",
        "level": "Beginner",
        "summary": "Two qubits share a correlated state: 00 and 11 appear equally often.",
        "qubits": 2,
        "operations": [
            {"gate": "h", "target": 0},
            {"gate": "cx", "control": 0, "target": 1},
            {"gate": "measure", "target": 0},
            {"gate": "measure", "target": 1},
        ],
    },
    {
        "slug": "ghz-three",
        "title": "Three-qubit GHZ",
        "level": "Intermediate",
        "summary": "Extend Bell-style correlation to three qubits.",
        "qubits": 3,
        "operations": [
            {"gate": "h", "target": 0},
            {"gate": "cx", "control": 0, "target": 1},
            {"gate": "cx", "control": 1, "target": 2},
        ],
    },
    {
        "slug": "deutsch-jozsa-balanced",
        "title": "Deutsch–Jozsa: balanced oracle",
        "level": "Intermediate",
        "summary": "A one-bit balanced oracle produces a certain answer after interference.",
        "qubits": 2,
        "operations": [
            {"gate": "x", "target": 1},
            {"gate": "h", "target": 0},
            {"gate": "h", "target": 1},
            {"gate": "cx", "control": 0, "target": 1},
            {"gate": "h", "target": 0},
            {"gate": "measure", "target": 0},
        ],
    },
    {
        "slug": "grover-two",
        "title": "Two-qubit Grover search",
        "level": "Intermediate",
        "summary": "Amplify the marked |11⟩ state with one oracle and diffuser step.",
        "qubits": 2,
        "operations": [
            {"gate": "h", "target": 0}, {"gate": "h", "target": 1},
            {"gate": "cz", "control": 0, "target": 1},
            {"gate": "h", "target": 0}, {"gate": "h", "target": 1},
            {"gate": "x", "target": 0}, {"gate": "x", "target": 1},
            {"gate": "cz", "control": 0, "target": 1},
            {"gate": "x", "target": 0}, {"gate": "x", "target": 1},
            {"gate": "h", "target": 0}, {"gate": "h", "target": 1},
            {"gate": "measure", "target": 0}, {"gate": "measure", "target": 1},
        ],
    },
]

LESSONS = [
    {
        "slug": "first-qubit",
        "title": "Meet your first qubit",
        "level": "Beginner",
        "minutes": 4,
        "objective": "See how H changes a qubit from certain 0 to equal ideal probabilities.",
        "steps": [
            "A qubit starts in |0⟩. That means a measurement returns 0 with certainty.",
            "Add H to q0 and run. Compare the exact 50/50 probabilities with sampled counts.",
            "Step backward and forward. The probabilities change at H, before measurement.",
        ],
        "algorithm_slug": "superposition",
        "question": "After H on |0⟩, what is the ideal probability of measuring 1?",
        "choices": ["0%", "50%", "100%"],
    },
    {
        "slug": "entanglement",
        "title": "Build a Bell pair",
        "level": "Beginner",
        "minutes": 6,
        "objective": "Connect two qubits and see why 01 and 10 do not appear in the ideal result.",
        "steps": [
            "Apply H to q0. It creates two branches with equal amplitude.",
            "Apply CX with q0 as control and q1 as target. The branches become 00 and 11.",
            "Inspect either local Bloch vector: a single qubit no longer tells the whole story.",
        ],
        "algorithm_slug": "bell-pair",
        "question": "Which ideal outcomes can appear from this Bell circuit?",
        "choices": ["00 and 11", "01 and 10", "All four equally"],
    },
]

LESSON_ANSWERS = {"first-qubit": 1, "entanglement": 0}

CHALLENGES = [
    {
        "slug": "make-superposition",
        "title": "Split a possibility",
        "level": "Beginner",
        "summary": "Build a one-qubit circuit with equal ideal probabilities for 0 and 1.",
        "qubits": 1,
    },
    {
        "slug": "make-bell-pair",
        "title": "Make matching outcomes",
        "level": "Beginner",
        "summary": "Build a two-qubit circuit whose ideal outcomes are only 00 and 11, equally likely.",
        "qubits": 2,
    },
]
