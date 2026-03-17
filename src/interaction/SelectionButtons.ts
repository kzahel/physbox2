import type * as planck from "planck";
import { getBodyUserData, isConveyor, isRocket } from "../engine/BodyUserData";

/** Button dimensions */
export const BTN_HALF_WIDTH = 38;
export const BTN_HALF_HEIGHT = 9;

const BTN_TOGGLE_OFFSET_Y = 30;
const BTN_DIRECTION_OFFSET_Y = 55;
const BTN_SPACING = 25;

export interface SelectionButton {
  id: "toggle" | "direction" | "motor";
  /** Screen-space Y offset from body center (negative = above) */
  offsetY: number;
}

export function isDirectional(body: planck.Body): boolean {
  const label = getBodyLabel(body);
  return label === "car" || label === "train" || label === "conveyor" || label === "rocket" || hasMotor(body);
}

export function hasMotor(body: planck.Body): boolean {
  const ud = getBodyUserData(body);
  return ud != null && ud.motorSpeed != null;
}

export function getBodyLabel(body: planck.Body): string | undefined {
  return getBodyUserData(body)?.label;
}

/** Returns the selection buttons that should be shown for a body, in order. */
export function getSelectionButtons(body: planck.Body): SelectionButton[] {
  const buttons: SelectionButton[] = [{ id: "toggle", offsetY: BTN_TOGGLE_OFFSET_Y }];
  let nextY = BTN_DIRECTION_OFFSET_Y;
  if (isDirectional(body)) {
    buttons.push({ id: "direction", offsetY: nextY });
    nextY += BTN_SPACING;
  }
  buttons.push({ id: "motor", offsetY: nextY });
  return buttons;
}

export function hitButton(sx: number, sy: number, cx: number, cy: number): boolean {
  return Math.abs(sx - cx) < BTN_HALF_WIDTH && Math.abs(sy - cy) < BTN_HALF_HEIGHT;
}

/** Execute the action for a button */
export function executeButtonAction(id: SelectionButton["id"], body: planck.Body, world: planck.World) {
  switch (id) {
    case "toggle": {
      const isStatic = body.isStatic();
      body.setType(isStatic ? "dynamic" : "static");
      break;
    }
    case "direction":
      reverseDirection(body, world);
      break;
    case "motor":
      toggleMotor(body);
      break;
  }
}

function reverseDirection(body: planck.Body, world: planck.World) {
  const label = getBodyLabel(body);
  if (label === "car" || label === "train") {
    for (let j = world.getJointList(); j; j = j.getNext()) {
      if (j.getType() === "wheel-joint" && (j.getBodyA() === body || j.getBodyB() === body)) {
        const wj = j as planck.WheelJoint;
        wj.setMotorSpeed(-wj.getMotorSpeed());
      }
    }
  } else if (label === "conveyor") {
    const ud = getBodyUserData(body);
    if (isConveyor(ud)) ud.speed = -ud.speed;
  } else if (label === "rocket") {
    const ud = getBodyUserData(body);
    if (isRocket(ud)) ud.thrust = -ud.thrust;
  }
  const mud = getBodyUserData(body);
  if (mud && mud.motorSpeed != null) mud.motorSpeed = -mud.motorSpeed;
}

function toggleMotor(body: planck.Body) {
  const ud = getBodyUserData(body);
  if (ud && ud.motorSpeed != null) {
    delete ud.motorSpeed;
  } else {
    if (body.isStatic()) body.setType("dynamic");
    const data = (body.getUserData() ?? {}) as Record<string, unknown>;
    data.motorSpeed = 5;
    body.setUserData(data);
    body.setAwake(true);
  }
}
