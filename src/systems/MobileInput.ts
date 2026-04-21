export interface MobileInputState {
  dirX: number;
  dirY: number;
  active: boolean;
  actionRequested: boolean;
}

const state: MobileInputState = {
  dirX: 0,
  dirY: 0,
  active: false,
  actionRequested: false,
};

export function getMobileInput(): MobileInputState {
  return state;
}

export function setMobileMove(x: number, y: number, active: boolean): void {
  state.dirX = x;
  state.dirY = y;
  state.active = active;
}

export function requestMobileAction(): void {
  state.actionRequested = true;
}

export function consumeMobileAction(): boolean {
  if (state.actionRequested) {
    state.actionRequested = false;
    return true;
  }
  return false;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
  );
}
