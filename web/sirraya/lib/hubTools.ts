/** Sirraya hub tool registry (OBSERVED ids → QuantumWalk routes). */

export type HubTool = {
  id: string;
  name: string;
  description: string;
  href: string;
  category: "Documents" | "Quantum" | "Research";
  featured?: boolean;
};

export const HUB_TOOLS: HubTool[] = [
  {
    id: "document-generator",
    name: "Document Pro",
    description: "Prepare templates or imported drafts, then print or export the document.",
    href: "/hub/document-pro",
    category: "Documents",
    featured: true,
  },
  {
    id: "editor",
    name: "Doc Editor",
    description: "Markdown with live preview, local drafts, and export.",
    href: "/hub/doc-editor",
    category: "Documents",
    featured: true,
  },
  {
    id: "mlexplorer",
    name: "ML Studio",
    description: "Explore layer shapes and data flow in a small feed-forward network.",
    href: "/hub/ml-studio",
    category: "Research",
  },
  {
    id: "quantumtsp",
    name: "Quantum Explorer",
    description: "TSP + Grover stages with classical baselines.",
    href: "/explorer/tsp",
    category: "Quantum",
  },
  {
    id: "quantum-academy",
    name: "Quantum Academy",
    description: "Curriculum hub, glossary, hardware story, and lab links.",
    href: "/learn",
    category: "Quantum",
  },
  {
    id: "quantum-mapper",
    name: "Quantum Mapper",
    description: "Encode classical routes and registers into qubit labels (3–6 city TSP index map).",
    href: "/explorer/mapper",
    category: "Quantum",
  },
];

export const HUB_CATEGORIES = ["All", "Documents", "Quantum", "Research"] as const;
