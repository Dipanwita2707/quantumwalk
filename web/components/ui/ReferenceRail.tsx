"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScienceIcon, type ScienceIconName } from "./QuantumUI";

const items: { href: string; label: string; icon: ScienceIconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/learn", label: "My learning", icon: "book" },
  { href: "/lab", label: "Simulations", icon: "flask" },
  { href: "/missions", label: "Quantum quest", icon: "compass" },
  { href: "/challenges", label: "Challenges", icon: "trophy" },
  { href: "/workspace?mode=circuit", label: "Quantum studio", icon: "circuit" },
  { href: "/community", label: "Community", icon: "users" },
  { href: "/achievements", label: "Achievements", icon: "spark" },
  { href: "/billing", label: "Subscription", icon: "chip" },
];

export function ReferenceRail({ name, level }: { name: string; level?: number | null }) {
  const pathname = usePathname();
  return <aside className="q-ui-rail"><div className="q-ui-rail-person"><span className="q-ui-avatar" aria-hidden="true">{name.slice(0, 1)}</span><div><strong>{name}</strong><small>{level ? `Level ${level}` : "Quantum explorer"}</small></div></div><nav aria-label="Learning workspace">{items.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href.split("?")[0] ? "page" : undefined}><ScienceIcon name={item.icon} size={17} />{item.label}</Link>)}</nav><div className="q-ui-rail-footer"><Link href="/notebook"><ScienceIcon name="notebook" size={17} />Notebook</Link><Link href="/settings/profile"><ScienceIcon name="settings" size={17} />Settings</Link></div></aside>;
}
