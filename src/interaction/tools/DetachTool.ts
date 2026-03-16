import type { ToolContext, ToolHandler } from "../ToolHandler";

export class DetachTool implements ToolHandler {
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(wx: number, wy: number) {
    const body = this.ctx.findBodyAt(wx, wy);
    if (!body) return;

    const toRemove: import("planck").Joint[] = [];
    for (let j = this.ctx.game.world.getJointList(); j; j = j.getNext()) {
      if (j.getType() === "weld-joint" && (j.getBodyA() === body || j.getBodyB() === body)) {
        toRemove.push(j);
      }
    }
    for (const j of toRemove) this.ctx.game.world.destroyJoint(j);
  }
}
