/**
 * Centralized type for body.getUserData() across the codebase.
 * All fields are optional since different prefabs set different subsets.
 */
export interface BodyUserData {
  fill?: string;
  label?: string;
  stroke?: string;
  // Motor (any body with spinning motor)
  motorSpeed?: number;
  // Conveyor belt
  speed?: number;
  // Rocket
  thrust?: number;
  fuel?: number;
  // Fan
  force?: number;
  range?: number;
  // Balloon
  lift?: number;
  // Dynamite
  fuseRemaining?: number;
  fuseDuration?: number;
  // Cannon
  cannonCooldown?: number;
  // Cannonball
  lifetime?: number;
  exploded?: boolean;
  parentCannon?: import("planck").Body;
  // Destruction flag (cannon balls, dynamite, etc.)
  destroyed?: boolean;
}

/** Type-safe accessor for body userData */
export function getBodyUserData(body: import("planck").Body): BodyUserData | null {
  return body.getUserData() as BodyUserData | null;
}

/** Fixture-level style data */
export interface FixtureStyle {
  fill?: string;
  stroke?: string;
}
