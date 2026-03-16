import type * as planck from "planck";
import { markDestroyed } from "../../engine/Physics";
import { BrushTool } from "./BrushTool";

export const ERASE_RADIUS_PX = 24;

export class EraseTool extends BrushTool {
  readonly radiusPx = ERASE_RADIUS_PX;

  protected brushAction(bodies: planck.Body[]) {
    for (const b of bodies) {
      markDestroyed(b);
      this.ctx.game.world.destroyBody(b);
    }
  }
}
