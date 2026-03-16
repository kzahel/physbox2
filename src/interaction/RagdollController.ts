import * as planck from "planck";
import type { Game } from "../engine/Game";

export class RagdollController {
  private keys: Set<string>;
  private game: Game;

  constructor(game: Game, keys: Set<string>) {
    this.game = game;
    this.keys = keys;
  }

  update() {
    const moveForce = 8;
    const jumpImpulse = 6;
    const maxSpeed = 6;

    const left = this.keys.has("ArrowLeft");
    const right = this.keys.has("ArrowRight");
    const jump = this.keys.has("ArrowUp");

    for (const rd of this.game.ragdolls) {
      const torso = rd.torso;
      if (!torso.isActive()) continue;
      const vel = torso.getLinearVelocity();
      const grounded = rd.footContacts > 0;

      if (left && vel.x > -maxSpeed) {
        torso.applyForceToCenter(planck.Vec2(-moveForce * torso.getMass(), 0), true);
      }
      if (right && vel.x < maxSpeed) {
        torso.applyForceToCenter(planck.Vec2(moveForce * torso.getMass(), 0), true);
      }

      if (jump && grounded && vel.y < 1) {
        torso.applyLinearImpulse(planck.Vec2(0, jumpImpulse * torso.getMass()), torso.getPosition(), true);
      }
    }
  }
}
