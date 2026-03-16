import * as planck from "planck";
import type { ToolContext, ToolHandler } from "../ToolHandler";

export const ERASE_RADIUS_PX = 24;

export class EraseTool implements ToolHandler {
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  onDown(_wx: number, _wy: number, sx: number, sy: number) {
    this.eraseAtScreen(sx, sy);
  }

  onBrush(_wx: number, _wy: number, sx: number, sy: number) {
    this.eraseAtScreen(sx, sy);
  }

  private eraseAtScreen(sx: number, sy: number) {
    const r = ERASE_RADIUS_PX / this.ctx.game.camera.zoom;
    const world = this.ctx.game.camera.toWorld(sx, sy, this.ctx.game.canvas);
    const center = planck.Vec2(world.x, world.y);
    const toRemove: planck.Body[] = [];

    this.ctx.game.world.queryAABB(
      planck.AABB(planck.Vec2(world.x - r, world.y - r), planck.Vec2(world.x + r, world.y + r)),
      (fixture) => {
        const body = fixture.getBody();
        if (body === this.ctx.groundBody) return true;
        const d = planck.Vec2.lengthOf(planck.Vec2.sub(body.getPosition(), center));
        if (d < r) toRemove.push(body);
        return true;
      },
    );

    for (const b of toRemove) this.ctx.game.world.destroyBody(b);
  }
}
