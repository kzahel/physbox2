import * as planck from "planck";
import { areWelded, bodyRadius } from "../../engine/Physics";
import { BrushTool } from "./BrushTool";

export const GLUE_RADIUS_PX = 28;

export class GlueTool extends BrushTool {
  readonly radiusPx = GLUE_RADIUS_PX;

  protected brushAction(bodies: planck.Body[]) {
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

export class UnGlueTool extends BrushTool {
  readonly radiusPx = GLUE_RADIUS_PX;

  protected brushAction(bodies: planck.Body[]) {
    const seen = new Set<planck.Joint>();
    const toDestroy: planck.Joint[] = [];
    for (const body of bodies) {
      for (let je = body.getJointList(); je; je = je.next) {
        const joint = je.joint;
        if (!joint || joint.getType() !== "weld-joint") continue;
        if (!seen.has(joint)) {
          seen.add(joint);
          toDestroy.push(joint);
        }
      }
    }
    for (const j of toDestroy) this.ctx.game.world.destroyJoint(j);
  }
}
