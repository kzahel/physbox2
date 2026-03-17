import type { IParticleSystem } from "./IRenderer";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export class ParticleSystem implements IParticleSystem {
  private _particles: Particle[] = [];
  private lastTime = 0;

  /** Advance simulation. Call once per frame. */
  tick() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.update(dt);
  }

  /** Read-only access to live particles for renderer-specific drawing. */
  getParticles(): readonly Particle[] {
    return this._particles;
  }

  private update(dt: number) {
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
    }
  }

  private emit(
    x: number,
    y: number,
    count: number,
    gen: () => (Omit<Particle, "x" | "y"> & { ox?: number; oy?: number }) | null,
  ) {
    for (let i = 0; i < count; i++) {
      const p = gen();
      if (!p) continue;
      const { ox = 0, oy = 0, ...rest } = p;
      this._particles.push({ x: x + ox, y: y + oy, ...rest });
    }
  }

  spawnWind(wx: number, wy: number, angle: number, range: number) {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    this.emit(wx, wy, 2, () => {
      if (Math.random() > 0.6) return null;
      const spread = (Math.random() - 0.5) * 1.5;
      const speed = 3 + Math.random() * 4;
      const life = (range / speed) * (0.4 + Math.random() * 0.4);
      return {
        ox: dirX * 0.5 + -dirY * spread,
        oy: dirY * 0.5 + dirX * spread,
        vx: dirX * speed + (Math.random() - 0.5) * 0.5,
        vy: dirY * speed + (Math.random() - 0.5) * 0.5,
        life,
        maxLife: life,
        size: 0.06 + Math.random() * 0.08,
        r: 180,
        g: 210,
        b: 240,
      };
    });
  }

  spawnMuzzleFlash(wx: number, wy: number) {
    this.emit(wx, wy, 10, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const life = 0.15 + Math.random() * 0.25;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 0.08 + Math.random() * 0.12,
        r: 255,
        g: 180 + Math.floor(Math.random() * 75),
        b: 0,
      };
    });
  }

  spawnExplosion(wx: number, wy: number) {
    this.emit(wx, wy, 40, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const life = 0.4 + Math.random() * 0.6;
      const isSmoke = Math.random() < 0.3;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: isSmoke ? 0.3 + Math.random() * 0.4 : 0.1 + Math.random() * 0.2,
        r: isSmoke ? 80 : 255,
        g: isSmoke ? 80 : 100 + Math.floor(Math.random() * 155),
        b: isSmoke ? 80 : 0,
      };
    });
  }

  spawnFlame(wx: number, wy: number, bodyAngle: number) {
    const exDirX = Math.sin(bodyAngle);
    const exDirY = -Math.cos(bodyAngle);
    this.emit(wx, wy, 2, () => {
      const spread = (Math.random() - 0.5) * 1.5;
      const speed = 3 + Math.random() * 4;
      const life = 0.15 + Math.random() * 0.25;
      const isSmoke = Math.random() < 0.2;
      return {
        ox: (Math.random() - 0.5) * 0.2,
        oy: (Math.random() - 0.5) * 0.2,
        vx: exDirX * speed + spread,
        vy: exDirY * speed + spread,
        life,
        maxLife: life,
        size: isSmoke ? 0.2 + Math.random() * 0.3 : 0.08 + Math.random() * 0.12,
        r: isSmoke ? 100 : 255,
        g: isSmoke ? 100 : 150 + Math.floor(Math.random() * 105),
        b: isSmoke ? 100 : 0,
      };
    });
  }

  spawnSpark(wx: number, wy: number) {
    this.emit(wx, wy, 3, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1,
        life: 0.2 + Math.random() * 0.3,
        maxLife: 0.5,
        size: 0.05 + Math.random() * 0.08,
        r: 255,
        g: 200 + Math.floor(Math.random() * 55),
        b: 50,
      };
    });
  }
}
