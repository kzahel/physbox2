import * as planck from "planck";

/** Maximum vertices Planck.js allows per polygon */
const MAX_VERTS = 8;

/** Minimum area (world units²) to create a polygon */
const MIN_AREA = 0.05;

/**
 * Convex hull via Andrew's monotone chain algorithm.
 * Returns vertices in CCW order.
 */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts;

  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  // Lower hull
  const lower: { x: number; y: number }[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }

  // Upper hull
  const upper: { x: number; y: number }[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }

  // Remove last point of each half (it's the first point of the other)
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Simplify a convex hull to at most `maxVerts` vertices by iteratively
 * removing the vertex whose removal loses the least area.
 */
function simplifyHull(hull: { x: number; y: number }[], maxVerts: number): { x: number; y: number }[] {
  while (hull.length > maxVerts) {
    let minArea = Infinity;
    let minIdx = 0;
    for (let i = 0; i < hull.length; i++) {
      const prev = hull[(i - 1 + hull.length) % hull.length];
      const cur = hull[i];
      const next = hull[(i + 1) % hull.length];
      // Triangle area formed by removing cur
      const area = Math.abs((next.x - prev.x) * (cur.y - prev.y) - (cur.x - prev.x) * (next.y - prev.y)) / 2;
      if (area < minArea) {
        minArea = area;
        minIdx = i;
      }
    }
    hull.splice(minIdx, 1);
  }
  return hull;
}

/** Polygon area (shoelace formula) */
function polyArea(verts: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    area += verts[i].x * verts[j].y;
    area -= verts[j].x * verts[i].y;
  }
  return Math.abs(area) / 2;
}

export function createPolygon(world: planck.World, points: { x: number; y: number }[]): planck.Body | null {
  if (points.length < 3) return null;

  let hull = convexHull(points);
  if (hull.length < 3) return null;

  hull = simplifyHull(hull, MAX_VERTS);
  if (hull.length < 3) return null;

  const area = polyArea(hull);
  if (area < MIN_AREA) return null;

  // Compute centroid
  let cx = 0;
  let cy = 0;
  for (const v of hull) {
    cx += v.x;
    cy += v.y;
  }
  cx /= hull.length;
  cy /= hull.length;

  // Create vertices relative to centroid
  const verts = hull.map((v) => planck.Vec2(v.x - cx, v.y - cy));

  const body = world.createBody({ type: "dynamic", position: planck.Vec2(cx, cy) });
  body.createFixture({
    shape: planck.Polygon(verts),
    density: 1,
    friction: 0.4,
    restitution: 0.2,
  });
  body.setUserData({ fill: "rgba(120,200,160,0.7)", label: "polygon" });
  return body;
}
