// Scene order and the pure reducer that moves between scenes.
// Rules (tested in tests/machine.test.ts):
//  - "next" and "skip" move forward by exactly one scene, never backward.
//  - Nothing moves while paused.
//  - "restart" is only accepted once the story has finished; it returns to "dig".

export const SCENE_ORDER = ["start", "dig", "inside", "hole", "ascent", "again"] as const;
export type SceneId = (typeof SCENE_ORDER)[number];
export type Command = "next" | "skip" | "pause" | "resume" | "restart";

export interface MachineState {
  readonly index: number;
  readonly paused: boolean;
  readonly finished: boolean;
  readonly plays: number;
}

export const LAST = SCENE_ORDER.length - 1;
export const RESTART_INDEX = SCENE_ORDER.indexOf("dig");

export function initialState(): MachineState {
  return { index: 0, paused: false, finished: false, plays: 1 };
}

export function sceneOf(s: MachineState): SceneId {
  return SCENE_ORDER[s.index]!;
}

export function reduce(s: MachineState, cmd: Command): MachineState {
  switch (cmd) {
    case "pause":
      return s.index === 0 || s.finished ? s : { ...s, paused: true };
    case "resume":
      return { ...s, paused: false };
    case "next":
    case "skip":
      if (s.paused || s.finished) return s;
      if (s.index >= LAST) return { ...s, finished: true };
      return { ...s, index: s.index + 1 };
    case "restart":
      if (!s.finished) return s;
      return { index: RESTART_INDEX, paused: false, finished: false, plays: s.plays + 1 };
  }
}
