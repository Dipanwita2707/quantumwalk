import Image from "next/image";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import "@/app/lab/science.css";
import "./identity.css";

export function IdentityLayout({ children }: { children: ReactNode }) {
  return <>
    <SiteHeader />
    <main className="q-ui-identity science-shell">
      <section className="q-ui-identity-card" aria-label="Your quantum identity">{children}</section>
      <aside className="q-ui-identity-scene" aria-label="Your quantum journey">
        <Image className="q-ui-identity-background" src="/images/quantum-quest-v1.png" alt="" fill sizes="(max-width: 760px) 100vw, 60vw" priority />
        <div className="q-ui-identity-story">
          <span className="q-ui-eyebrow">A universe of possibilities</span>
          <h2>Your next discovery<br />starts here.</h2>
          <ol>
            <li><span>1</span><div><strong>Create your identity</strong><p>Keep your experiments and progress together.</p></div></li>
            <li><span>2</span><div><strong>Choose your path</strong><p>Begin with a qubit or follow your curiosity.</p></div></li>
            <li><span>3</span><div><strong>Start exploring</strong><p>Build, run, and see what changes.</p></div></li>
          </ol>
        </div>
        <Image className="q-ui-identity-explorer" src="/images/quantum-explorer-v1.png" alt="" width={480} height={480} sizes="(max-width: 760px) 220px, 360px" />
      </aside>
    </main>
  </>;
}
