type Vector = { x: number; y: number; z: number };

/** Visual interpolation between snapshots, not a simulation of a gate Hamiltonian. */
export function interpolateBloch(from: Vector, to: Vector, fraction: number): Vector {
  const t = Math.max(0, Math.min(1, fraction));
  if (t === 0) return from;
  if (t === 1) return to;
  const a = [from.x, from.y, from.z];
  const b = [to.x, to.y, to.z];
  const ra = Math.hypot(...a), rb = Math.hypot(...b);
  if (ra < 1e-8 || rb < 1e-8) return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, z: a[2] + (b[2] - a[2]) * t };
  const u = a.map((v) => v / ra), v = b.map((value) => value / rb);
  const dot = Math.max(-1, Math.min(1, u.reduce((sum, value, i) => sum + value * v[i], 0)));
  let direction: number[];
  if (dot < -0.9995) {
    const axis = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const cross = [u[1] * axis[2] - u[2] * axis[1], u[2] * axis[0] - u[0] * axis[2], u[0] * axis[1] - u[1] * axis[0]];
    const length = Math.hypot(...cross);
    direction = u.map((value, i) => value * Math.cos(Math.PI * t) + cross[i] / length * Math.sin(Math.PI * t));
  } else if (dot > 0.9995) {
    direction = u.map((value, i) => value + (v[i] - value) * t);
  } else {
    const angle = Math.acos(dot);
    direction = u.map((value, i) => (Math.sin((1 - t) * angle) * value + Math.sin(t * angle) * v[i]) / Math.sin(angle));
  }
  const radius = ra + (rb - ra) * t;
  const scale = radius / Math.hypot(...direction);
  return { x: direction[0] * scale, y: direction[1] * scale, z: direction[2] * scale };
}
