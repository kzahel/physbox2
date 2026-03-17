import * as planck from "planck";
import { getBodyUserData } from "../engine/BodyUserData";
import { markDestroyed } from "../engine/Physics";

export function createDynamite(world: planck.World, x: number, y: number, fuseTime = 3): planck.Body {
  const body = world.createBody({ type: "dynamic", position: planck.Vec2(x, y) });
  body.createFixture({ shape: planck.Box(0.25, 0.4), density: 2, friction: 0.5 });
  body.setUserData({
    fill: "rgba(255,50,30,0.9)",
    label: "dynamite",
    fuseRemaining: fuseTime,
    fuseDuration: fuseTime,
  });
  return body;
}

/** Advance dynamite fuses by dt and explode when they reach zero. Called from Game.stepPhysics. */
export function tickDynamite(
  world: planck.World,
  dt: number,
  explodeAt: (wx: number, wy: number, radius: number, force: number) => void,
) {
  const toExplode: planck.Body[] = [];
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    const ud = getBodyUserData(b);
    if (ud?.label !== "dynamite" || ud.fuseRemaining == null) continue;
    ud.fuseRemaining -= dt;
    if (ud.fuseRemaining <= 0) toExplode.push(b);
  }
  for (const b of toExplode) {
    const ud = getBodyUserData(b);
    if (ud?.destroyed) continue;
    const pos = b.getPosition();
    explodeAt(pos.x, pos.y, 8, 30);
    markDestroyed(b);
    world.destroyBody(b);
  }
}
