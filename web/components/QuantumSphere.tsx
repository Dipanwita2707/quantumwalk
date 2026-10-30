"use client";

import { useEffect, useRef, useState } from "react";
import { interpolateBloch } from "@/lib/blochMotion";
import "./quantum-sphere.css";

type Vector = { x: number; y: number; z: number };
type View = "iso" | "z" | "x";

export function QuantumSphere({ vector, label = "Interactive three-dimensional Bloch sphere", motionPaused = false, showTrajectory = false, autoRotate = true, transitionMs = 380 }: { vector: Vector; label?: string; motionPaused?: boolean; showTrajectory?: boolean; autoRotate?: boolean; transitionMs?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const vectorRef = useRef(vector);
  const trail = useRef<Vector[]>([]);
  const rotation = useRef({ x: 0.32, y: 0.78 });
  const zoom = useRef(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const redraw = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(!autoRotate);
  const [view, setActiveView] = useState<View>("iso");
  const motion = useRef({ paused: false, view: "iso" as View });
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (showTrajectory) {
      trail.current.push({ ...vector });
      if (trail.current.length > 100) trail.current.shift();
    } else {
      trail.current = [];
    }
    if (reduced || motionPaused) {
      vectorRef.current = vector;
      redraw.current();
      return;
    }
    const from = { ...vectorRef.current };
    const to = vector;
    const start = performance.now();
    const duration = Math.max(1, transitionMs);
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t * (2 - t);
      vectorRef.current = interpolateBloch(from, to, ease);
      redraw.current();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [vector.x, vector.y, vector.z, showTrajectory, motionPaused, transitionMs]);
  useEffect(() => { motion.current = { paused: paused || motionPaused, view }; redraw.current(); }, [paused, motionPaused, view]);

  useEffect(() => {
    const canvasEl = canvas.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, visible = true, frame = 0, last = 0;
    const canAnimate = () => visible && !document.hidden && !motion.current.paused && !reduced.matches && motion.current.view === "iso" && !drag.current;
    function paint() {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.3, height * 0.3) * zoom.current;
      const cx = width / 2, cy = height * 0.5;
      const yaw = rotation.current.y, pitch = rotation.current.x;
      function project(x: number, y: number, z: number) {
        const horizontal = x * Math.cos(yaw) - y * Math.sin(yaw);
        const depth = x * Math.sin(yaw) + y * Math.cos(yaw);
        const vertical = z * Math.cos(pitch) - depth * Math.sin(pitch);
        const distance = depth * Math.cos(pitch) + z * Math.sin(pitch);
        const perspective = 4.8 / (4.8 - distance);
        return { x: cx + horizontal * radius * perspective, y: cy - vertical * radius * perspective, depth: distance };
      }
      function line(a: Vector, b: Vector, color: string, thickness = 1) {
        const p = project(a.x, a.y, a.z), q = project(b.x, b.y, b.z);
        ctx!.beginPath(); ctx!.moveTo(p.x, p.y); ctx!.lineTo(q.x, q.y); ctx!.strokeStyle = color; ctx!.lineWidth = thickness; ctx!.stroke();
      }
      function beacon(p: { x: number; y: number }, color: string, size = 4) {
        const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 5);
        glow.addColorStop(0, "#ffffff"); glow.addColorStop(0.12, color); glow.addColorStop(1, "transparent");
        ctx!.fillStyle = glow; ctx!.fillRect(p.x - size * 5, p.y - size * 5, size * 10, size * 10);
        ctx!.fillStyle = color; ctx!.beginPath(); ctx!.arc(p.x, p.y, size * 0.65, 0, Math.PI * 2); ctx!.fill();
      }
      // Perspective floor is decorative; axes and the state vector use the same projection.
      for (let grid = -5; grid <= 5; grid++) {
        line({ x: grid * 0.45, y: -2.25, z: -1.2 }, { x: grid * 0.45, y: 2.25, z: -1.2 }, "#6688a51b");
        line({ x: -2.25, y: grid * 0.45, z: -1.2 }, { x: 2.25, y: grid * 0.45, z: -1.2 }, "#6688a51b");
      }
      const haze = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius * 1.65);
      haze.addColorStop(0, "#b957ad12"); haze.addColorStop(0.5, "#506ea414"); haze.addColorStop(1, "transparent");
      ctx.fillStyle = haze; ctx.fillRect(0, 0, width, height);
      const glass = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.5, 2, cx, cy, radius * 1.04);
      glass.addColorStop(0, "#d5e8ff17"); glass.addColorStop(0.55, "#798bd00c"); glass.addColorStop(0.93, "#b7b4e713"); glass.addColorStop(1, "#a3b8df24");
      ctx.fillStyle = glass; ctx.beginPath(); ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2); ctx.fill();
      // Dotted great circles: brighter near the viewer, quieter on the far hemisphere.
      for (let ring = 0; ring < 5; ring++) {
        for (let step = 0; step < 100; step++) {
          const a = step / 100 * Math.PI * 2;
          const p = ring === 0 ? project(Math.cos(a), Math.sin(a), 0)
            : project(Math.sin(a) * Math.cos((ring - 1) * Math.PI / 4), Math.sin(a) * Math.sin((ring - 1) * Math.PI / 4), Math.cos(a));
          ctx.fillStyle = p.depth > 0 ? (ring === 0 ? "#b7dbed9c" : "#c3b1d780") : "#b5c8e52a";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.depth > 0 ? 1.05 : 0.65, 0, Math.PI * 2); ctx.fill();
        }
      }
      const origin = { x: 0, y: 0, z: 0 };
      const axes = [
        { vector: { x: 1.37, y: 0, z: 0 }, text: "X", state: "|+⟩", color: "#fa9372" },
        { vector: { x: 0, y: 1.37, z: 0 }, text: "Y", state: "|+i⟩", color: "#9fdc8b" },
        { vector: { x: 0, y: 0, z: 1.38 }, text: "Z", state: "|0⟩", color: "#83aaff" },
      ];
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const axis of axes) {
        line({ x: -axis.vector.x * 0.85, y: -axis.vector.y * 0.85, z: -axis.vector.z * 0.85 }, axis.vector, axis.color + "60");
        const end = project(axis.vector.x, axis.vector.y, axis.vector.z);
        ctx.fillStyle = axis.color; ctx.font = "600 16px Arial"; ctx.fillText(axis.text, end.x, end.y - 13);
        ctx.font = "10px monospace"; ctx.fillText(axis.state, end.x, end.y + 5);
        const unit = project(axis.vector.x / 1.37, axis.vector.y / 1.37, axis.vector.z / 1.38);
        ctx.beginPath(); ctx.arc(unit.x, unit.y, 4, 0, Math.PI * 2); ctx.strokeStyle = axis.color + "b0"; ctx.lineWidth = 1; ctx.stroke();
      }
      const south = project(0, 0, -1.15);
      ctx.fillStyle = "#aab9d1"; ctx.font = "11px monospace"; ctx.fillText("|1⟩", south.x, south.y + 12);
      const state = vectorRef.current;
      const length = Math.hypot(state.x, state.y, state.z);
      const center = project(0, 0, 0);
      // Only recorded demo states generate trails; arbitrary circuit steps are never interpolated.
      for (let i = 1; i < trail.current.length; i++) {
        line(trail.current[i - 1], trail.current[i], `rgba(113,231,237,${i / trail.current.length * 0.6})`, 1.8);
      }
      function drawArrowhead(from: { x: number; y: number }, to: { x: number; y: number }, color: string, size = 14) {
        const direction = Math.atan2(to.y - from.y, to.x - from.x);
        ctx!.beginPath();
        ctx!.moveTo(to.x, to.y);
        ctx!.lineTo(to.x - size * Math.cos(direction - 0.42), to.y - size * Math.sin(direction - 0.42));
        ctx!.lineTo(to.x - size * 0.55 * Math.cos(direction), to.y - size * 0.55 * Math.sin(direction));
        ctx!.lineTo(to.x - size * Math.cos(direction + 0.42), to.y - size * Math.sin(direction + 0.42));
        ctx!.closePath();
        ctx!.fillStyle = color;
        ctx!.fill();
        ctx!.strokeStyle = "#ffffff88";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      if (length > 0.001) {
        const nx = state.x / length;
        const ny = state.y / length;
        const nz = state.z / length;
        const unit = { x: nx, y: ny, z: nz };
        const tip = project(state.x, state.y, state.z);
        const tipU = project(nx, ny, nz);
        ctx.setLineDash([2, 5]);
        line(unit, { x: nx, y: ny, z: 0 }, "#f6a4d4cc", 1.5);
        line(origin, { x: nx, y: ny, z: 0 }, "#f6a4d499", 1.2);
        ctx.setLineDash([]);
        const theta = Math.acos(Math.max(-1, Math.min(1, nz)));
        const phi = Math.atan2(ny, nx);
        const azimuthDefined = Math.hypot(nx, ny) > 0.001;
        const arc = (polar: boolean) => {
          ctx.beginPath();
          for (let i = 0; i <= 35; i++) {
            const a = (polar ? theta : phi) * i / 35;
            const p = polar
              ? project(0.38 * Math.sin(a) * Math.cos(phi), 0.38 * Math.sin(a) * Math.sin(phi), 0.38 * Math.cos(a))
              : project(0.3 * Math.cos(a), 0.3 * Math.sin(a), 0);
            if (!i) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = polar ? "#f7afd6b0" : "#94eff2a0";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        };
        arc(true);
        if (azimuthDefined) arc(false);
        const shaftFrom = center;
        const shaftMid = project(state.x * 0.12, state.y * 0.12, state.z * 0.12);
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#ff5ec8";
        ctx.beginPath();
        ctx.moveTo(shaftFrom.x, shaftFrom.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = "#ff5ec8";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
        drawArrowhead(shaftMid, tipU, "#ff8ad9", 18);
        beacon(tipU, "#ff8ad9", 6);
        ctx.fillStyle = "#ffc8ea";
        ctx.font = "600 11px ui-monospace, monospace";
        ctx.fillText("state →", Math.min(tipU.x + 10, width - 52), tipU.y - 10);
      } else {
        ctx.beginPath();
        ctx.arc(center.x, center.y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = "#94a3b866";
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText("Mixed local state — no arrow", center.x, center.y + 36);
      }
      beacon(center, length > 0.001 ? "#c5edf5" : "#ffc2e6", 3);
    }
    function animate(now: number) {
      frame = 0;
      if (!canAnimate()) return;
      if (now - last >= 1000 / 30) { rotation.current.y += Math.min(now - last, 50) * 0.00012; last = now; paint(); }
      frame = requestAnimationFrame(animate);
    }
    function invalidate() {
      if (!visible || document.hidden) { cancelAnimationFrame(frame); frame = 0; return; }
      if (!canAnimate()) { cancelAnimationFrame(frame); frame = 0; paint(); }
      else if (!frame) { paint(); last = performance.now(); frame = requestAnimationFrame(animate); }
    }
    function syncCanvasSize() {
      const el = canvas.current;
      const context = el?.getContext("2d");
      if (!el || !context) return;
      const rect = el.getBoundingClientRect();
      width = Math.max(280, rect.width || el.clientWidth || 320);
      height = Math.max(200, rect.height || el.clientHeight || 320);
      const ratio = Math.min(devicePixelRatio || 1, 2);
      el.width = Math.round(width * ratio);
      el.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint();
      invalidate();
    }
    const size = new ResizeObserver(() => syncCanvasSize());
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) syncCanvasSize();
      else invalidate();
    });
    size.observe(canvasEl.parentElement ?? canvasEl);
    intersection.observe(canvasEl);
    syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);
    document.addEventListener("visibilitychange", invalidate); reduced.addEventListener("change", invalidate);
    redraw.current = invalidate;
    return () => {
      cancelAnimationFrame(frame);
      size.disconnect();
      intersection.disconnect();
      window.removeEventListener("resize", syncCanvasSize);
      document.removeEventListener("visibilitychange", invalidate);
      reduced.removeEventListener("change", invalidate);
      redraw.current = () => {};
    };
  }, []);

  function setView(preset: View) {
    zoom.current = 1;
    setActiveView(preset);
    rotation.current = preset === "z" ? { x: Math.PI / 2, y: 0 } : preset === "x" ? { x: 0, y: Math.PI / 2 } : { x: 0.32, y: 0.78 };
    redraw.current();
  }
  const length = Math.hypot(vector.x, vector.y, vector.z);
  const theta = length > 0.001 ? `${Math.round(Math.acos(Math.max(-1, Math.min(1, vector.z / length))) * 180 / Math.PI)}°` : "—";
  const phi = Math.hypot(vector.x, vector.y) > 0.001 ? `${Math.round((Math.atan2(vector.y, vector.x) * 180 / Math.PI + 360) % 360)}°` : "—";
  const purity = Math.min(1, (1 + length ** 2) / 2);
  function changeZoom(factor: number) {
    zoom.current = Math.max(0.65, Math.min(1.3, zoom.current * factor));
    redraw.current();
  }
  function endPointer(id: number) {
    pointers.current.delete(id);
    pinch.current = 0;
    drag.current = pointers.current.values().next().value ?? null;
    redraw.current();
  }
  return <div className="quantum-sphere qs-hologram">
    <div className="sphere-canvas-wrap"><canvas ref={canvas} role="img" aria-label={`${label}. Bloch vector x ${vector.x.toFixed(2)}, y ${vector.y.toFixed(2)}, z ${vector.z.toFixed(2)}.`}
      onPointerDown={(event) => { pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; pinch.current = Math.hypot(a.x - b.x, a.y - b.y); } redraw.current(); }}
      onPointerMove={(event) => {
        if (!pointers.current.has(event.pointerId) || !drag.current) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2) {
          const [a, b] = [...pointers.current.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinch.current > 0) changeZoom(distance / pinch.current);
          pinch.current = distance;
        } else if (event.shiftKey) changeZoom(Math.exp((drag.current.y - event.clientY) * 0.006));
        else { rotation.current.y += (event.clientX - drag.current.x) * 0.008; rotation.current.x = Math.max(-1.5, Math.min(1.5, rotation.current.x + (event.clientY - drag.current.y) * 0.008)); }
        drag.current = { x: event.clientX, y: event.clientY }; redraw.current();
      }}
      onPointerUp={(event) => endPointer(event.pointerId)} onPointerCancel={(event) => endPointer(event.pointerId)} onLostPointerCapture={(event) => endPointer(event.pointerId)} />
      <div className="sphere-angles-badge"><span>θ {theta}</span><span>φ {phi}</span><span className="purity-badge">{length >= 0.999 ? "Pure state" : `Purity ${(purity * 100).toFixed(0)}%`}</span></div>
    </div>
    <div className="sphere-controls"><div className="sphere-presets">{([['iso', '3D'], ['z', '+Z view'], ['x', '+X view']] as const).map(([id, title]) => <button type="button" key={id} className={view === id ? "active-preset" : ""} aria-pressed={view === id} onClick={() => setView(id)}>{title}</button>)}</div><div className="sphere-actions"><button type="button" aria-label="Rotate sphere left" onClick={() => { rotation.current.y -= 0.3; redraw.current(); }}>↶</button><button type="button" aria-label="Rotate sphere right" onClick={() => { rotation.current.y += 0.3; redraw.current(); }}>↷</button><button type="button" className="sphere-pause-btn" aria-pressed={paused || motionPaused} disabled={motionPaused} onClick={() => setPaused(!paused)}>{paused || motionPaused ? "▷ Rotate" : "Ⅱ Pause"}</button></div></div>
    <div className="sphere-depth-controls"><button type="button" onClick={() => changeZoom(1 / 1.1)}>− Push away</button><button type="button" onClick={() => changeZoom(1.1)}>+ Pull closer</button></div>
    <p className="qs-bloch-legend">Magenta arrow = Bloch vector (quantum state direction)</p>
    <p className="qs-hint">Drag to orbit · Shift + drag or pinch to zoom<br />Camera motion does not change the quantum state.</p>
    {!autoRotate && <p className="qs-hint">Gate snapshots are exact. Motion between steps is a visual transition.</p>}
  </div>;
}
