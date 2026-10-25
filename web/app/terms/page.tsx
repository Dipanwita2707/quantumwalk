import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function TermsPage() {
  return <><SiteHeader /><main className="content-shell narrow policy"><p className="eyebrow">PLAIN-LANGUAGE DRAFT</p><h1>Terms of use</h1><p>This draft needs product and legal review before public launch.</p>
    <h2>Educational tool</h2><p>QuantumWalk helps you explore small quantum circuits through classical simulation. The ideal simulator and sampled measurement counts are labeled separately. The service does not provide access to a physical quantum computer at this stage.</p>
    <h2>Your work</h2><p>You control circuits saved in your account. Do not submit secrets, credentials or personal information into circuit names or tutor questions.</p>
    <h2>Responsible use</h2><p>Use the available circuit controls and resource limits as intended. Do not attempt to bypass account boundaries or overload the simulator.</p>
    <h2>Availability</h2><p>Features may change while this platform is in development. A public release needs finalized service details, contact information and legal review.</p>
    <p><Link className="card-action" href="/">Return to home →</Link></p>
  </main></>;
}
