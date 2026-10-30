"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/api";
import { isPublicPath } from "@/lib/publicRoutes";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, error, refresh } = useSession();
  const publicPage = isPublicPath(pathname);
  useEffect(() => {
    if (!publicPage && !loading && profile && !profile.authenticated) {
      router.replace(`/login?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [publicPage, loading, profile, router]);
  if (publicPage) return children;
  // Keep an already authenticated page mounted during a background session refresh.
  if (!profile?.authenticated) {
    return (
      <main className="access-state">
        <Link className="brand" href="/">
          ◇ QuantumWalk
        </Link>
        <h1>{error ? "Your lab is temporarily unavailable" : "Opening your private lab…"}</h1>
        <p role="status">{error || "Checking your secure session."}</p>
        {error && (
          <button className="primary-action" type="button" onClick={() => void refresh()}>
            Try again
          </button>
        )}
        <Link href="/">Back to home</Link>
      </main>
    );
  }
  return children;
}
