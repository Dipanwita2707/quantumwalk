"use client";

import "./app-shell-nav.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/api";
import { PRIMARY_NAV, isPrimaryNavActive } from "@/lib/primaryNav";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { useEffect, useRef } from "react";

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
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const accountMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    mobileMenu.current?.removeAttribute("open");
    accountMenu.current?.removeAttribute("open");
  }, [pathname]);

  function closeOnEscape(event: React.KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape") return;
    event.currentTarget.removeAttribute("open");
    event.currentTarget.querySelector("summary")?.focus();
  }

  function skipToContent(event: React.MouseEvent<HTMLAnchorElement>) {
    const main = document.querySelector("main");
    if (!main) return;
    event.preventDefault();
    main.tabIndex = -1;
    main.focus();
    main.scrollIntoView({ block: "start" });
  }

  return (
    <div className="site-topbar-shell">
      <a className="qw-skip-link" href="#main-content" onClick={skipToContent}>Skip to main content</a>
      <header className={`topbar site-topbar ${session ? "private-topbar" : ""}`}>
        <Link className="brand" href="/">
          <svg className="brand-mark" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.4"><ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(60 16 16)" /><ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(-60 16 16)" /><ellipse cx="16" cy="16" rx="14" ry="5.5" /></g><circle cx="16" cy="16" r="2.5" fill="currentColor" /></svg>
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

        <details className="header-mobile-nav" ref={mobileMenu} onKeyDown={closeOnEscape}>
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
            <Link href="/lab">Science experiments</Link>
            <Link href="/missions">Missions</Link>
            <Link href="/community">Community</Link>
            <Link href="/pricing">Plans</Link>
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
                <Link href="/notebook">Experiment notebook</Link>
                <Link href="/billing">Billing & usage</Link>
                <Link href="/faculty">Classes</Link>
                {session.roles?.some(role => ["admin", "reviewer", "moderator"].includes(role)) && <Link href="/admin">Review console</Link>}
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
          <details className="header-account-menu" ref={accountMenu} onKeyDown={closeOnEscape}>
            <summary>
              <span className="user-dot" aria-hidden />
              <span>{session.display_name}</span>
            </summary>
            <nav aria-label="Account menu">
              <Link href="/settings/profile">Profile & settings</Link>
              <Link href="/circuits">Saved circuits</Link>
              <Link href="/achievements">Achievements</Link>
              <Link href="/coach">Coach</Link>
              <Link href="/lab">Science experiments</Link>
              <Link href="/missions">Missions</Link>
              <Link href="/notebook">Experiment notebook</Link>
              <Link href="/community">Community</Link>
              <Link href="/billing">Billing & usage</Link>
              <Link href="/faculty">Classes</Link>
              {session.roles?.some(role => ["admin", "reviewer", "moderator"].includes(role)) && <Link href="/admin">Review console</Link>}
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
      {pathname !== "/" && <PageBreadcrumbs />}
    </div>
  );
}
