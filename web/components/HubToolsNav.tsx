"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HUB_TOOLS } from "@sirraya/lib/hubTools";

function toolActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HubToolsNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="hub-tools-nav" aria-label="Tools directory">
      <p className="hub-tools-nav-kicker">TOOLS</p>
      <ul>
        <li>
          <Link href="/hub" aria-current={pathname === "/hub" ? "page" : undefined}>
            All tools
          </Link>
        </li>
        {HUB_TOOLS.map((tool) => (
          <li key={tool.id}>
            <Link href={tool.href} aria-current={toolActive(pathname, tool.href) ? "page" : undefined}>
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="hub-tools-nav-extras">
        <Link href="/explorer">Quantum Explorer</Link>
        <Link href="/learn">Learn</Link>
      </div>
    </nav>
  );
}
