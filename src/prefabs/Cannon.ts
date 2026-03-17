import * as planck from "planck";
import { getBodyUserData } from "../engine/BodyUserData";
import type { IRenderer } from "../engine/IRenderer";
import { markDestroyed } from "../engine/Physics";

export function createCannon(world: planck.World, x: number, y: number, angle: number): planck.Body {
  const body = world.createBody({ type: "static", position: planck.Vec2(x, y), angle });
  body.createFixture({ shape: planck.Box(0.6, 0.3), friction: 0.5 });
  body.createFixture({
    shape: planck.Polygon([
      planck.Vec2(0.4, -0.35),
      planck.Vec2(0.8, -0.35),
      planck.Vec2(0.8, 0.35),
      planck.Vec2(0.4, 0.35),
    ]),
  });
  body.setUserData({ fill: "rgba(80,80,90,0.9)", label: "cannon", cannonCooldown: 0.5 });
  return body;
}

/** Fire a cannonball from a cannon body */
function fireCannon(world: planck.World, cannon: planck.Body, renderer: IRenderer) {
  const pos = cannon.getPosition();
  const a = cannon.getAngle();
  const dirX = Math.cos(a);
  const dirY = Math.sin(a);

  const spawnX = pos.x + dirX * 1.0;
  const spawnY = pos.y + dirY * 1.0;
  const ball = world.createBody({ type: "dynamic", position: planck.Vec2(spawnX, spawnY) });
  ball.createFixture({ shape: planck.Circle(0.2), density: 5, friction: 0.3, restitution: 0.1 });
  ball.setUserData({ fill: "rgba(100,100,110,0.9)", label: "cannonball", lifetime: 5, parentCannon: cannon });
  ball.setBullet(true);

  const speed = 20;
  ball.setLinearVelocity(planck.Vec2(dirX * speed, dirY * speed));
  renderer.particles.spawnMuzzleFlash(spawnX, spawnY);
}

const registeredWorlds = new WeakSet<planck.World>();

/**
 * Tick all cannons (fire on cooldown) and cannonball lifetimes.
 * Registers a single contact listener per world for cannonball impact detection.
 */
export function tickCannons(
  world: planck.World,
  renderer: IRenderer,
  explodeAt: (wx: number, wy: number, radius: number, force: number) => void,
  dt: number,
) {
  // Register cannonball contact listener once per world instance
  if (!registeredWorlds.has(world)) {
    registeredWorlds.add(world);
    world.on("begin-contact", (contact) => {
      const fA = contact.getFixtureA().getBody();
      const fB = contact.getFixtureB().getBody();
      // Find which body (if any) is a cannonball
      let ball: planck.Body | null = null;
      let other: planck.Body | null = null;
      const udA = getBodyUserData(fA);
      const udB = getBodyUserData(fB);
      if (udA?.label === "cannonball" && !udA.exploded) {
        ball = fA;
        other = fB;
      } else if (udB?.label === "cannonball" && !udB.exploded) {
        ball = fB;
        other = fA;
      }
      if (!ball || !other) return;
      const bud = getBodyUserData(ball)!;
      // Don't explode on the cannon that fired this ball
      if (other === bud.parentCannon) return;
      bud.exploded = true;
      // Defer destruction to after physics step
      setTimeout(() => {
        if (bud.destroyed) return;
        explodeAt(ball!.getPosition().x, ball!.getPosition().y, 5, 20);
        markDestroyed(ball!);
        world.destroyBody(ball!);
      }, 0);
    });
  }

  // Tick cannon cooldowns and fire
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    const ud = getBodyUserData(b);
    if (ud?.label !== "cannon" || ud.cannonCooldown == null) continue;
    ud.cannonCooldown -= dt;
    if (ud.cannonCooldown <= 0) {
      if (!ud.destroyed) fireCannon(world, b, renderer);
      ud.cannonCooldown = 1; // fire every 1s
    }
  }

  // Tick cannonball lifetimes
  const toDestroy: planck.Body[] = [];
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    const ud = getBodyUserData(b);
    if (ud?.label !== "cannonball" || ud.lifetime == null) continue;
    ud.lifetime -= dt;
    if (ud.lifetime <= 0 && !ud.exploded && !ud.destroyed) {
      markDestroyed(b);
      toDestroy.push(b);
    }
  }
  for (const b of toDestroy) {
    world.destroyBody(b);
  }
}
