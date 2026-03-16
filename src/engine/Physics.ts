import * as planck from "planck";
import { playExplosion } from "./Audio";
import type { Renderer } from "./Renderer";

/** Reusable explosion: particles, sound, radial impulse */
export function explodeAt(
  world: planck.World,
  renderer: Renderer,
  wx: number,
  wy: number,
  radius: number,
  force: number,
): void {
  const center = planck.Vec2(wx, wy);
  renderer.spawnExplosion(wx, wy);
  playExplosion(0.3);

  const affected: { body: planck.Body; dist: number }[] = [];
  world.queryAABB(
    planck.AABB(planck.Vec2(wx - radius, wy - radius), planck.Vec2(wx + radius, wy + radius)),
    (fixture) => {
      const b = fixture.getBody();
      if (!b.isDynamic()) return true;
      const d = planck.Vec2.lengthOf(planck.Vec2.sub(b.getPosition(), center));
      if (d < radius) affected.push({ body: b, dist: d });
      return true;
    },
  );

  for (const { body: b, dist } of affected) {
    const dir = planck.Vec2.sub(b.getPosition(), center);
    const len = planck.Vec2.lengthOf(dir);
    if (len < 0.01) continue;
    const falloff = 1 - dist / radius;
    const impulse = planck.Vec2.mul(dir, (force * falloff * b.getMass()) / len);
    b.applyLinearImpulse(impulse, b.getPosition(), true);
  }
}

/** Recreate a body with all fixtures scaled */
export function scaleBody(_world: planck.World, body: planck.Body, scale: number): planck.Body {
  // Replace fixtures in-place (preserves joints, no body recreation needed)
  // Shapes are immutable in Box2D, so we destroy and recreate each fixture.
  const fixtureData: {
    density: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    userData: unknown;
    shapeType: string;
    radius?: number;
    center?: { x: number; y: number };
    verts?: { x: number; y: number }[];
  }[] = [];

  for (let f = body.getFixtureList(); f; f = f.getNext()) {
    const shape = f.getShape();
    const fd = {
      density: f.getDensity(),
      friction: f.getFriction(),
      restitution: f.getRestitution(),
      isSensor: f.isSensor(),
      userData: f.getUserData(),
      shapeType: shape.getType(),
    } as (typeof fixtureData)[number];

    if (shape.getType() === "circle") {
      const circle = shape as planck.CircleShape;
      const c = circle.getCenter();
      fd.radius = circle.getRadius() * scale;
      fd.center = { x: c.x * scale, y: c.y * scale };
    } else if (shape.getType() === "polygon") {
      const poly = shape as planck.PolygonShape;
      fd.verts = poly.m_vertices.map((v) => ({ x: v.x * scale, y: v.y * scale }));
    } else {
      continue;
    }
    fixtureData.push(fd);
  }

  // Remove old fixtures
  const toRemove: planck.Fixture[] = [];
  for (let f = body.getFixtureList(); f; f = f.getNext()) toRemove.push(f);
  for (const f of toRemove) body.destroyFixture(f);

  // Create scaled fixtures
  for (const fd of fixtureData) {
    let shape: planck.Shape;
    if (fd.shapeType === "circle") {
      shape = planck.Circle(planck.Vec2(fd.center!.x, fd.center!.y), fd.radius!);
    } else {
      shape = planck.Polygon(fd.verts!.map((v) => planck.Vec2(v.x, v.y)));
    }
    const fix = body.createFixture({
      shape,
      density: fd.density,
      friction: fd.friction,
      restitution: fd.restitution,
      isSensor: fd.isSensor,
    });
    if (fd.userData) fix.setUserData(fd.userData);
  }

  body.resetMassData();
  return body;
}

export function destroyBodyAt(world: planck.World, wx: number, wy: number, radius = 0.5): boolean {
  const point = planck.Vec2(wx, wy);
  let found: planck.Body | null = null;

  world.queryAABB(
    planck.AABB(planck.Vec2(wx - radius, wy - radius), planck.Vec2(wx + radius, wy + radius)),
    (fixture) => {
      if (fixture.testPoint(point)) {
        found = fixture.getBody();
        return false;
      }
      return true;
    },
  );

  if (found) {
    world.destroyBody(found);
    return true;
  }
  return false;
}

export function clearDynamic(world: planck.World): void {
  const toRemove: planck.Body[] = [];
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    if (b.isDynamic()) toRemove.push(b);
  }
  for (const b of toRemove) world.destroyBody(b);
}
