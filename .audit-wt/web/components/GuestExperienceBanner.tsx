"use client";

import Link from "next/link";
import { useSession } from "@/lib/api";

export function GuestExperienceBanner({
  context,
}: {
  context: "lab" | "learn" | "explorer" | "challenge" | "dashboard";
}) {
  const { profile } = useSession();
  if (profile?.authenticated) return null;

  const copy = {
    lab: {
      title: "Demo lab mode",
      body: "Preset circuits run on the public demo simulator. Sign in to edit gates, save, export, and compare engines.",
    },
    learn: {
      title: "Preview mode",
      body: "Lessons and embedded demos work without an account. Sign in to save quiz scores, XP, and progress.",
    },
    explorer: {
      title: "Explorer preview",
      body: "Static charts and circuit previews are educational. Live Grover TSP sampling runs on the QuantumWalk API when it is online (no sign-in). Sign in for the full lab, custom circuits, and saves.",
    },
    challenge: {
      title: "Sign in to compete",
      body: "You can inspect challenges, but simulator grading and XP require Google sign-in.",
    },
    dashboard: {
      title: "Guest overview",
      body: "Browse lessons and track /start intro progress on this device. Sign in to sync XP, saved circuits, and milestones.",
    },
  }[context];

  return (
    <aside className="qw-guest-banner" role="note" aria-label="Account status">
      <div>
        <span className="panel-kicker">GUEST</span>
        <strong>{copy.title}</strong>
        <p>{copy.body}</p>
      </div>
      <Link className="card-action" href="/login">
        Sign in →
      </Link>
    </aside>
  );
}
