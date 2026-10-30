import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PageHeading } from "@/components/ui/QuantumUI";
import "@/app/lab/science.css";

export function ProductPage({ title, eyebrow, description, children, actions, className = "" }: { title: string; eyebrow: string; description: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return <><SiteHeader /><main className={`content-shell science-shell product-page ${className}`}><PageHeading title={title} eyebrow={eyebrow} description={description} actions={actions} />{children}<nav className="q-ui-workspace-links" aria-label="Supporting workspace"><Link href="/lab">Labs</Link><Link href="/missions">Missions</Link><Link href="/notebook">Notebook</Link></nav></main></>;
}

export function ResourceState({ loading, error, reload }: { loading: boolean; error: string; reload: () => void }) {
  return <>{loading && <p role="status">Loading…</p>}{error && <p className="content-error" role="alert">{error} <button type="button" onClick={reload}>Retry</button></p>}</>;
}
