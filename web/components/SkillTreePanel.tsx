"use client";

import Link from "next/link";
import { SKILL_NODES } from "@/lib/skillTree";

export function SkillTreePanel({ completedActivities }: { completedActivities: Set<string> }) {
  return (
    <ol className="skill-tree" aria-label="Learning skill path">
      {SKILL_NODES.map((node, index) => {
        const done = completedActivities.has(node.activity);
        const prereqMet = node.requires.every((id) => {
          const req = SKILL_NODES.find((n) => n.id === id);
          return req ? completedActivities.has(req.activity) : true;
        });
        const state = done ? "done" : prereqMet ? "ready" : "locked";
        return (
          <li key={node.id} className={`skill-tree-node skill-tree-${state}`}>
            <span className="skill-tree-index">{index + 1}</span>
            <div>
              <strong>{node.title}</strong>
              <p>{node.plain}</p>
              {!done && prereqMet && (
                <Link href={node.href} className="db-text-link">
                  Start →
                </Link>
              )}
              {done && <span className="skill-tree-check">✓ Complete</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
