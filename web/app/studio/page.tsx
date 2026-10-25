"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudioRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspace?mode=whiteboard");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#07101f",
        color: "#57e6ea",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>⚛</span>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>Loading Quantum Equation Whiteboard…</p>
      </div>
    </div>
  );
}
