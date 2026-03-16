import * as planck from "planck";
import type { ToolContext, ToolHandler } from "../ToolHandler";

export class AttractTool implements ToolHandler {
  /** Visible externally — two bodies being pulled together */
  attracting: { bodyA: planck.Body; bodyB: planck.Body } | null = null;
  private pending: { body: planck.Body; world: { x: number; y: number } } | null = null;
  private ctx: ToolContext;
  private contactBound = false;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(wx: number, wy: number) {
    if (this.attracting) {
      this.attracting = null;
      return;
    }

    const body = this.ctx.findBodyAt(wx, wy);
    if (!body) return;

    if (!this.pending) {
      this.pending = { body, world: { x: wx, y: wy } };
    } else {
      if (body !== this.pending.body) {
        this.attracting = { bodyA: this.pending.body, bodyB: body };
        this.ensureContactListener();
      }
      this.pending = null;
    }
  }

  reset() {
    this.attracting = null;
    this.pending = null;
  }

  /** Apply per-frame attraction forces — called from InputManager.update() */
  update() {
    if (!this.attracting) return;
    const { bodyA, bodyB } = this.attracting;
    const dir = planck.Vec2.sub(bodyA.getPosition(), bodyB.getPosition());
    const len = planck.Vec2.lengthOf(dir);
    if (len < 0.01) return;
    const force = planck.Vec2.mul(dir, (50 * bodyB.getMass()) / len);
    bodyB.applyForceToCenter(force, true);
    if (bodyA.isDynamic()) {
      bodyA.applyForceToCenter(planck.Vec2.mul(force, -1), true);
    }
  }

  /** Bind contact listener (once) to weld on collision */
  ensureContactListener() {
    if (this.contactBound) return;
    this.contactBound = true;
    this.ctx.game.world.on("begin-contact", (contact) => {
      if (!this.attracting) return;
      const { bodyA, bodyB } = this.attracting;
      const cA = contact.getFixtureA().getBody();
      const cB = contact.getFixtureB().getBody();
      const match = (cA === bodyA && cB === bodyB) || (cA === bodyB && cB === bodyA);
      if (!match) return;

      const manifold = contact.getWorldManifold(null);
      const weldPoint = manifold?.points[0] ?? bodyA.getPosition();
      setTimeout(() => {
        if (!this.attracting) return;
        this.ctx.game.world.createJoint(planck.WeldJoint({}, bodyA, bodyB, weldPoint));
        this.attracting = null;
      }, 0);
    });
  }

  /** Re-bind after world reset */
  rebindContactListener() {
    this.contactBound = false;
  }
}
