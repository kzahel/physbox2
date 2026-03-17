import type { Tool } from "../InputManager";
import type { ToolContext, ToolHandler } from "../ToolHandler";

/** Simple one-click placement tools (box, ball, rope, car, etc.) */
export class CreationTool implements ToolHandler {
  isCreationTool = true;
  private ctx: ToolContext;
  private variant: Tool;

  constructor(ctx: ToolContext, variant: Tool) {
    this.ctx = ctx;
    this.variant = variant;
  }

  onDown(wx: number, wy: number) {
    this.place(wx, wy);
  }

  place(wx: number, wy: number) {
    const game = this.ctx.game;
    switch (this.variant) {
      case "box":
        game.addBox(wx, wy);
        break;
      case "ball":
        game.addBall(wx, wy);
        break;
      case "car":
        game.addCar(wx, wy);
        break;
      case "springball":
        game.addSpringBall(wx, wy);
        break;
      case "launcher":
        game.addLauncher(wx, wy);
        break;
      case "seesaw":
        game.addSeesaw(wx, wy);
        break;
      case "balloon":
        game.addBalloon(wx, wy);
        break;
      case "ragdoll":
        game.addRagdoll(wx, wy);
        break;
      case "dynamite":
        game.addDynamite(wx, wy);
        break;
      case "train":
        game.addTrain(wx, wy);
        break;
    }
  }
}
