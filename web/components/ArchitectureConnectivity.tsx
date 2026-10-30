type Topology = "planar" | "all-to-all" | "grid";

export function ArchitectureConnectivity({ topology, label }: { topology: Topology; label: string }) {
  const nodes =
    topology === "all-to-all"
      ? [
          { cx: 50, cy: 30 },
          { cx: 20, cy: 70 },
          { cx: 80, cy: 70 },
        ]
      : topology === "grid"
        ? [
            { cx: 30, cy: 30 },
            { cx: 70, cy: 30 },
            { cx: 30, cy: 70 },
            { cx: 70, cy: 70 },
          ]
        : [
            { cx: 25, cy: 50 },
            { cx: 50, cy: 50 },
            { cx: 75, cy: 50 },
          ];

  const edges: [number, number][] =
    topology === "all-to-all"
      ? [
          [0, 1],
          [0, 2],
          [1, 2],
        ]
      : topology === "grid"
        ? [
            [0, 1],
            [0, 2],
            [1, 3],
            [2, 3],
          ]
        : [
            [0, 1],
            [1, 2],
          ];

  return (
    <svg className="arch-connectivity" viewBox="0 0 100 100" role="img" aria-label={label}>
      <title>{label}</title>
      {edges.map(([a, b], index) => (
        <line
          key={index}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="#57e6ea55"
          strokeWidth="2"
        />
      ))}
      {nodes.map((node, index) => (
        <circle key={index} cx={node.cx} cy={node.cy} r="6" fill="#8cf5e2" stroke="#0b1428" strokeWidth="2" />
      ))}
    </svg>
  );
}
