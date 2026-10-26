import Link from "next/link";
import { ACADEMY_MODULES } from "@sirraya/lib/academyModules";

export function LearnModuleIndex() {
  return (
    <details className="learn-module-index">
      <summary>Evidence-aligned module index</summary>
      <p className="learn-module-index-intro">
        Sirraya-style module names mapped to QuantumWalk routes. Primary navigation lives in the sidebar and unit
        cards above.
      </p>
      <ul aria-label="Sirraya-aligned modules">
        {ACADEMY_MODULES.map((mod) => (
          <li key={mod.id}>
            <Link href={mod.href}>{mod.title}</Link>
            <span>{mod.description}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
