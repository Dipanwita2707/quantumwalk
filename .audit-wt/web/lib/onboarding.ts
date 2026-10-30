export type Experience = "beginner" | "intermediate" | "advanced";
export type DiscoveryArticle = {
  category: string;
  title: string;
  paragraphs: string[];
  takeaway: string;
};
export type DiscoveryQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type DiscoveryTrack = {
  label: string;
  description: string;
  icon: string;
  starter: string;
  terms: [string, string][];
  articles: [DiscoveryArticle, DiscoveryArticle];
  questions: [DiscoveryQuestion, DiscoveryQuestion];
};

export const discoveryTracks: Record<Experience, DiscoveryTrack> = {
  beginner: {
    label: "Beginner",
    description: "I’m curious, but qubits and gates are new to me.",
    icon: "◌",
    starter: "superposition",
    terms: [["Qubit", "The basic unit of quantum information. When you measure it in this lesson, you get 0 or 1."], ["Gate / H", "A gate changes a qubit's state. H is short for Hadamard; applied to a qubit starting at 0, it makes 0 and 1 equally likely."], ["Superposition", "A state with amplitudes for more than one possible outcome. A measurement still gives one result."], ["Measure", "Read a classical result from the qubit. To repeat this experiment fairly, prepare the starting state again."], ["50% probability", "Each outcome has an equal chance. Ten trials do not have to give exactly five zeros and five ones."]],
    articles: [
      {
        category: "A FIRST LOOK · 30 SECOND READ",
        title: "A qubit begins with possibility.",
        paragraphs: [
          "Every photo, message, and song on a regular computer is stored using bits: zeros and ones. A qubit is the quantum version of that basic unit. When you read it in this experiment, you still get a zero or a one.",
          "The difference is what you can do before reading it. A gate is an operation that changes the qubit. Press Apply H in the experiment: the starting state changes from a certain zero to equal chances of zero and one. This state is called superposition.",
        ],
        takeaway: "Superposition is a quantum state. Measuring it gives one classical outcome.",
      },
      {
        category: "THE NEXT IDEA · 30 SECOND READ",
        title: "Why doesn’t every run look the same?",
        paragraphs: [
          "Measuring means getting a classical result from the qubit. Press Prepare a qubit & measure. You will get one result: zero or one. Press it again to prepare a fresh qubit and try another measurement.",
          "Both results have an equal chance, but a short run can still contain more zeros than ones. Think of several fair coin tosses: equal chances do not guarantee an even split in a small sample. The coin comparison explains the counts; it does not describe how quantum states work.",
        ],
        takeaway: "Probabilities describe possible outcomes. Counts record the outcomes you actually sampled.",
      },
    ],
    questions: [
      { prompt: "After H on a starting 0, is 0 or 1 more likely?", options: ["You always get 0", "Both have an equal chance", "You always get 1"], answer: 1, explanation: "Press Apply H: the two possibilities each show 50%. H has prepared a superposition. When you measure, you still get only one result." },
      { prompt: "What do you get when you measure once?", options: ["One result: 0 or 1", "Both 0 and 1 at once", "The complete quantum state"], answer: 0, explanation: "Try the measurement button. Each press prepares a fresh qubit and produces one result. Repeating this lets you compare counts with the equal chances." },
    ],
  },
  intermediate: {
    label: "Intermediate",
    description: "I know the basics. I want to connect the ideas.",
    icon: "◇",
    starter: "bell-pair",
    terms: [["Relative phase", "The relationship between the signs or angles of amplitudes. It can change how they combine, even when today's measurement probabilities match."], ["Interference", "Amplitudes combine: they can reinforce or cancel. A later gate can turn that difference into different measurement probabilities."], ["CX", "Controlled X: flip the target qubit on the part of the state where the control is 1."], ["Bell pair", "An entangled two-qubit state. This example gives matching outcomes 00 or 11."], ["Mixed local state", "A description of one qubit obtained from a larger state. The Bell pair's correlations cannot be recovered from that single-qubit description alone."]],
    articles: [
      {
        category: "CONNECT THE IDEAS · 45 SECOND READ",
        title: "The probabilities don’t tell the whole story.",
        paragraphs: [
          "Two states can have identical measurement probabilities and different relative phases. The states |+⟩ and |−⟩ both give 50/50 outcomes in the computational basis.",
          "Apply H to each and the difference becomes visible: |+⟩ goes to |0⟩, while |−⟩ goes to |1⟩. Interference turns a phase difference into a measurable probability difference.",
        ],
        takeaway: "Relative phase matters when amplitudes interfere.",
      },
      {
        category: "TWO QUBITS · 45 SECOND READ",
        title: "A shared state changes the picture.",
        paragraphs: [
          "Start two qubits at 00, apply H to q0, then CX from q0 to q1. You create the Bell state (|00⟩ + |11⟩)/√2. Its ideal outcomes are 00 and 11, each with probability 50%.",
          "Either qubit alone has a mixed local state: its Bloch vector sits at the center. The full two-qubit state is still pure. To understand the correlations, inspect the joint state rather than a single arrow.",
        ],
        takeaway: "A single-qubit view cannot describe all the information in an entangled pair.",
      },
    ],
    questions: [
      { prompt: "Which ideal outcomes appear from (|00⟩ + |11⟩)/√2?", options: ["01 and 10", "00 and 11", "All four equally"], answer: 1, explanation: "Only 00 and 11 have nonzero amplitudes in this Bell state. Each has ideal probability 50%." },
      { prompt: "Why is either qubit’s Bloch vector at the center of this Bell pair?", options: ["The simulation lost the state", "Both qubits are definitely 0", "Each qubit has a mixed local state"], answer: 2, explanation: "The global state is pure and entangled. Its individual reduced states are maximally mixed." },
    ],
  },
  advanced: {
    label: "Advanced",
    description: "I’m ready for algorithms, phase, and deeper reasoning.",
    icon: "✦",
    starter: "grover-two",
    terms: [["Amplitude", "A complex coefficient of a quantum state. Its squared magnitude gives the probability of a basis outcome."], ["Oracle", "A reversible operation encoding a function. This Grover example flips the marked state's phase."], ["Diffuser", "The reflection about the uniform superposition that, after the oracle, amplifies the marked state."], ["Iteration", "One oracle followed by one diffuser. The correct number depends on the search size and marked-state count."], ["Phase kickback", "An eigenstate target lets a controlled operation put a phase on the input amplitudes while leaving the target unchanged."]],
    articles: [
      {
        category: "ALGORITHM INTUITION · 45 SECOND READ",
        title: "Search by reshaping amplitudes.",
        paragraphs: [
          "Grover search begins with an equal superposition. An oracle changes the marked state’s phase, and a diffuser reflects amplitudes about their mean. Together they amplify the marked outcome.",
          "For four basis states and exactly one marked state, one ideal Grover iteration reaches the marked outcome with certainty. The two-qubit example in your private lab marks |11⟩, so you can inspect the oracle and diffuser step by step.",
        ],
        takeaway: "For this ideal four-state example, one oracle-and-diffuser iteration is enough.",
      },
      {
        category: "PHASE KICKBACK · 45 SECOND READ",
        title: "Let an oracle write into phase.",
        paragraphs: [
          "Consider an oracle U_f that maps |x⟩|y⟩ to |x⟩|y ⊕ f(x)⟩. Prepare the target in |−⟩. Since X|−⟩ = −|−⟩, flipping that target introduces a sign rather than changing its state.",
          "The resulting transformation is |x⟩|−⟩ → (−1)^f(x)|x⟩|−⟩. On a superposition of inputs, those relative signs can affect interference. The target remains |−⟩, while the input carries the function’s phase pattern.",
        ],
        takeaway: "Phase kickback encodes function values as phases that interference can reveal.",
      },
    ],
    questions: [
      { prompt: "With four basis states and one marked state, how many ideal Grover iterations reach the marked state with certainty?", options: ["One", "Four", "An unlimited number"], answer: 0, explanation: "The initial marked amplitude is 1/2. One ideal oracle-and-diffuser iteration rotates the state completely onto the marked outcome." },
      { prompt: "What does U_f do to |x⟩|−⟩ in phase kickback?", options: ["Adds the factor (−1)^f(x)", "Measures x", "Erases the target qubit"], answer: 0, explanation: "The target is an X eigenstate. The oracle introduces (−1)^f(x), which becomes a relative phase across superposed inputs." },
    ],
  },
};
