import type { Tool, ToolContext, ToolHandler } from "../ToolHandler";

/** Shared handler for tools that use a drag-to-draw gesture: platform, conveyor, fan, cannon, rocket */
export class PlatformDrawTool implements ToolHandler {
  immediateTouch = true as const;
  touchDragMode = "drag" as const;
  /** Visible to Renderer for preview line */
  platformDraw: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  private ctx: ToolContext;
  private variant: Tool;

  constructor(ctx: ToolContext, variant: Tool) {
    this.ctx = ctx;
    this.variant = variant;
  }

  onDown(wx: number, wy: number) {
    this.platformDraw = { start: { x: wx, y: wy }, end: { x: wx, y: wy } };
  }

  onMove(wx: number, wy: number) {
    if (this.platformDraw) {
      this.platformDraw.end = { x: wx, y: wy };
    }
  }

  onUp() {
    this.finishDraw();
  }

  reset() {
    this.platformDraw = null;
  }

  private finishDraw() {
    if (!this.platformDraw) return;
    const { start, end } = this.platformDraw;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    if (len > 0.3) {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const angle = Math.atan2(dy, dx);
      const game = this.ctx.game;
      switch (this.variant) {
        case "conveyor":
          game.addConveyor(cx, cy, len, 3, angle);
          break;
        case "fan":
          game.addFan(start.x, start.y, angle);
          break;
        case "cannon":
          game.addCannon(start.x, start.y, angle);
          break;
        case "rocket":
          game.addRocket(start.x, start.y, angle - Math.PI / 2);
          break;
        default:
          game.addPlatform(cx, cy, len, angle);
          break;
      }
    }
    this.platformDraw = null;
  }
}
