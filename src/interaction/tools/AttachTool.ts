import * as planck from "planck";
import type { ToolContext, ToolHandler } from "../ToolHandler";

export class AttachTool implements ToolHandler {
  /** Visible to Renderer for highlight */
  attachPending: { body: planck.Body; world: { x: number; y: number } } | null = null;
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(wx: number, wy: number) {
    const body = this.ctx.findBodyAt(wx, wy);
    if (!body) return;

    if (!this.attachPending) {
      this.attachPending = { body, world: { x: wx, y: wy } };
    } else {
      if (body !== this.attachPending.body) {
        const midX = (this.attachPending.world.x + wx) / 2;
        const midY = (this.attachPending.world.y + wy) / 2;
        this.ctx.game.world.createJoint(planck.WeldJoint({}, this.attachPending.body, body, planck.Vec2(midX, midY)));
      }
      this.attachPending = null;
    }
  }

  reset() {
    this.attachPending = null;
  }
}
