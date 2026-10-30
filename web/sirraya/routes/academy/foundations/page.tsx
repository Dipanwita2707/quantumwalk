import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FoundationActivities } from "@/components/FoundationActivities";

export default function AcademyFoundationsPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell academy-hub">
        <p className="eyebrow">MATH & PHYSICS SPINE</p>
        <h1>Quantum foundations, through experiments</h1>
        <p className="content-intro">
          Explore amplitudes, readouts, joint states, and reversible gates. Each activity runs here, with controls,
          visual feedback, and a short understanding check. No sign-in is needed to explore.
        </p>
        <FoundationActivities />
        <Link className="card-action" href="/learn">
          ← Academy hub
        </Link>
      </main>
    </>
  );
}
