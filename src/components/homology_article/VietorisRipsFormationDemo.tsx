import { useEffect, useMemo, useState } from 'react';

type Point = {
  x: number;
  y: number;
};

type Edge = [number, number];
type Triangle = [number, number, number];

const maxBallRadius = 115;
const animationStep = 1.5;

const points: Point[] = [
  { x: 80, y: 190 },
  { x: 165, y: 115 },
  { x: 250, y: 180 },
  { x: 350, y: 120 },
  { x: 435, y: 170 },
  { x: 520, y: 105 },
  { x: 470, y: 245 },
];

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildComplex(ballRadius: number): { edges: Edge[]; triangles: Triangle[] } {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();
  const edgeThreshold = ballRadius * 2;

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (distance(points[i], points[j]) <= edgeThreshold) {
        edges.push([i, j]);
        edgeSet.add(edgeKey(i, j));
      }
    }
  }

  const triangles: Triangle[] = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      for (let k = j + 1; k < points.length; k += 1) {
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

export default function VietorisRipsFormationDemo() {
  const [ballRadius, setBallRadius] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { edges, triangles } = useMemo(() => buildComplex(ballRadius), [ballRadius]);
  const epsilon = Math.round(ballRadius * 2);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setBallRadius((current) => {
        if (current >= maxBallRadius) {
          setIsPlaying(false);
          return maxBallRadius;
        }

        return Math.min(maxBallRadius, current + animationStep);
      });
    }, 35);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  return (
    <figure className="vr-figure">
      <div className="vr-demo">
        <div className="vr-toolbar">
          <label>
            radius
            <input
              type="range"
              min="0"
              max={maxBallRadius}
              value={ballRadius}
              onChange={(event) => {
                setIsPlaying(false);
                setBallRadius(Number(event.target.value));
              }}
            />
            <span>{Math.round(ballRadius)}</span>
          </label>

          <div className="vr-actions">
            <button type="button" onClick={() => setIsPlaying((current) => !current)}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setBallRadius(0);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <svg
          className="vr-canvas"
          viewBox="0 0 600 320"
          role="img"
          aria-label="Vietoris-Rips complex forming from growing balls"
        >
          <rect className="canvas-background" x="0" y="0" width="600" height="320" />

          {triangles.map(([a, b, c]) => (
            <polygon
              key={`${a}:${b}:${c}`}
              className="vr-triangle"
              points={`${points[a].x},${points[a].y} ${points[b].x},${points[b].y} ${points[c].x},${points[c].y}`}
            />
          ))}

          {points.map((point, index) => (
            <circle
              key={`ball:${index}`}
              className="vr-ball"
              cx={point.x}
              cy={point.y}
              r={ballRadius}
            />
          ))}

          {edges.map(([a, b]) => (
            <line
              key={edgeKey(a, b)}
              className="vr-edge"
              x1={points[a].x}
              y1={points[a].y}
              x2={points[b].x}
              y2={points[b].y}
            />
          ))}

          {points.map((point, index) => (
            <g key={`point:${index}`} className="vr-point">
              <circle cx={point.x} cy={point.y} r="8" />
              <text x={point.x + 12} y={point.y - 10}>
                {index}
              </text>
            </g>
          ))}
        </svg>

        <div className="vr-stats">
          <span>epsilon: {epsilon}</span>
          <span>{points.length} points</span>
          <span>{edges.length} edges</span>
          <span>{triangles.length} triangles</span>
        </div>
      </div>

      <figcaption>
        As the balls grow, intersecting pairs become edges. A triangle appears when all
        three of its edges are present.
      </figcaption>

      <style>{`
        .vr-demo {
          margin: 1rem 0;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: #fafafa;
          color: #494e59;
        }

        .vr-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem;
          border-bottom: 1px solid #ddd;
          background: #fff;
        }

        .vr-toolbar label {
          display: grid;
          grid-template-columns: auto minmax(120px, 1fr) 3ch;
          align-items: center;
          gap: 0.6rem;
          min-width: 260px;
          font-size: 0.85rem;
        }

        .vr-toolbar input {
          width: 100%;
        }

        .vr-actions {
          display: flex;
          gap: 0.5rem;
        }

        .vr-actions button {
          min-width: 4rem;
          font: inherit;
          padding: 0.25rem 0.55rem;
        }

        .vr-canvas {
          display: block;
          width: 100%;
          height: auto;
        }

        .canvas-background {
          fill: #fbfbf8;
        }

        .vr-ball {
          fill: rgba(55, 95, 159, 0.08);
          stroke: rgba(55, 95, 159, 0.35);
          stroke-width: 2;
        }

        .vr-triangle {
          fill: rgba(215, 74, 55, 0.18);
          stroke: rgba(215, 74, 55, 0.35);
          stroke-width: 1;
        }

        .vr-edge {
          stroke: #375f9f;
          stroke-width: 3;
          stroke-linecap: round;
        }

        .vr-point circle {
          fill: #f8f5eb;
          stroke: #222;
          stroke-width: 3;
        }

        .vr-point text {
          fill: #494e59;
          font-size: 14px;
          font-weight: 700;
          user-select: none;
        }

        .vr-stats {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 0.5rem 0.75rem 0.65rem;
          border-top: 1px solid #ddd;
          background: #fff;
          color: #6b7280;
          font-size: 0.8rem;
        }

        @media (max-width: 640px) {
          .vr-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .vr-toolbar label {
            min-width: 0;
          }

          .vr-actions {
            justify-content: space-between;
          }

          .vr-actions button {
            flex: 1;
          }

          .vr-stats {
            flex-wrap: wrap;
            justify-content: flex-start;
          }
        }
      `}</style>
    </figure>
  );
}
