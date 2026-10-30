import Link from "next/link";
import { ScienceIcon, type ScienceIconName } from "./QuantumUI";

const modules: { title: string; href: string; icon: ScienceIconName }[] = [
  { title: "Quantum basics", href: "/learn", icon: "atom" },
  { title: "Quantum computing", href: "/workspace?mode=circuit", icon: "chip" },
  { title: "Atomic & molecular", href: "/lab/hydrogen", icon: "flask" },
  { title: "Cosmology", href: "/lab/lensing", icon: "compass" },
  { title: "Advanced topics", href: "/academy/reservoir", icon: "circuit" },
];
export function ModuleLinks() {
  return <section className="q-ui-modules" aria-labelledby="module-links-title"><h2 id="module-links-title">Explore modules</h2><div>{modules.map(item => <Link key={item.href} href={item.href}><span aria-hidden="true"><ScienceIcon name={item.icon} size={30} /></span><strong>{item.title}</strong></Link>)}</div></section>;
}
