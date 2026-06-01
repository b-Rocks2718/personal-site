import { useMemo, useRef, useState } from 'react';

type Point = {
  x: number;
  y: number;
};

type Edge = [number, number];
type Triangle = [number, number, number];

const maxPoints = 30;

const defaultPoints: Point[] = [
  { x: 95, y: 170 },
  { x: 190, y: 105 },
  { x: 270, y: 185 },
  { x: 380, y: 135 },
  { x: 500, y: 205 },
];

function distance(a: Point, b: Point) : number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildComplex(points: Point[], radius: number) : 
    { edges: Edge[]; triangles: Triangle[] } {
  const edges: Edge[] = []; // for iterating over edges
  const edgeSet = new Set<string>(); // for quick lookup of an edge's existence

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (distance(points[i], points[j]) <= radius) {
        // j is initialized at i + 1, so i < j always holds
        edges.push([i, j]);
        edgeSet.add(edgeKey(i, j));
      }
    }
  }

  const triangles: Triangle[] = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      for (let k = j + 1; k < points.length; k += 1) {
        // similar to above, i < j < k always holds
        if (
          edgeSet.has(edgeKey(i, j)) &&
          edgeSet.has(edgeKey(i, k)) &&
          edgeSet.has(edgeKey(j, k))
        ) {
          triangles.push([i, j, k]);
        }
      }
    }
  }

  return { edges, triangles };
}

function rankMod2(matrix: number[][]): number {
  const rowCount = matrix.length;
  const colCount = matrix[0]?.length ?? 0;
  if (rowCount === 0 || colCount === 0) {
    return 0;
  }

  const rows = matrix.map((row) => row.slice());
  let rank = 0;

  for (let col = 0; col < colCount && rank < rowCount; col += 1) {
    let pivot = -1;

    for (let row = rank; row < rowCount; row += 1) {
      if (rows[row]![col] === 1) {
        pivot = row;
        break;
      }
    }

    if (pivot === -1) {
      continue;
    }

    [rows[rank], rows[pivot]] = [rows[pivot]!, rows[rank]!];

    for (let row = 0; row < rowCount; row += 1) {
      if (row === rank || rows[row]![col] === 0) {
        continue;
      }

      for (let c = col; c < colCount; c += 1) {
        rows[row]![c] ^= rows[rank]![c];
      }
    }

    rank += 1;
  }

  return rank;
}

function buildBoundary1(vertexCount: number, edges: Edge[]): number[][] {
  const boundary = Array.from({ length: vertexCount }, () => Array(edges.length).fill(0));

  edges.forEach(([a, b], edgeIndex) => {
    boundary[a]![edgeIndex] = 1;
    boundary[b]![edgeIndex] = 1;
  });

  return boundary;
}

function buildBoundary2(edges: Edge[], triangles: Triangle[]): number[][] {
  const edgeIndices = new Map<string, number>();
  edges.forEach(([a, b], index) => {
    edgeIndices.set(edgeKey(a, b), index);
  });

  const boundary = Array.from({ length: edges.length }, () => Array(triangles.length).fill(0));

  triangles.forEach(([a, b, c], triangleIndex) => {
    const boundaryEdges = [
      edgeIndices.get(edgeKey(a, b)),
      edgeIndices.get(edgeKey(a, c)),
      edgeIndices.get(edgeKey(b, c)),
    ];

    boundaryEdges.forEach((edgeIndex) => {
      if (edgeIndex !== undefined) {
        boundary[edgeIndex]![triangleIndex] = 1;
      }
    });
  });

  return boundary;
}

function computeBeta0(points: Point[], edges: Edge[]) : number {
  // beta_0 = #verts - rank(boundary_1)
  return points.length - rankMod2(buildBoundary1(points.length, edges));
}

function computeBeta1(edges: Edge[], triangles: Triangle[]) : number {
  // beta_1 = nullity(boundary_1) - rank(boundary_2)
  const rankBoundary1 = rankMod2(buildBoundary1(Math.max(0, ...edges.flat()) + 1, edges));
  const rankBoundary2 = rankMod2(buildBoundary2(edges, triangles));
  const nullityBoundary1 = edges.length - rankBoundary1;

  return nullityBoundary1 - rankBoundary2;
}

export default function SimplicialComplexDemo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<Point[]>(defaultPoints);
  const [radius, setRadius] = useState(145);
  const { edges, triangles } = useMemo(() => buildComplex(points, radius), [points, radius]);

  function addPoint(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const transform = svg?.getScreenCTM()?.inverse();
    if (!svg || !transform) {
      return;
    }

    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform);
    setPoints((current) => {
      if (current.length >= maxPoints) {
        return current;
      }

      return [...current, { x: point.x, y: point.y }];
    });
  }

  const h0_dim = computeBeta0(points, edges);
  const h1_dim = computeBeta1(edges, triangles);

  return (
    <figure className="simplicial-figure">
      <div className="simplicial-demo">
        <div className="simplicial-toolbar">
          <label>
            radius
            <input
              type="range"
              min="45"
              max="210"
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
            />
            <span>{radius}</span>
          </label>

          <div className="simplicial-actions">
            <button type="button" onClick={() => setPoints((current) => current.slice(0, -1))}>
              Undo
            </button>
            <button type="button" onClick={() => setPoints(defaultPoints)}>
              Reset
            </button>
            <button type="button" onClick={() => setPoints([])}>
              Clear
            </button>
          </div>
        </div>

        <svg
          ref={svgRef}
          className="simplicial-canvas"
          viewBox="0 0 600 320"
          role="img"
          aria-label="Interactive simplicial complex diagram"
          onPointerDown={addPoint}
        >
          <rect className="canvas-background" x="0" y="0" width="600" height="320" />

          {triangles.map(([a, b, c]) => (
            <polygon
              key={`${a}:${b}:${c}`}
              className="simplex-triangle"
              points={`${points[a].x},${points[a].y} ${points[b].x},${points[b].y} ${points[c].x},${points[c].y}`}
            />
          ))}

          {edges.map(([a, b]) => (
            <line
              key={edgeKey(a, b)}
              className="simplex-edge"
              x1={points[a].x}
              y1={points[a].y}
              x2={points[b].x}
              y2={points[b].y}
            />
          ))}

          {points.map((point, index) => (
            <g key={`${index}:${point.x}:${point.y}`} className="point">
              <circle cx={point.x} cy={point.y} r="8" />
              <text x={point.x + 12} y={point.y - 10}>
                {index}
              </text>
            </g>
          ))}
        </svg>
        
        <div className="stats-header">
         <div className="homology-stats">
            <span>dim H_0: {h0_dim}</span>
            <span>dim H_1: {h1_dim}</span>
          </div>

          <div className="simplicial-stats">
           <span>{points.length} / {maxPoints} points</span>
            <span>{edges.length} edges</span>
            <span>{triangles.length} triangles</span>
          </div>
        </div>
      </div>

      <figcaption>
        Click the window to add points. Edges appear between points within the radius, and
        triangles are filled when all three edges are present.
      </figcaption>

      <style>{`
        .simplicial-demo {
          margin: 1rem 0;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: #fafafa;
          color: #494e59;
        }

        .simplicial-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem;
          border-bottom: 1px solid #ddd;
          background: #fff;
        }

        .simplicial-toolbar label {
          display: grid;
          grid-template-columns: auto minmax(120px, 1fr) 3ch;
          align-items: center;
          gap: 0.6rem;
          min-width: 260px;
          font-size: 0.85rem;
        }

        .simplicial-toolbar input {
          width: 100%;
        }

        .simplicial-actions {
          display: flex;
          gap: 0.5rem;
        }

        .simplicial-actions button {
          font: inherit;
          padding: 0.25rem 0.55rem;
        }

        .simplicial-canvas {
          display: block;
          width: 100%;
          height: auto;
          touch-action: none;
          cursor: crosshair;
        }

        .canvas-background {
          fill: #fbfbf8;
        }

        .simplex-triangle {
          fill: rgba(215, 74, 55, 0.18);
          stroke: rgba(215, 74, 55, 0.35);
          stroke-width: 1;
          pointer-events: none;
        }

        .simplex-edge {
          stroke: #375f9f;
          stroke-width: 3;
          stroke-linecap: round;
          pointer-events: none;
        }

        .point circle {
          fill: #f8f5eb;
          stroke: #222;
          stroke-width: 3;
          pointer-events: none;
        }

        .point text {
          fill: #494e59;
          font-size: 14px;
          font-weight: 700;
          pointer-events: none;
          user-select: none;
        }

        .stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.5rem 0.75rem 0.65rem;
          border-top: 1px solid #ddd;
          background: #fff;
          color: #6b7280;
          font-size: 0.8rem;
        }

        .homology-stats {
          display: flex;
          gap: 1rem;
        }

        .simplicial-stats {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .simplicial-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .simplicial-toolbar label {
            min-width: 0;
          }

          .simplicial-actions {
            justify-content: space-between;
          }

          .simplicial-actions button {
            flex: 1;
          }
        }
      `}</style>
    </figure>
  );
}
