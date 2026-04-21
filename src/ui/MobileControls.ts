import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import {
  requestMobileAction,
  setMobileMove,
} from "../systems/MobileInput";

const JOY_BASE_RADIUS = 70;
const JOY_KNOB_RADIUS = 30;
const JOY_MARGIN = 40;

const ACTION_RADIUS = 48;
const ACTION_MARGIN = 32;

const JOY_CENTER_X = JOY_MARGIN + JOY_BASE_RADIUS;
const JOY_CENTER_Y = GAME_HEIGHT - JOY_MARGIN - JOY_BASE_RADIUS;

const ACTION_X = GAME_WIDTH - ACTION_MARGIN - ACTION_RADIUS - 320;
const ACTION_Y = GAME_HEIGHT - ACTION_MARGIN - ACTION_RADIUS;

export interface MobileControls {
  showActionButton: (visible: boolean) => void;
  destroy: () => void;
}

export function mountMobileControls(k: KAPLAYCtx): MobileControls {
  const created: GameObj[] = [];
  const add = <T extends GameObj>(obj: T): T => {
    created.push(obj);
    return obj;
  };

  const joyBase = add(
    k.add([
      k.circle(JOY_BASE_RADIUS),
      k.pos(JOY_CENTER_X, JOY_CENTER_Y),
      k.anchor("center"),
      k.color(20, 30, 24),
      k.outline(3, k.rgb(160, 200, 170)),
      k.opacity(0.55),
      k.fixed(),
      k.z(150),
    ]),
  );

  const joyKnob = add(
    k.add([
      k.circle(JOY_KNOB_RADIUS),
      k.pos(JOY_CENTER_X, JOY_CENTER_Y),
      k.anchor("center"),
      k.color(120, 180, 140),
      k.outline(2, k.rgb(220, 240, 220)),
      k.opacity(0.85),
      k.fixed(),
      k.z(151),
    ]),
  );

  const actionBtn = add(
    k.add([
      k.circle(ACTION_RADIUS),
      k.pos(ACTION_X, ACTION_Y),
      k.anchor("center"),
      k.color(200, 120, 40),
      k.outline(3, k.rgb(255, 220, 120)),
      k.opacity(0),
      k.fixed(),
      k.z(150),
    ]),
  );

  const actionLabel = add(
    k.add([
      k.text("GO!", { size: 22 }),
      k.pos(ACTION_X, ACTION_Y),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.opacity(0),
      k.fixed(),
      k.z(151),
    ]),
  );

  let actionVisible = false;
  let joyTouchId: number | null = null;
  let actionTouchId: number | null = null;

  const handleJoyMove = (px: number, py: number) => {
    const dx = px - JOY_CENTER_X;
    const dy = py - JOY_CENTER_Y;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, JOY_BASE_RADIUS);
    const nx = len === 0 ? 0 : dx / len;
    const ny = len === 0 ? 0 : dy / len;
    joyKnob.pos.x = JOY_CENTER_X + nx * clamped;
    joyKnob.pos.y = JOY_CENTER_Y + ny * clamped;

    const deadzone = 0.2;
    const strength = clamped / JOY_BASE_RADIUS;
    if (strength < deadzone) {
      setMobileMove(0, 0, true);
    } else {
      setMobileMove(nx * strength, ny * strength, true);
    }
  };

  const resetJoy = () => {
    joyKnob.pos.x = JOY_CENTER_X;
    joyKnob.pos.y = JOY_CENTER_Y;
    setMobileMove(0, 0, false);
  };

  const screenToGame = (pos: Vec2): { x: number; y: number } => ({ x: pos.x, y: pos.y });

  const insideJoy = (gx: number, gy: number): boolean => {
    const dx = gx - JOY_CENTER_X;
    const dy = gy - JOY_CENTER_Y;
    return dx * dx + dy * dy <= JOY_BASE_RADIUS * JOY_BASE_RADIUS * 2.25;
  };

  const insideAction = (gx: number, gy: number): boolean => {
    if (!actionVisible) return false;
    const dx = gx - ACTION_X;
    const dy = gy - ACTION_Y;
    return dx * dx + dy * dy <= ACTION_RADIUS * ACTION_RADIUS * 1.3;
  };

  const startCtrl = k.onTouchStart((pos, t) => {
    const gp = screenToGame(pos);
    if (joyTouchId === null && insideJoy(gp.x, gp.y)) {
      joyTouchId = t.identifier;
      handleJoyMove(gp.x, gp.y);
      return;
    }
    if (actionTouchId === null && insideAction(gp.x, gp.y)) {
      actionTouchId = t.identifier;
      requestMobileAction();
      (actionBtn as unknown as { opacity: number }).opacity = 1;
    }
  });

  const moveCtrl = k.onTouchMove((pos, t) => {
    if (t.identifier === joyTouchId) {
      const gp = screenToGame(pos);
      handleJoyMove(gp.x, gp.y);
    }
  });

  const endCtrl = k.onTouchEnd((_pos, t) => {
    if (t.identifier === joyTouchId) {
      joyTouchId = null;
      resetJoy();
    }
    if (t.identifier === actionTouchId) {
      actionTouchId = null;
      if (actionVisible) {
        (actionBtn as unknown as { opacity: number }).opacity = 0.85;
      }
    }
  });

  return {
    showActionButton: (visible) => {
      actionVisible = visible;
      const alpha = visible ? 0.85 : 0;
      (actionBtn as unknown as { opacity: number }).opacity = alpha;
      (actionLabel as unknown as { opacity: number }).opacity = visible ? 1 : 0;
    },
    destroy: () => {
      for (const obj of created) obj.destroy();
      startCtrl.cancel();
      moveCtrl.cancel();
      endCtrl.cancel();
      void joyBase;
    },
  };
}
