"use client";

import { useEffect, useRef } from "react";

export type FlowProfile = "marketing" | "journey" | "lab" | "default";

type Props = {
  profile?: FlowProfile;
  boost?: "none" | "hero";
  paused?: boolean;
  /** Fixed full-viewport layer — do not gate on intersection. */
  fixed?: boolean;
};

function strength(profile: FlowProfile, boost: "none" | "hero") {
  const base =
    profile === "lab" ? 0.38 : profile === "marketing" ? 0.62 : profile === "journey" ? 0.78 : 0.68;
  return boost === "hero" ? Math.min(1, base * 1.22) : base;
}

/** Sitewide butter-smooth twin-orbit flow (decorative). */
export function QuantumFlowField({ profile = "default", boost = "none", paused = false, fixed = true }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const profileRef = useRef(profile);
  const boostRef = useRef(boost);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => { profileRef.current = profile; syncRef.current(); }, [profile]);
  useEffect(() => { boostRef.current = boost; syncRef.current(); }, [boost]);
  useEffect(() => { pausedRef.current = paused; syncRef.current(); }, [paused]);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const context = node.getContext("2d", { alpha: true });
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1;
    let height = 1;
    let frame = 0;
    let last = 0;
    let time = 0;

    function paint() {
      if (!context) return;
      const s = strength(profileRef.current, boostRef.current);
      context.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.48;
      const spread = Math.min(width, height) * (0.2 + s * 0.08);
      const left = cx - spread;
      const right = cx + spread;
      const orbR = Math.min(width, height) * (0.048 + s * 0.016);

      for (let i = 0; i < 28; i++) {
        const sx = ((i * 97.3) % 1000) / 1000 * width;
        const sy = ((i * 53.1) % 1000) / 1000 * height;
        const tw = (0.04 + (Math.sin(time * 0.35 + i * 0.7) + 1) * 0.04) * s;
        context.fillStyle = `rgba(140,180,255,${tw * 0.45})`;
        context.beginPath();
        context.arc(sx, sy, i % 7 === 0 ? 1.2 : 0.55, 0, Math.PI * 2);
        context.fill();
      }

      const strandCount = boostRef.current === "hero" ? 5 : 3;
      for (let strand = 0; strand < strandCount; strand++) {
        const phase = strand * 0.85 + time * (0.55 + strand * 0.04);
        const amp = orbR * (0.9 + (strand % 3) * 0.18);
        context.beginPath();
        for (let step = 0; step <= 140; step++) {
          const t = step / 140;
          const x = left + (right - left) * t;
          const wave = Math.sin(t * Math.PI * 3.2 + phase) * amp;
          const lift = Math.sin(t * Math.PI) * orbR * 0.28;
          const y = cy + wave + (strand % 2 ? lift : -lift);
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        const rgb = strand % 2 ? "87,230,234" : "162,121,255";
        context.strokeStyle = `rgba(${rgb},${0.14 + s * 0.28})`;
        context.lineWidth = strand === 0 ? 2 : 1 + (strand % 2) * 0.35;
        context.lineJoin = "round";
        context.stroke();
      }

      for (let pulse = 0; pulse < 2; pulse++) {
        const travel = (time * 0.12 + pulse * 0.5) % 1;
        const t = travel;
        const x = left + (right - left) * t;
        const wave = Math.sin(t * Math.PI * 3.2 + pulse * 0.85 + time * 0.55) * orbR;
        const y = cy + wave;
        const g = context.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, pulse ? "#c4a5ffaa" : "#9ef8f0aa");
        g.addColorStop(0.4, pulse ? "#a279ff44" : "#57e6ea44");
        g.addColorStop(1, "transparent");
        context.fillStyle = g;
        context.beginPath();
        context.arc(x, y, 14, 0, Math.PI * 2);
        context.fill();
      }

      for (const ox of [left, right] as const) {
        const inner = ox < cx ? "#e8ffff" : "#efe8ff";
        const pulse = 1 + Math.sin(time * 1.1 + (ox < cx ? 0 : 1.1)) * 0.06;
        const r = orbR * pulse;
        const glow = context.createRadialGradient(ox, cy, 0, ox, cy, r * 3.8);
        const midRgb = ox < cx ? "87,230,234" : "162,121,255";
        glow.addColorStop(0, `rgba(${midRgb},${0.32 * s})`);
        glow.addColorStop(0.2, `rgba(${midRgb},0.18)`);
        glow.addColorStop(0.55, `rgba(${midRgb},0.06)`);
        glow.addColorStop(1, "transparent");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(ox, cy, r * 3.8, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = inner;
        context.globalAlpha = 0.75 + s * 0.2;
        context.beginPath();
        context.arc(ox, cy, r * 0.5, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = `rgba(${midRgb},0.55)`;
        context.lineWidth = 1.2;
        context.beginPath();
        context.arc(ox, cy, r * 0.78, 0, Math.PI * 2);
        context.stroke();
        context.globalAlpha = 1;
      }

      document.documentElement.style.setProperty("--qw-flow-phase", time.toFixed(4));
    }

    function animate(timestamp: number) {
      frame = requestAnimationFrame(animate);
      if (document.hidden || pausedRef.current || reduced.matches) return;
      if (!last) last = timestamp;
      const dt = Math.min((timestamp - last) / 1000, 0.032);
      last = timestamp;
      time += dt;
      paint();
    }

    function sync() {
      cancelAnimationFrame(frame);
      last = 0;
      paint();
      if (!document.hidden && !pausedRef.current && !reduced.matches) {
        frame = requestAnimationFrame(animate);
      }
    }

    const resizeTarget = fixed ? node.parentElement ?? node : node;

    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      if (width < 2 || height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      node.width = Math.round(width * dpr);
      node.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sync();
    });

    resize.observe(resizeTarget);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    syncRef.current = sync;
    sync();

    return () => {
      cancelAnimationFrame(frame);
      syncRef.current = () => {};
      resize.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [fixed]);

  return <canvas ref={canvas} className="qw-flow-canvas" aria-hidden="true" />;
}
