import * as planck from "planck";
import { getBodyUserData } from "../../engine/BodyUserData";
import type { ToolContext } from "../ToolHandler";

const ENDPOINT_SNAP_PX = 24;
const PLATFORM_LABELS = new Set(["platform", "conveyor"]);

export interface EndpointDrag {
  body: planck.Body;
  /** The endpoint that stays fixed (world coords) */
  fixedEnd: planck.Vec2;
  /** Original fixture half-height (thickness) */
  halfHeight: number;
  /** Original fixture friction */
  friction: number;
  /** Original body userData */
  userData: unknown;
  /** Original fixture userData (conveyor stripe data etc.) */
  fixtureUserData: unknown;
}

export class EndpointDragHandler {
  private drag: EndpointDrag | null = null;
  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  get active(): boolean {
    return this.drag !== null;
  }

  /** Try to start an endpoint drag. Returns true if started. */
  tryStart(body: planck.Body, wx: number, wy: number): boolean {
    const drag = this.detect(body, wx, wy);
    if (drag) {
      this.drag = drag;
      return true;
    }
    return false;
  }

  /** Move the dragged endpoint to (wx, wy). */
  move(wx: number, wy: number): void {
    if (!this.drag) return;
    const fixed = this.drag.fixedEnd;
    const dx = wx - fixed.x;
    const dy = wy - fixed.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.2) return; // don't collapse to nothing

    const cx = (fixed.x + wx) / 2;
    const cy = (fixed.y + wy) / 2;
    const angle = Math.atan2(dy, dx);
    const halfWidth = len / 2;

    // Update body transform
    this.drag.body.setPosition(planck.Vec2(cx, cy));
    this.drag.body.setAngle(angle);

    // Replace the fixture with the new size
    const oldFixture = this.drag.body.getFixtureList();
    if (oldFixture) this.drag.body.destroyFixture(oldFixture);
    const newFixture = this.drag.body.createFixture({
      shape: planck.Box(halfWidth, this.drag.halfHeight),
      friction: this.drag.friction,
    });
    if (this.drag.fixtureUserData) newFixture.setUserData(this.drag.fixtureUserData);
  }

  release(): void {
    this.drag = null;
  }

  /** Detect if the click is near an endpoint of a platform/conveyor. */
  private detect(body: planck.Body, wx: number, wy: number): EndpointDrag | null {
    const ud = getBodyUserData(body);
    if (!ud?.label || !PLATFORM_LABELS.has(ud.label)) return null;

    const fixture = body.getFixtureList();
    if (!fixture) return null;
    const shape = fixture.getShape();
    if (shape.getType() !== "polygon") return null;

    const poly = shape as planck.PolygonShape;
    const verts = poly.m_vertices;
    const halfWidth = Math.abs(verts[1].x);
    const halfHeight = Math.abs(verts[0].y);

    const endA = body.getWorldPoint(planck.Vec2(-halfWidth, 0));
    const endB = body.getWorldPoint(planck.Vec2(halfWidth, 0));

    const snapRadius = ENDPOINT_SNAP_PX / this.ctx.game.camera.zoom;
    const distA = planck.Vec2.lengthOf(planck.Vec2.sub(planck.Vec2(wx, wy), endA));
    const distB = planck.Vec2.lengthOf(planck.Vec2.sub(planck.Vec2(wx, wy), endB));

    const minDist = Math.min(distA, distB);
    if (minDist > snapRadius) return null;

    const fixedEnd = distA < distB ? endB : endA;

    return {
      body,
      fixedEnd: planck.Vec2(fixedEnd.x, fixedEnd.y),
      halfHeight,
      friction: fixture.getFriction(),
      userData: ud,
      fixtureUserData: fixture.getUserData(),
    };
  }
}
