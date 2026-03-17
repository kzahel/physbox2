import { describe, expect, it } from "vitest";
import {
  type BodyUserData,
  isBalloon,
  isCannon,
  isCannonball,
  isConveyor,
  isDynamite,
  isFan,
  isRocket,
} from "./BodyUserData";

const guards = [
  { name: "isRocket", guard: isRocket, label: "rocket" },
  { name: "isFan", guard: isFan, label: "fan" },
  { name: "isBalloon", guard: isBalloon, label: "balloon" },
  { name: "isDynamite", guard: isDynamite, label: "dynamite" },
  { name: "isCannon", guard: isCannon, label: "cannon" },
  { name: "isCannonball", guard: isCannonball, label: "cannonball" },
  { name: "isConveyor", guard: isConveyor, label: "conveyor" },
] as const;

describe("BodyUserData type guards", () => {
  it("all guards return false for null", () => {
    for (const { guard } of guards) {
      expect(guard(null)).toBe(false);
    }
  });

  it("all guards return false for generic body data", () => {
    const generic: BodyUserData = { label: "box", fill: "red" };
    for (const { guard } of guards) {
      expect(guard(generic)).toBe(false);
    }
  });

  for (const { name, guard, label } of guards) {
    it(`${name} returns true only for label="${label}"`, () => {
      const ud = { label } as BodyUserData;
      expect(guard(ud)).toBe(true);
      // All other guards should return false for this label
      for (const other of guards) {
        if (other.label !== label) {
          expect(other.guard(ud)).toBe(false);
        }
      }
    });
  }
});
