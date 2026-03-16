import type { Game } from "../engine/Game";

export class TiltGravity {
  private game: Game;
  private active = false;
  private handler: ((e: DeviceOrientationEvent) => void) | null = null;
  private magnitude: number;

  constructor(game: Game) {
    this.game = game;
    this.magnitude = Math.abs(game.gravity) || 10;
  }

  static isSupported(): boolean {
    return "DeviceOrientationEvent" in window;
  }

  isActive() {
    return this.active;
  }

  async toggle(): Promise<boolean> {
    if (this.active) {
      this.stop();
      return false;
    }
    return this.start();
  }

  private async start(): Promise<boolean> {
    // iOS 13+ requires permission
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE.requestPermission === "function") {
      const perm = await DOE.requestPermission();
      if (perm !== "granted") return false;
    }

    this.magnitude = Math.abs(this.game.gravity) || 10;
    this.handler = (e) => this.onOrientation(e);
    window.addEventListener("deviceorientation", this.handler);
    this.active = true;
    return true;
  }

  private stop() {
    if (this.handler) {
      window.removeEventListener("deviceorientation", this.handler);
      this.handler = null;
    }
    this.active = false;
    // Restore default downward gravity
    this.game.setGravity(-this.magnitude);
  }

  private onOrientation(e: DeviceOrientationEvent) {
    if (e.gamma == null || e.beta == null) return;

    // gamma: left/right tilt (-90 to 90)
    // beta: front/back tilt (-180 to 180), ~90 when upright
    const g = this.magnitude;
    const gammaRad = (e.gamma * Math.PI) / 180;
    const betaRad = (e.beta * Math.PI) / 180;

    // Project gravity onto screen plane assuming portrait orientation
    // gx: sin(gamma) gives left-right component
    // gy: -cos(gamma) * cos(beta-90) gives the "down" component on screen
    // When upright (beta=90): gy = -g*cos(gamma) (straight down at gamma=0)
    // Small tilts produce proportional gravity shifts
    const gx = g * Math.sin(gammaRad);
    const betaFromUpright = betaRad - Math.PI / 2;
    const gy = -g * Math.cos(gammaRad) * Math.cos(betaFromUpright);

    this.game.setGravityXY(gx, gy);
  }
}
