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

    // W3C DeviceOrientation uses Z-X'-Y'' (alpha-beta-gamma) intrinsic rotations.
    // Projecting world gravity (0,0,-g) into the device frame gives:
    //   device_x =  g * cos(beta) * sin(gamma)
    //   device_y = -g * sin(beta)
    // beta ≈ 90° when upright portrait → gy ≈ -g (down)
    // gamma = left/right tilt; only produces lateral gravity when phone is tilted forward
    const g = this.magnitude;
    const betaRad = (e.beta * Math.PI) / 180;
    const gammaRad = (e.gamma * Math.PI) / 180;

    const gx = g * Math.cos(betaRad) * Math.sin(gammaRad);
    const gy = -g * Math.sin(betaRad);

    this.game.setGravityXY(gx, gy);
  }
}
