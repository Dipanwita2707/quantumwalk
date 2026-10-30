"use client";

import { useState } from "react";
import { useSession } from "@/lib/api";
import { useResource } from "@/components/useResource";
import { ResourceState } from "@/components/ProductPage";
import { ActionLink, Surface } from "./QuantumUI";
import { SegmentedControl } from "./SegmentedControl";
import "./leaderboard.css";

export function LeaderboardPanel({ compact = false }: { compact?: boolean }) {
  const { profile, loading } = useSession();
  return <Surface className="q-ui-leaderboard" aria-label="Mastery leaderboard">
    <h2>{compact ? "Mastery leaderboard" : "Validated scientific missions"}</h2>
    {loading ? <p role="status">Checking your account...</p> : profile?.authenticated ? <LeaderboardRows compact={compact} /> : <><p>Sign in to view learners who have chosen to share their validated mission rewards.</p><ActionLink tone="secondary" href="/login?return_to=%2Fchallenges">Sign in to view</ActionLink></>}
  </Surface>;
}

function LeaderboardRows({ compact }: { compact: boolean }) {
  const [period, setPeriod] = useState("week");
  const resource = useResource<{ category: string; players: { rank: number; display_name: string; xp: number }[] }>(`/api/v1/leaderboard?period=${period}`);
  return <>
    <SegmentedControl label="Leaderboard period" value={period} onChange={setPeriod} items={[{ value: "week", label: "Last 7 days" }, { value: "month", label: "Last 30 days" }]} />
    <ResourceState {...resource} />
    {!resource.loading && !resource.error && <>
      {resource.data?.players.length === 0 && <p>No participating learners have rewards in this period yet.</p>}
      <ol className="q-ui-ranking">{resource.data?.players.slice(0, compact ? 5 : undefined).map(player => <li key={player.rank}><span className="q-ui-rank">{player.rank}</span><span className="q-ui-avatar" aria-hidden="true">{player.display_name.slice(0, 1)}</span><strong>{player.display_name}</strong><span>{player.xp.toLocaleString()} XP</span></li>)}</ol>
    </>}
    <p className="q-ui-leaderboard-note">Only learners who opt in appear here. Private experiments and notes stay private.</p>
    <ActionLink tone="quiet" href={compact ? "/leaderboard" : "/settings/preferences"}>{compact ? "View leaderboard" : "Manage leaderboard consent"}</ActionLink>
  </>;
}
