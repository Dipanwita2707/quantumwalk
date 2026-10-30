import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { HubToolsNav } from "@/components/HubToolsNav";
import "@/app/hub/hub-home.css";

export function HubToolChrome({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="content-shell hub-tool-layout">
        <HubToolsNav />
        <div className="hub-tool-main qw-hub-tool">
          <header className="hub-tool-header"><div><p className="eyebrow">CONNECTED TOOLS</p><h1>{title}</h1><p>{title === "Doc Editor" ? "Write and refine a document, then carry a copy into Document Pro." : title === "Document Pro" ? "Prepare a template or an imported document. Keep every field when you return." : "Design layer shapes, then send a report to your document workspace."}</p></div><span className="hub-local-badge">Local workspace</span></header>
          <nav className="hub-workflow-nav" aria-label="Document workspace">{[["Doc Editor", "/hub/doc-editor"], ["Document Pro", "/hub/document-pro"], ["ML Studio", "/hub/ml-studio"]].map(([label, href]) => <Link key={href} href={href} aria-current={title === label ? "page" : undefined}>{label}</Link>)}</nav>
          {children}
          <p className="qw-hub-back">
            <Link href="/hub">← All tools</Link>
          </p>
        </div>
      </main>
    </>
  );
}
