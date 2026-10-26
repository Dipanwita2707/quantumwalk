"use client";

import "./app-shell-nav.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/api";
import { PRIMARY_NAV, isPrimaryNavActive } from "@/lib/primaryNav";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";

function PrimaryNavLink({ href, title, active }: { href: string; title: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`header-nav-pill${active ? " active" : ""}`}
    >
      {title}
    </Link>
  );
}

export function SiteHeader() {
  const { profile } = useSession();
  const pathname = usePathname();
  const session = profile?.authenticated ? profile : null;

  return (
    <div className="site-topbar-shell">
      <header className={`topbar site-topbar ${session ? "private-topbar" : ""}`}>
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">◈</span>
          <span>
            <strong>QuantumWalk</strong>
            <small>See inside a quantum algorithm</small>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="header-nav-pills">
          {PRIMARY_NAV.map((item) => (
            <PrimaryNavLink
              key={item.id}
              href={item.href}
              title={item.title}
              active={isPrimaryNavActive(item.id, pathname)}
            />
          ))}
        </nav>

        <details className="header-mobile-nav">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isPrimaryNavActive(item.id, pathname) ? "page" : undefined}
              >
                {item.title}
              </Link>
            ))}
            <p className="header-menu-kicker">More</p>
            <Link href="/coach" aria-current={pathname.startsWith("/coach") ? "page" : undefined}>
              Coach
            </Link>
            <Link href="/algorithms" aria-current={pathname.startsWith("/algorithms") ? "page" : undefined}>
              Algorithm library
            </Link>
            <Link href="/challenges" aria-current={pathname.startsWith("/challenges") ? "page" : undefined}>
              Challenges
            </Link>
            <a href="/workspace?mode=whiteboard">Whiteboard</a>
            {session && (
              <>
                <p className="header-menu-kicker">Account</p>
                <Link href="/circuits">Saved circuits</Link>
                <Link href="/achievements" aria-current={pathname === "/achievements" ? "page" : undefined}>
                  Achievements
                </Link>
                <Link href="/settings/profile">Profile</Link>
              </>
            )}
            {!session && (
              <Link href="/login" className="header-menu-signin">
                Sign in
              </Link>
            )}
          </nav>
        </details>

        {session ? (
          <details className="header-account-menu">
            <summary>
              <span className="user-dot" aria-hidden />
              <span>{session.display_name}</span>
            </summary>
            <nav aria-label="Account menu">
              <Link href="/settings/profile">Profile & settings</Link>
              <Link href="/circuits">Saved circuits</Link>
              <Link href="/achievements">Achievements</Link>
              <Link href="/coach">Coach</Link>
            </nav>
          </details>
        ) : (
          <div className="header-user-badge">
            <Link className="account-link" href="/login">
              Sign In ↗
            </Link>
          </div>
        )}
      </header>
      <PageBreadcrumbs />
    </div>
  );
}
