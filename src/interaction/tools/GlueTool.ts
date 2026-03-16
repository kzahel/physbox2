import * as planck from "planck";
import type { ToolContext, ToolHandler } from "../ToolHandler";

export const GLUE_RADIUS_PX = 28;

export class GlueTool implements ToolHandler {
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(_wx: number, _wy: number, sx: number, sy: number) {
    this.glueAtScreen(sx, sy);
  }

  onBrush(_wx: number, _wy: number, sx: number, sy: number) {
    this.glueAtScreen(sx, sy);
  }

  private glueAtScreen(sx: number, sy: number) {
    const r = GLUE_RADIUS_PX / this.ctx.game.camera.zoom;
    const world = this.ctx.game.camera.toWorld(sx, sy, this.ctx.game.canvas);
    const center = planck.Vec2(world.x, world.y);
    const bodies: planck.Body[] = [];

    this.ctx.game.world.queryAABB(
      planck.AABB(planck.Vec2(world.x - r, world.y - r), planck.Vec2(world.x + r, world.y + r)),
      (fixture) => {
        const body = fixture.getBody();
        if (body === this.ctx.groundBody) return true;
        if (planck.Vec2.lengthOf(planck.Vec2.sub(body.getPosition(), center)) < r) {
          if (!bodies.includes(body)) bodies.push(body);
        }
        return true;
      },
    );

    const GAP = 0.5;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        if (areWelded(a, b)) continue;
        const dist = planck.Vec2.lengthOf(planck.Vec2.sub(a.getPosition(), b.getPosition()));
        const rA = bodyRadius(a);
        const rB = bodyRadius(b);
        if (dist < rA + rB + GAP) {
          const mid = planck.Vec2.mid(a.getPosition(), b.getPosition());
          this.ctx.game.world.createJoint(planck.WeldJoint({}, a, b, mid));
        }
      }
    }
  }
}

export class UnGlueTool implements ToolHandler {
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(_wx: number, _wy: number, sx: number, sy: number) {
    this.unglueAtScreen(sx, sy);
  }

  onBrush(_wx: number, _wy: number, sx: number, sy: number) {
    this.unglueAtScreen(sx, sy);
  }

  private unglueAtScreen(sx: number, sy: number) {
    const r = GLUE_RADIUS_PX / this.ctx.game.camera.zoom;
    const world = this.ctx.game.camera.toWorld(sx, sy, this.ctx.game.canvas);
    const center = planck.Vec2(world.x, world.y);
    const bodies: planck.Body[] = [];

    this.ctx.game.world.queryAABB(
      planck.AABB(planck.Vec2(world.x - r, world.y - r), planck.Vec2(world.x + r, world.y + r)),
      (fixture) => {
        const body = fixture.getBody();
        if (body === this.ctx.groundBody) return true;
        if (planck.Vec2.lengthOf(planck.Vec2.sub(body.getPosition(), center)) < r) {
          if (!bodies.includes(body)) bodies.push(body);
        }
        return true;
      },
    );

    const toDestroy: planck.Joint[] = [];
    for (const body of bodies) {
      for (let je = body.getJointList(); je; je = je.next) {
        const joint = je.joint;
        if (!joint || joint.getType() !== "weld-joint") continue;
        if (!toDestroy.includes(joint)) toDestroy.push(joint);
      }
    }
    for (const j of toDestroy) this.ctx.game.world.destroyJoint(j);
  }
}

function areWelded(a: planck.Body, b: planck.Body): boolean {
  for (let je = a.getJointList(); je; je = je.next) {
    const joint = je.joint;
    if (!joint || joint.getType() !== "weld-joint") continue;
    const other = joint.getBodyA() === a ? joint.getBodyB() : joint.getBodyA();
    if (other === b) return true;
  }
  return false;
}

function bodyRadius(body: planck.Body): number {
  let maxR = 0;
  for (let f = body.getFixtureList(); f; f = f.getNext()) {
    const shape = f.getShape();
    if (shape.getType() === "circle") {
      maxR = Math.max(maxR, (shape as planck.CircleShape).getRadius());
    } else if (shape.getType() === "polygon") {
      const aabb = new planck.AABB();
      shape.computeAABB(aabb, planck.Transform.identity(), 0);
      const ext = planck.Vec2.sub(aabb.upperBound, aabb.lowerBound);
      maxR = Math.max(maxR, planck.Vec2.lengthOf(ext) / 2);
    }
  }
  return maxR;
}
