export type SkillNode = {
  id: string;
  title: string;
  plain: string;
  href: string;
  requires: string[];
  activity: string;
};

export const SKILL_NODES: SkillNode[] = [
  {
    id: "unpredictable",
    title: "Make it unpredictable",
    plain: "Run H on one qubit and watch 50/50 chances.",
    href: "/workspace?preset=superposition",
    requires: [],
    activity: "lesson:first-qubit",
  },
  {
    id: "read-it",
    title: "Read it",
    plain: "Sample measurements and compare to exact chances.",
    href: "/learn/first-qubit",
    requires: ["unpredictable"],
    activity: "lesson:first-qubit",
  },
  {
    id: "shared",
    title: "Share a result",
    plain: "Build a pair where only matching outcomes appear.",
    href: "/workspace?preset=bell",
    requires: ["read-it"],
    activity: "lesson:entanglement",
  },
  {
    id: "prove",
    title: "Prove your circuit",
    plain: "Pass a mission graded by the simulator.",
    href: "/challenges/make-bell-pair",
    requires: ["shared"],
    activity: "challenge:make-bell-pair",
  },
];

export function nextSkillNode(completedActivities: Set<string>): SkillNode | undefined {
  for (const node of SKILL_NODES) {
    if (completedActivities.has(node.activity)) continue;
    const ready = node.requires.every((reqId) => {
      const req = SKILL_NODES.find((n) => n.id === reqId);
      return req ? completedActivities.has(req.activity) : true;
    });
    if (ready) return node;
  }
  return undefined;
}
