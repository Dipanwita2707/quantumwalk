"use client";

import { useEffect, useRef } from "react";

export type FieldMode = "superposition" | "entanglement" | "interference";

/** A decorative, projected 3D particle scene. Scientific results live in the lab. */
export function QuantumField({ mode, paused }: { mode: FieldMode; paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const pausedRef = useRef(paused);
  const pointer = useRef({ x: 0, y: 0 });
  const redraw = useRef<() => void>(() => {});
  useEffect(() => { modeRef.current = mode; redraw.current(); }, [mode]);
  useEffect(() => { pausedRef.current = paused; redraw.current(); }, [paused]);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const context = node.getContext("2d", { alpha: true });
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1, height = 1, visible = true, frame = 0, last = 0, time = 0;
    let cameraX = 0, cameraY = 0;
    const points = Array.from({ length: 540 }, (_, i) => {
      const y = 1 - (i / 539) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius, phase: i * 0.71 };
    });
    const stars = Array.from({ length: 70 }, (_, i) => ({ x: ((i * 73.37) % 100) / 100, y: ((i * 39.83) % 100) / 100, size: i % 3 === 0 ? 1.2 : 0.6 }));

    function paint() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width * 0.36, height * 0.35);
      const selected = modeRef.current;
      const yaw = time * 0.12 + cameraX * 0.22;
      const tilt = -0.22 + cameraY * 0.15;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
      function project(x: number, y: number, z: number) {
        const rx = x * cy + z * sy;
        const rz = z * cy - x * sy;
        const ry = y * ct - rz * st;
        const depth = y * st + rz * ct;
        const perspective = 3.8 / (3.8 + depth);
        return { x: width / 2 + rx * scale * perspective, y: height / 2 + ry * scale * perspective, depth, perspective };
      }
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        context.fillStyle = `rgba(179,202,237,${0.15 + (Math.sin(time * 0.4 + i) + 1) * 0.13})`;
        context.beginPath(); context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2); context.fill();
      }
      // Continuous orbital ribbons give the scene depth without a 3D dependency.
      const ribbons = selected === "interference" ? 12 : 7;
      for (let ring = 0; ring < ribbons; ring++) {
        context.beginPath();
        for (let j = 0; j <= 180; j++) {
          const a = j / 180 * Math.PI * 2;
          const r = 1.12 + ring * 0.032;
          let x = Math.cos(a) * r, y = Math.sin(a) * r, z = Math.sin(a * 2 + time * 0.45 + ring * 0.15) * 0.13;
          const inclination = ring * 0.4 + 0.3;
          const originalY = y;
          y = y * Math.cos(inclination) + z * Math.sin(inclination);
          z = z * Math.cos(inclination) - originalY * Math.sin(inclination);
          if (selected === "interference") {
            x *= 1.08; y += Math.sin(a * 4 + time + ring * 0.5) * 0.17;
          }
          const p = project(x, y, z);
          if (j === 0) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
        }
        context.strokeStyle = ring % 2 ? "rgba(148,107,252,0.28)" : "rgba(106,238,239,0.22)";
        context.lineWidth = ring % 3 === 0 ? 1.2 : 0.65; context.stroke();
      }
      const clouds = selected === "entanglement" ? 2 : 1;
      for (let cloud = 0; cloud < clouds; cloud++) {
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          const pulse = 1 + Math.sin(point.phase + time * 0.8) * 0.035;
          const radius = clouds === 2 ? 0.52 : 0.94;
          let x = point.x * pulse * radius + (clouds === 2 ? (cloud ? 0.62 : -0.62) : 0);
          let y = point.y * pulse * radius;
          let z = point.z * pulse * radius;
          if (selected === "interference") {
            const wave = Math.sin(point.y * 8 + time * 1.2) * 0.23;
            x += wave; z += wave * 0.65;
          }
          const p = project(x, y, z);
          const alpha = Math.max(0.12, Math.min(0.85, 0.47 - p.depth * 0.3));
          context.fillStyle = (cloud || i % 4 === 0) ? `rgba(179,143,255,${alpha})` : `rgba(108,237,235,${alpha})`;
          const size = (i % 19 === 0 ? 2.4 : 1.1) * p.perspective;
          context.beginPath(); context.arc(p.x, p.y, size, 0, Math.PI * 2); context.fill();
        }
      }
      if (selected === "entanglement") {
        for (let strand = 0; strand < 8; strand++) {
          context.beginPath();
          for (let j = 0; j <= 90; j++) {
            const t = j / 90;
            const x = -0.78 + t * 1.56;
            const helix = Math.sin(t * Math.PI * 5 - time * 1.45 + strand * 0.72) * (0.14 + strand * 0.012);
            const p = project(x, helix, Math.cos(t * Math.PI * 3 + strand) * 0.08);
            if (!j) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
          }
          context.strokeStyle = strand % 2 ? "rgba(106,238,239,0.32)" : "rgba(179,143,255,0.28)";
          context.lineWidth = strand < 2 ? 1.6 : 0.85;
          context.stroke();
        }
        for (let pulse = 0; pulse < 4; pulse++) {
          const t = (time * 0.28 + pulse * 0.25) % 1;
          const x = -0.78 + t * 1.56;
          const y = Math.sin(t * Math.PI * 5 - time * 1.45 + pulse) * 0.14;
          const p = project(x, y, 0);
          const spark = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
          spark.addColorStop(0, pulse % 2 ? "#b4fffa" : "#d4b8ff");
          spark.addColorStop(0.4, "transparent");
          context.fillStyle = spark;
          context.fillRect(p.x - 14, p.y - 14, 28, 28);
        }
      }
      for (let i = 0; i < 3; i++) {
        const a = time * (0.4 + i * 0.08) + i * 2.1;
        const p = project(Math.cos(a) * 1.32, Math.sin(a) * 0.5, Math.sin(a) * 1.12);
        const glow = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
        glow.addColorStop(0, i % 2 ? "#c4a5ff" : "#b4fffa"); glow.addColorStop(0.18, i % 2 ? "#b094ffb0" : "#6ff8edb0"); glow.addColorStop(1, "transparent");
        context.fillStyle = glow; context.fillRect(p.x - 15, p.y - 15, 30, 30);
      }
    }
    function animate(timestamp: number) {
      frame = 0;
      if (!visible || document.hidden || pausedRef.current || reduced.matches) return;
      if (timestamp - last >= 1000 / 30) {
        time += Math.min((timestamp - last) / 1000, 0.05);
        last = timestamp;
        cameraX += (pointer.current.x - cameraX) * 0.05;
        cameraY += (pointer.current.y - cameraY) * 0.05;
        paint();
      }
      frame = requestAnimationFrame(animate);
    }
    function sync() {
      cancelAnimationFrame(frame); frame = 0; last = performance.now();
      paint();
      if (visible && !document.hidden && !pausedRef.current && !reduced.matches) frame = requestAnimationFrame(animate);
    }
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width; height = entry.contentRect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      node.width = Math.round(width * dpr); node.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0); sync();
    });
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    resize.observe(node); observer.observe(node);
    document.addEventListener("visibilitychange", sync); reduced.addEventListener("change", sync);
    redraw.current = sync;
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", sync); reduced.removeEventListener("change", sync); redraw.current = () => {}; };
  }, []);

  return <canvas ref={canvas} className="qf-canvas" aria-hidden="true"
    onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); pointer.current = { x: (event.clientX - bounds.left) / bounds.width - 0.5, y: (event.clientY - bounds.top) / bounds.height - 0.5 }; }}
    onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }} />;
}
