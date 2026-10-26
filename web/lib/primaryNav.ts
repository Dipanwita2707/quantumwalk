/** Five primary app destinations (Phase 1 IA). URLs unchanged; grouping is navigational only. */

export type PrimaryNavId = "home" | "learn" | "lab" | "explore" | "tools";

export type PrimaryNavItem = {
  id: PrimaryNavId;
  title: string;
  href: string;
};

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: "home", title: "Home", href: "/dashboard" },
  { id: "learn", title: "Learn", href: "/learn" },
  { id: "lab", title: "Lab", href: "/workspace?mode=circuit" },
  { id: "explore", title: "Explore", href: "/explorer" },
  { id: "tools", title: "Tools", href: "/hub" },
];

/** Exactly one primary item is active; mutually exclusive prefixes. */
export function getPrimaryNavActiveId(pathname: string): PrimaryNavId | null {
  if (pathname.startsWith("/hub")) return "tools";
  if (pathname.startsWith("/explorer")) return "explore";
  if (pathname.startsWith("/workspace") || pathname === "/studio") return "lab";
  if (
    pathname.startsWith("/learn") ||
    pathname.startsWith("/academy") ||
    pathname.startsWith("/challenges") ||
    pathname.startsWith("/algorithms")
  ) {
    return "learn";
  }
  if (pathname === "/dashboard" || pathname === "/") return "home";
  return null;
}

export function isPrimaryNavActive(id: PrimaryNavId, pathname: string): boolean {
  return getPrimaryNavActiveId(pathname) === id;
}
