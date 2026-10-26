"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXPLORER_DEMOS } from "@/lib/explorerDemos";

function isActive(pathname: string, href: string): boolean {
  if (href === "/explorer") return pathname === "/explorer";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ExplorerHubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="explorer-hub-nav" aria-label="Explorer demos">
      <p className="explorer-hub-nav-kicker">EXPLORE</p>
      <ul>
        <li>
          <Link href="/explorer" aria-current={isActive(pathname, "/explorer") ? "page" : undefined}>
            Overview
          </Link>
        </li>
        {EXPLORER_DEMOS.map((demo) => (
          <li key={demo.id}>
            <Link href={demo.href} aria-current={isActive(pathname, demo.href) ? "page" : undefined}>
              {demo.title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="explorer-hub-nav-extras">
        <Link href="/workspace?mode=circuit">Circuit lab</Link>
        <Link href="/hub">Tools hub</Link>
      </div>
    </nav>
  );
}
