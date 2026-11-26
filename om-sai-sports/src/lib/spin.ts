export type SpinState = {
  yaw: number;
  pitch: number;
  velocity: number;
  dragging: boolean;
  pointerX: number;
  pointerY: number;
};

export function createSpinState(initialYaw: number): SpinState {
  return {
    yaw: initialYaw,
    pitch: 0,
    velocity: 0,
    dragging: false,
    pointerX: 0,
    pointerY: 0,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
