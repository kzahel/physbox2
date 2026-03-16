import type * as planck from "planck";
import { BrushTool } from "./BrushTool";

export const ERASE_RADIUS_PX = 24;

export class EraseTool extends BrushTool {
  readonly radiusPx = ERASE_RADIUS_PX;

  protected brushAction(bodies: planck.Body[]) {
    for (const b of bodies) this.ctx.game.world.destroyBody(b);
  }
}
