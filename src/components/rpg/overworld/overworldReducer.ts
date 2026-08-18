// Pure deterministic reducer for the overworld. No DOM, no side effects.
// Side effects (sfx, section switches) are driven by seq counters the hook watches.

import {
  STEP_MS,
  doorAt,
  isWalkable,
  spawn,
  type Direction,
} from '../../../data/overworld';

export interface OverworldState {
  clock: number;
  /** mulberry32 rng state (reserved for ambient effects) */
  rng: number;
  /** settled tile, or step destination while stepping */
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  stepping: boolean;
  /** 0..1 within the current step */
  progress: number;
  facing: Direction;
  stepFrame: 0 | 1;
  /** held directions, most recent first */
  queue: Direction[];
  /** location id when standing on a door tile */
  atDoor: string | null;
  /** sectionId emitted by INTERACT; hook consumes via ACK_ENTER */
  entered: string | null;
  /** increments when arriving on a door tile (cursor sfx) */
  doorSeq: number;
  /** increments on a confirmed entry (confirm sfx) */
  enterSeq: number;
}

export type OverworldAction =
  | { type: 'TICK'; dt: number }
  | { type: 'INPUT_DOWN'; dir: Direction }
  | { type: 'INPUT_UP'; dir: Direction }
  | { type: 'CLEAR_INPUT' }
  | { type: 'INTERACT' }
  | { type: 'ACK_ENTER' };

const DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export function createOverworldState(seed: number): OverworldState {
  return {
    clock: 0,
    rng: seed >>> 0 || 1,
    x: spawn.x,
    y: spawn.y,
    fromX: spawn.x,
    fromY: spawn.y,
    stepping: false,
    progress: 0,
    facing: 'down',
    stepFrame: 0,
    queue: [],
    atDoor: doorAt(spawn.x, spawn.y)?.id ?? null,
    entered: null,
    doorSeq: 0,
    enterSeq: 0,
  };
}

function settle(state: OverworldState): OverworldState {
  const door = doorAt(state.x, state.y);
  return {
    ...state,
    stepping: false,
    progress: 0,
    fromX: state.x,
    fromY: state.y,
    stepFrame: state.stepFrame === 0 ? 1 : 0,
    atDoor: door?.id ?? null,
    doorSeq: door && door.id !== state.atDoor ? state.doorSeq + 1 : state.doorSeq,
  };
}

function tryStartStep(state: OverworldState): OverworldState {
  const dir = state.queue[0];
  if (!dir) return state;
  const { dx, dy } = DELTA[dir];
  const tx = state.x + dx;
  const ty = state.y + dy;
  if (!isWalkable(tx, ty)) {
    // blocked: just face that way
    return state.facing === dir ? state : { ...state, facing: dir };
  }
  return {
    ...state,
    facing: dir,
    stepping: true,
    progress: 0,
    fromX: state.x,
    fromY: state.y,
    x: tx,
    y: ty,
    atDoor: null,
  };
}

export function overworldReducer(state: OverworldState, action: OverworldAction): OverworldState {
  switch (action.type) {
    case 'TICK': {
      let next = { ...state, clock: state.clock + action.dt };
      if (next.stepping) {
        next.progress = next.progress + action.dt / STEP_MS;
        if (next.progress >= 1) next = settle(next);
      }
      if (!next.stepping) next = tryStartStep(next);
      return next;
    }

    case 'INPUT_DOWN': {
      if (state.queue[0] === action.dir) return state;
      const queue = [action.dir, ...state.queue.filter((d) => d !== action.dir)];
      return { ...state, queue };
    }

    case 'INPUT_UP': {
      if (!state.queue.includes(action.dir)) return state;
      return { ...state, queue: state.queue.filter((d) => d !== action.dir) };
    }

    case 'CLEAR_INPUT':
      return state.queue.length === 0 ? state : { ...state, queue: [] };

    case 'INTERACT': {
      if (state.stepping || !state.atDoor) return state;
      const door = doorAt(state.x, state.y);
      if (!door) return state;
      return { ...state, entered: door.sectionId, enterSeq: state.enterSeq + 1 };
    }

    case 'ACK_ENTER':
      return state.entered === null ? state : { ...state, entered: null };

    default:
      return state;
  }
}
