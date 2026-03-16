import type * as planck from "planck";
import type { Game } from "../engine/Game";

/** Shared context passed to every tool handler */
export interface ToolContext {
  game: Game;
  groundBody: planck.Body;
  /** Find the nearest body at world coords within a screen-pixel radius */
  findBodyAt(wx: number, wy: number, radiusPx?: number): planck.Body | null;
}

/**
 * Interface that every tool implements. InputManager dispatches DOM events
 * to whichever ToolHandler is currently active.
 */
export interface ToolHandler {
  /** Called on mouse-down / single-finger touch-start (grab only) or touch-end tap */
  onDown?(wx: number, wy: number, screenX: number, screenY: number): void;

  /** Called on mouse-move / single-finger touch-move while primary button held */
  onMove?(wx: number, wy: number, dx: number, dy: number, screenX: number, screenY: number): void;

  /** Called on mouse-up / touch-end */
  onUp?(): void;

  /** Called continuously while dragging for brush-style tools (erase, glue, unglue) */
  onBrush?(wx: number, wy: number, screenX: number, screenY: number): void;

  /** Whether this tool supports multi-place (hold to spam) */
  isCreationTool?: boolean;

  /** Clean up any pending state when switching away from this tool */
  reset?(): void;

  // ── Renderer-visible state ──
  // Tools expose whatever state the Renderer needs to draw previews.
  // Each tool type defines its own shape; Renderer checks via type guards.
}
