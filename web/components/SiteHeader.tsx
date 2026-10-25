"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/api";

export function SiteHeader() {
  const { profile } = useSession();
  const pathname = usePathname();

  const navLinks = [
    ...(profile?.authenticated ? [{ title: "Dashboard", href: "/dashboard", id: "dashboard" }] : []),
    { title: "Lab", href: "/workspace?mode=circuit", id: "lab" },
    { title: "Learn", href: "/learn", id: "learn" },
    { title: "Challenges", href: "/challenges", id: "challenges" },
    { title: "Library", href: "/algorithms", id: "algorithms" },
  ];

  function checkIsActive(id: string): boolean {
    if (id === "dashboard") return pathname === "/dashboard";
    if (id === "lab") return pathname.startsWith("/workspace") || pathname === "/studio";
    if (id === "algorithms") return pathname.startsWith("/algorithms");
    if (id === "learn") return pathname.startsWith("/learn");
    if (id === "challenges") return pathname.startsWith("/challenges");
    return false;
  }

  return (
    <header className={`topbar site-topbar ${profile?.authenticated ? "private-topbar" : ""}`}>
      <Link className="brand" href={profile?.authenticated ? "/dashboard" : "/workspace"}>
        <span className="brand-mark">◈</span>
        <span>
          <strong>QuantumWalk</strong>
          <small>See inside a quantum algorithm</small>
        </span>
      </Link>

      <nav aria-label="Primary navigation" className="header-nav-pills">
        {navLinks.map((link) => {
          const isActive = checkIsActive(link.id);
          return link.id === "lab" ? <a key={link.id} href={link.href} aria-current={isActive ? "page" : undefined} className={`header-nav-pill ${isActive ? "active" : ""}`}>{link.title}</a> : (
            <Link
              key={link.id}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`header-nav-pill ${isActive ? "active" : ""}`}
            >
              {link.title}
            </Link>
          );
        })}
      </nav>

      <details className="header-mobile-nav">
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">
          {navLinks.map((link) => link.id === "lab" ? <a key={link.id} href={link.href} aria-current={checkIsActive(link.id) ? "page" : undefined}>{link.title}</a> : <Link key={link.id} href={link.href} aria-current={checkIsActive(link.id) ? "page" : undefined}>{link.title}</Link>)}
          <a href="/workspace?mode=whiteboard">Whiteboard</a>
          <Link href="/coach" aria-current={pathname.startsWith("/coach") ? "page" : undefined}>Coach</Link>
          {profile?.authenticated && <Link href="/circuits">Saved circuits</Link>}
          {profile?.authenticated && <Link href="/achievements" aria-current={pathname === "/achievements" ? "page" : undefined}>Achievements</Link>}
          {profile?.authenticated && <Link href="/settings/profile">Account</Link>}
        </nav>
      </details>

      <Link className="header-coach-link" href="/coach" aria-current={pathname.startsWith("/coach") ? "page" : undefined}>Coach</Link>

      {profile?.authenticated ? (
        <div className="header-user-badge">
          <Link className="account-link" href="/settings/profile" title="View profile & settings">
            <span className="user-dot" />
            <span>{profile.display_name}</span>
          </Link>
        </div>
      ) : (
        <div className="header-user-badge">
          <Link className="account-link" href="/login">
            Sign In ↗
          </Link>
        </div>
      )}
    </header>
  );
}
