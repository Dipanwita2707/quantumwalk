export type BreadcrumbSegment = { label: string; href?: string };

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Home",
  learn: "Learn",
  academy: "Academy",
  explorer: "Explore",
  hub: "Tools",
  workspace: "Lab",
  challenges: "Challenges",
  algorithms: "Algorithm library",
  circuits: "Saved circuits",
  achievements: "Achievements",
  settings: "Settings",
  profile: "Profile",
  coach: "Coach",
  hardware: "Hardware",
  mapper: "Quantum Mapper",
  tsp: "TSP Explorer",
  grover: "Grover Explorer",
  reference: "Glossary",
  foundations: "Foundations",
  reservoir: "Reservoir computing",
  labs: "Labs",
  qft: "QFT lab",
  shor: "Shor lab",
  qec: "QEC lab",
  "doc-editor": "Doc editor",
  "document-pro": "Document Pro",
  "ml-studio": "ML Studio",
};

function labelForSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Accessible breadcrumb trail derived from pathname (no async lesson titles). */
export function buildBreadcrumbTrail(pathname: string): BreadcrumbSegment[] {
  const clean = pathname.split("?")[0] ?? pathname;
  if (clean === "/" || clean === "/start" || clean === "/login") return [];
  if (clean === "/dashboard") return [{ label: "Home" }];

  const parts = clean.split("/").filter(Boolean);
  const trail: BreadcrumbSegment[] = [{ label: "Home", href: "/dashboard" }];

  if (parts.length === 0) return trail;

  let pathAcc = "";
  parts.forEach((part, index) => {
    pathAcc += `/${part}`;
    const isLast = index === parts.length - 1;
    if (part === "dashboard" && parts.length === 1) {
      trail.push({ label: "Home" });
      return;
    }
    if (part === "dashboard") return;
    trail.push({
      label: labelForSegment(part),
      href: isLast ? undefined : pathAcc,
    });
  });

  return trail;
}

export function pageTitleFromTrail(trail: BreadcrumbSegment[]): string | undefined {
  if (trail.length === 0) return undefined;
  return trail[trail.length - 1]?.label;
}
