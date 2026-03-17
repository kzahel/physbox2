import * as planck from "planck";
import type { Game } from "../engine/Game";

const MOVE_FORCE = 8;
const JUMP_IMPULSE = 6;
const MAX_SPEED = 6;

export class RagdollController {
  private keys: Set<string>;
  private game: Game;

  constructor(game: Game, keys: Set<string>) {
    this.game = game;
    this.keys = keys;
  }

  update() {
    const left = this.keys.has("ArrowLeft");
    const right = this.keys.has("ArrowRight");
    const jump = this.keys.has("ArrowUp");

    for (const rd of this.game.ragdolls) {
      const torso = rd.torso;
      if (!torso.isActive()) continue;
      const vel = torso.getLinearVelocity();
      const grounded = rd.footContacts > 0;

      if (left && vel.x > -MAX_SPEED) {
        torso.applyForceToCenter(planck.Vec2(-MOVE_FORCE * torso.getMass(), 0), true);
      }
      if (right && vel.x < MAX_SPEED) {
        torso.applyForceToCenter(planck.Vec2(MOVE_FORCE * torso.getMass(), 0), true);
      }

      if (jump && grounded && vel.y < 1) {
        torso.applyLinearImpulse(planck.Vec2(0, JUMP_IMPULSE * torso.getMass()), torso.getPosition(), true);
      }
    }
  }
}
