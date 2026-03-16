import type * as planck from "planck";
import type { ToolContext, ToolHandler } from "../ToolHandler";

export class RopeTool implements ToolHandler {
  /** Visible to Renderer for pending highlight */
  ropePending: { body: planck.Body | null; x: number; y: number } | null = null;
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(wx: number, wy: number) {
    const body = this.ctx.findBodyAt(wx, wy);

    if (!this.ropePending) {
      this.ropePending = { body, x: wx, y: wy };
    } else {
      const a = this.ropePending;
      if (!(a.body && a.body === body)) {
        this.ctx.game.addRopeBetween(a.x, a.y, wx, wy, a.body, body);
      }
      this.ropePending = null;
    }
  }

  reset() {
    this.ropePending = null;
  }
}

export class SpringTool implements ToolHandler {
  /** Visible to Renderer for pending highlight (shares shape with RopeTool) */
  ropePending: { body: planck.Body | null; x: number; y: number } | null = null;
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(wx: number, wy: number) {
    const body = this.ctx.findBodyAt(wx, wy);

    if (!this.ropePending) {
      this.ropePending = { body, x: wx, y: wy };
    } else {
      const a = this.ropePending;
      if (!(a.body && a.body === body)) {
        this.ctx.game.addSpring(a.x, a.y, wx, wy, a.body, body);
      }
      this.ropePending = null;
    }
  }

  reset() {
    this.ropePending = null;
  }
}
