/** Explorer demo registry (Phase 5 IA — shared hub + subnav). */

export type ExplorerDemo = {
  id: string;
  href: string;
  title: string;
  body: string;
};

export const EXPLORER_DEMOS: ExplorerDemo[] = [
  {
    id: "mapper",
    href: "/explorer/mapper",
    title: "Classical ↔ quantum mapper",
    body: "Route indices, binary registers, and Grover query parameters (3–6 city bounds).",
  },
  {
    id: "tsp",
    href: "/explorer/tsp",
    title: "Three-city routes",
    body: "Classical brute force vs a bounded Grover preset — simulator-grounded.",
  },
  {
    id: "grover",
    href: "/explorer/grover",
    title: "Marked-state search",
    body: "Grover amplification on four labels, then open the same idea in the lab.",
  },
];

export const EXPLORER_WORKFLOW = [
  "Encode",
  "Mark",
  "Amplify",
  "Compare",
] as const;
