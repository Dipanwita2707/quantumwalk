import Link from "next/link";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";

type Tone = "primary" | "secondary" | "quiet";

export function PageHeading({ title, description, eyebrow, actions }: { title: string; description?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  return <header className="q-ui-page-heading"><div>{eyebrow && <p className="q-ui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="q-ui-description">{description}</p>}</div>{actions && <div className="q-ui-heading-actions">{actions}</div>}</header>;
}

export function ActionLink({ tone = "primary", className = "", ...props }: ComponentProps<typeof Link> & { tone?: Tone }) {
  return <Link className={`q-ui-button q-ui-button-${tone} ${className}`} {...props} />;
}

export function ActionButton({ tone = "primary", className = "", type = "button", ...props }: ComponentProps<"button"> & { tone?: Tone }) {
  return <button type={type} className={`q-ui-button q-ui-button-${tone} ${className}`} {...props} />;
}

export function Surface({ as: Element = "section", className = "", ...props }: HTMLAttributes<HTMLElement> & { as?: "article" | "section" | "aside" | "div" }) {
  return <Element className={`q-ui-panel ${className}`} {...props} />;
}

export function MetricTile({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: string; icon?: ReactNode }) {
  return <div className="q-ui-metric">{icon && <span className="q-ui-metric-icon" aria-hidden="true">{icon}</span>}<strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div>;
}

export type ScienceIconName = "atom" | "home" | "book" | "flask" | "compass" | "circuit" | "trophy" | "users" | "notebook" | "settings" | "chip" | "spark";
export function ScienceIcon({ name, size = 20 }: { name: ScienceIconName; size?: number }) {
  const paths: Record<Exclude<ScienceIconName, "atom">, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" /></>,
    book: <><path d="M12 5v16M3 4h5c2 0 4 1 4 3 0-2 2-3 4-3h5v15h-5c-2 0-4 1-4 2 0-1-2-2-4-2H3Z" /></>,
    flask: <><path d="M9 3h6M10 3v6L4 19c-.6 1 .1 2 1.2 2h13.6c1.1 0 1.8-1 1.2-2L14 9V3M7 14h10" /><circle cx="10" cy="17" r=".6" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6Z" /></>,
    circuit: <><path d="M2 7h5m6 0h9M2 17h13m6 0h1M10 10v4M18 7v7" /><rect x="7" y="4" width="6" height="6" rx="1" /><circle cx="18" cy="17" r="3" /></>,
    trophy: <><path d="M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5M8 21h8M9 19h6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2" /></>,
    notebook: <><rect x="5" y="3" width="15" height="18" rx="2" /><path d="M8 3v18M3 7h4M3 12h4M3 17h4M11 8h6M11 12h6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m10 3-1 3-3 1-3 3 2 2-1 4 3 1 2 4 3-1 3 1 2-4 3-1-1-4 2-2-3-3-3-1-1-3Z" /></>,
    chip: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /><rect x="9" y="9" width="6" height="6" rx="1" /></>,
    spark: <><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === "atom" ? <><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></> : paths[name]}</svg>;
}
