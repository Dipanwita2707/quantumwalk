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
          <p className="eyebrow">TOOLS HUB</p>
          <h1>{title}</h1>
          {children}
          <p className="qw-hub-back">
            <Link href="/hub">← All tools</Link>
          </p>
        </div>
      </main>
    </>
  );
}
