import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function AcademyReservoirPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell academy-hub">
        <p className="eyebrow">QUANTUM RESERVOIR COMPUTING</p>
        <h1>Disordered dynamics as a feature map</h1>
        <p className="content-intro">
          Sirraya&apos;s Academy curriculum lists lesson 17 &quot;Quantum Reservoir Computing &amp; QML&quot; (title only in
          capture E017). QuantumWalk provides an educational echo-state simulation — not Sirraya&apos;s proprietary demo
          and not live quantum hardware.
        </p>
        <section className="content-card">
          <h2>Core idea</h2>
          <p>
            Feed a classical time series into a high-dimensional dynamical system. After it evolves, measure features and
            train a simple classical readout. Quantum reservoir proposals replace the dynamics with a quantum system; here
            we use a transparent classical stand-in.
          </p>
        </section>
        <section className="content-card">
          <h2>Try the lab</h2>
          <p>
            Adjust leak rate and hidden size, rerun the readout, and compare test error to a mean baseline. Pair with the{" "}
            <Link href="/learn/quantum-reservoir">reservoir lesson</Link> and the noise lesson for hardware context.
          </p>
          <Link className="card-action" href="/academy/labs/reservoir">
            Open reservoir lab (simulation) →
          </Link>
        </section>
        <div className="academy-tiles">
          <article className="content-card academy-tile">
            <h2>
              <Link href="/learn/pedagogy-noise">Pedagogical noise lesson</Link>
            </h2>
            <Link className="card-action" href="/learn/pedagogy-noise">
              Open →
            </Link>
          </article>
          <article className="content-card academy-tile">
            <h2>
              <Link href="/learn/entanglement">Entanglement lesson</Link>
            </h2>
            <Link className="card-action" href="/learn/entanglement">
              Open →
            </Link>
          </article>
        </div>
        <Link className="card-action" href="/learn">
          ← Academy hub
        </Link>
      </main>
    </>
  );
}
