import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function PrivacyPage() {
  return <><SiteHeader /><main className="content-shell narrow policy"><p className="eyebrow">PLAIN-LANGUAGE DRAFT</p><h1>Privacy notice</h1><p>This draft describes the current app behavior and needs review before a public launch.</p>
    <h2>Public introduction and private workspace</h2><p>The landing page offers a local qubit concept preview. The introductory slideshow adapts two short reads and two questions to your chosen level. Its answers stay in page memory and are not saved. Building circuits, running simulations, the full learning path, challenges, and using the tutor require sign-in. Your workspace and saved results are not public.</p>
    <h2>Google sign-in</h2><p>When configured, Google provides a stable account identifier, verified email, display name and optional profile image. QuantumWalk stores these fields to create your account. It does not request Google Drive or Gmail access.</p>
    <h2>Saved work</h2><p>Your circuits and learning progress are private to your account. The API checks ownership before returning or changing them. You can export your data or delete your account in profile settings.</p>
    <h2>AI and hardware</h2><p>The public introduction offers an optional Explain with AI button. Clicking it sends only the public lesson topic and your selected experience level through the configured AI provider (currently OpenRouter) to its selected model provider. Your quiz answers, identity, and circuits are excluded. Introduction points and sampled trials stay in page memory. The private circuit coach uses local explanations by default. If you enable AI for a question, your question and current circuit are sent to the configured provider. Account identity and your other saved circuits are not included. Provider retention policies apply. Real quantum hardware is not connected.</p>
    <h2>Operational data</h2><p>Technical hosting logs may contain request timing and network information. Production retention periods and contact details must be finalized before public launch. OAuth tokens and session identifiers should never be logged.</p>
    <p><Link className="card-action" href="/settings/profile">Manage account and data →</Link></p>
  </main></>;
}
