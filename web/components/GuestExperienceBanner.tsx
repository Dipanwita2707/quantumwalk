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
      body: "Build and run circuits on the public demo simulator (up to 5 qubits). Sign in to save, export, and compare engines.",
    },
    learn: {
      title: "Preview mode",
      body: "Lessons and embedded demos work without an account. Sign in to save quiz scores, XP, and progress.",
    },
    explorer: {
      title: "Explorer preview",
      body: "Explore concepts and run live Grover TSP sampling when the API is online. Build guest circuits in the Lab; sign in to save them.",
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
