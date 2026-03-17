import { describe, expect, it } from "vitest";
import { convexHull } from "./ConvexHull";

describe("convexHull", () => {
  it("returns empty array for empty input", () => {
    expect(convexHull([])).toEqual([]);
  });

  it("returns single point unchanged", () => {
    const pts = [{ x: 3, y: 4 }];
    expect(convexHull(pts)).toEqual([{ x: 3, y: 4 }]);
  });

  it("returns both points for two distinct points", () => {
    const result = convexHull([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
    expect(result).toHaveLength(2);
  });

  it("computes hull of a square", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    const hull = convexHull(pts);
    expect(hull).toHaveLength(4);
  });

  it("excludes interior points", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
      { x: 1, y: 1 }, // interior
    ];
    const hull = convexHull(pts);
    expect(hull).toHaveLength(4);
    expect(hull).not.toContainEqual({ x: 1, y: 1 });
  });

  it("handles collinear points", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    const hull = convexHull(pts);
    // Collinear points collapse to a line (2 endpoints)
    expect(hull).toHaveLength(2);
  });

  it("handles duplicate points", () => {
    const pts = [
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
    ];
    const hull = convexHull(pts);
    // All identical → sorted has 3 copies; algorithm produces 2 (lower+upper degenerate)
    expect(hull.length).toBeLessThanOrEqual(2);
  });

  it("returns CCW ordered vertices for a triangle", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 3 },
    ];
    const hull = convexHull(pts);
    expect(hull).toHaveLength(3);
    // Verify CCW: cross product of consecutive edges should be positive
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i];
      const b = hull[(i + 1) % hull.length];
      const c = hull[(i + 2) % hull.length];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      expect(cross).toBeGreaterThan(0);
    }
  });

  it("does not mutate the input array", () => {
    const pts = [
      { x: 3, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    const copy = pts.map((p) => ({ ...p }));
    convexHull(pts);
    expect(pts).toEqual(copy);
  });

  it("handles a large random point set", () => {
    const pts = Array.from({ length: 100 }, (_, i) => ({
      x: Math.cos((i * 2 * Math.PI) / 100) * 10,
      y: Math.sin((i * 2 * Math.PI) / 100) * 10,
    }));
    // Points on a circle — hull should include most/all of them
    const hull = convexHull(pts);
    expect(hull.length).toBeGreaterThanOrEqual(3);
    // All hull points should be from the input
    for (const h of hull) {
      expect(pts.some((p) => Math.abs(p.x - h.x) < 1e-9 && Math.abs(p.y - h.y) < 1e-9)).toBe(true);
    }
  });
});
