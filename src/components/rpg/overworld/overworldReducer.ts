// Pure deterministic reducer for the RPG: overworld, interiors, dialogs,
// windows, and battles. No DOM, no side effects. Side effects (sfx, save
// writes) are driven by seq counters and state.save, which the hook watches.

import { STEP_MS, exitAt, getScene, interactableAhead, isWalkableIn } from '../../../data/scenes';
import { getScript, type DialogAction } from '../../../data/dialogs';
import { DIRECTION_DELTA, type Direction } from '../../../data/overworld';
import { bossById } from '../../../data/bosses';
import { itemById } from '../../../data/items';
import { levelFromExp } from '../../../data/party';
import type { SaveData } from '../../../utils/rpg-save';
import { createBattleState, battleReducer, type BattleSetup } from '../battle/battleReducer';
import { nextRng } from '../battle/damage';
import type { BattleAction, BattleState } from '../battle/types';
import { rollEncounter } from './encounters';

/** ms of game clock per revealed dialog character */
export const CHAR_MS = 28;
/** ms of game clock per fade phase (out, then in) */
export const FADE_MS = 180;
/** ms of game clock for the battle swirl */
export const SWIRL_MS = 500;
/** settled steps after a battle before the next roll can fire */
export const ENCOUNTER_GRACE_STEPS = 4;

export type Mode = 'walk' | 'dialog' | 'window' | 'fade' | 'battle';

export interface ScenePos {
  scene: string;
  x: number;
  y: number;
  facing: Direction;
}

export interface Prompt {
  kind: 'exit' | 'interact';
  label: string;
  hint?: string;
}

export interface DialogState {
  scriptId: string;
  step: number;
  /** clock when this step started; drives the typewriter */
  openedAt: number;
  /** skip pressed: show the whole line */
  revealAll: boolean;
  choiceIndex: number;
}

export interface OverworldState {
  clock: number;
  scene: string;
  mode: Mode;
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
  prompt: Prompt | null;
  fade: { phase: 'out' | 'in'; t: number; to?: ScenePos } | null;
  dialog: DialogState | null;
  /** open content window id, if any */
  window: string | null;
  /** the persisted save, held here so the reducer stays pure */
  save: SaveData;
  battle: BattleState | null;
  /** queued while the encounter swirl plays */
  pendingBattle: BattleSetup | null;
  stepsSinceBattle: number;
  /** mulberry32 state for encounter rolls and battle seeds */
  rng: number;
  /** increments when a new prompt appears or the dialog cursor moves (cursor sfx) */
  promptSeq: number;
  /** increments on confirm-style actions (confirm sfx) */
  confirmSeq: number;
}

export type OverworldAction =
  | { type: 'TICK'; dt: number }
  | { type: 'INPUT_DOWN'; dir: Direction }
  | { type: 'INPUT_UP'; dir: Direction }
  | { type: 'CLEAR_INPUT' }
  | { type: 'INTERACT' }
  | { type: 'DIALOG_NAV'; delta: number }
  | { type: 'DIALOG_CANCEL' }
  | { type: 'CLOSE_WINDOW' }
  | { type: 'TELEPORT'; scene: string }
  | { type: 'START_BATTLE'; setup: BattleSetup }
  | { type: 'BATTLE'; action: BattleAction }
  | { type: 'TOGGLE_ENCOUNTERS' }
  | { type: 'SET_ENCOUNTERS'; on: boolean }
  | { type: 'SET_SOUND'; on: boolean }
  | { type: 'SET_SAVE'; save: SaveData }
  | { type: 'BUY'; itemId: string }
  | { type: 'SHOW_INTRO' };

function computePrompt(state: OverworldState): Prompt | null {
  const scene = getScene(state.scene);
  const exit = exitAt(scene, state.x, state.y);
  if (exit) return { kind: 'exit', label: exit.label, hint: exit.hint };
  const ahead = interactableAhead(scene, state.x, state.y, state.facing);
  if (ahead) return { kind: 'interact', label: ahead.name, hint: ahead.hint };
  return null;
}

/** Marks a confirm-style action; the hook plays a confirm blip on each bump. */
function confirmed(state: OverworldState): OverworldState {
  return { ...state, confirmSeq: state.confirmSeq + 1 };
}

function withPrompt(state: OverworldState): OverworldState {
  const prompt = computePrompt(state);
  const changed = prompt?.label !== state.prompt?.label;
  return {
    ...state,
    prompt,
    promptSeq: prompt && changed ? state.promptSeq + 1 : state.promptSeq,
  };
}

export function createOverworldState(
  saved: Partial<ScenePos> | null | undefined,
  save: SaveData,
  seed: number
): OverworldState {
  const scene = getScene(saved?.scene ?? 'world');
  let x = saved?.x ?? scene.spawn.x;
  let y = saved?.y ?? scene.spawn.y;
  if (!isWalkableIn(scene, x, y)) {
    x = scene.spawn.x;
    y = scene.spawn.y;
  }
  const base: OverworldState = {
    clock: 0,
    scene: scene.id,
    mode: 'walk',
    x,
    y,
    fromX: x,
    fromY: y,
    stepping: false,
    progress: 0,
    facing: saved?.facing ?? scene.spawn.facing,
    stepFrame: 0,
    queue: [],
    prompt: null,
    fade: null,
    dialog: null,
    window: null,
    save,
    battle: null,
    pendingBattle: null,
    stepsSinceBattle: ENCOUNTER_GRACE_STEPS,
    rng: seed >>> 0 || 1,
    promptSeq: 0,
    confirmSeq: 0,
  };
  return { ...base, prompt: computePrompt(base) };
}

function battleSetupFromSave(state: OverworldState, partial: Pick<BattleSetup, 'kind' | 'enemies' | 'bossId' | 'seed'>): BattleSetup {
  return {
    ...partial,
    level: state.save.level,
    exp: state.save.exp,
    gil: state.save.gil,
    inventory: state.save.inventory,
  };
}

function startBattle(state: OverworldState, setup: BattleSetup): OverworldState {
  return confirmed({
    ...state,
    mode: 'fade',
    fade: { phase: 'out', t: 0 },
    pendingBattle: setup,
    prompt: null,
    dialog: null,
    window: null,
    queue: [],
  });
}

function settle(state: OverworldState): OverworldState {
  const settled = withPrompt({
    ...state,
    stepping: false,
    progress: 0,
    fromX: state.x,
    fromY: state.y,
    stepFrame: state.stepFrame === 0 ? 1 : 0,
    stepsSinceBattle: state.stepsSinceBattle + 1,
  });
  if (settled.scene !== 'world' || !settled.save.encounters || settled.stepsSinceBattle < ENCOUNTER_GRACE_STEPS) {
    return settled;
  }
  const roll = rollEncounter(settled.rng, settled.x, settled.y);
  if (!roll.group) return { ...settled, rng: roll.rng };
  return startBattle(
    { ...settled, rng: roll.rng },
    battleSetupFromSave(settled, { kind: 'random', enemies: roll.group, seed: roll.rng })
  );
}

function tryStartStep(state: OverworldState): OverworldState {
  const dir = state.queue[0];
  if (!dir) return state;
  const scene = getScene(state.scene);
  const { dx, dy } = DIRECTION_DELTA[dir];
  const tx = state.x + dx;
  const ty = state.y + dy;
  if (!isWalkableIn(scene, tx, ty)) {
    // blocked: face that way (may reveal an interactable prompt)
    return state.facing === dir ? state : withPrompt({ ...state, facing: dir });
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
    prompt: null,
  };
}

function startFade(state: OverworldState, to: ScenePos): OverworldState {
  return confirmed({
    ...state,
    mode: 'fade',
    fade: { phase: 'out', t: 0, to },
    prompt: null,
    dialog: null,
    window: null,
    queue: [],
  });
}

function endDialog(state: OverworldState): OverworldState {
  return withPrompt({ ...state, mode: 'walk', dialog: null });
}

function openDialog(state: OverworldState, scriptId: string): OverworldState {
  const opened: OverworldState = {
    ...state,
    mode: 'dialog',
    prompt: null,
    queue: [],
    dialog: { scriptId, step: 0, openedAt: state.clock, revealAll: false, choiceIndex: 0 },
  };
  // scripts may open with an action step
  return enterStep(opened, 0);
}

function runAction(state: OverworldState, action: DialogAction): OverworldState {
  switch (action.type) {
    case 'openWindow':
      return confirmed({ ...endDialog(state), mode: 'window', window: action.window });
    case 'battle': {
      const boss = bossById(action.bossId);
      if (!boss) return endDialog(state);
      const [, seed] = nextRng(state.rng);
      return startBattle(
        { ...endDialog(state), rng: seed },
        battleSetupFromSave(state, { kind: 'boss', bossId: boss.id, enemies: [boss], seed })
      );
    }
    case 'setEncounters': {
      const next = confirmed({ ...state, save: { ...state.save, encounters: action.on } });
      return openDialog(next, action.then);
    }
    case 'end':
    default:
      return endDialog(state);
  }
}

/** Advance the dialog into step `idx`, auto-executing action steps. */
function enterStep(state: OverworldState, idx: number): OverworldState {
  const dialog = state.dialog;
  if (!dialog) return state;
  const script = getScript(dialog.scriptId);
  if (idx >= script.length) return endDialog(state);
  const step = script[idx];
  if (step.kind === 'action') return runAction(state, step.action);
  return {
    ...state,
    dialog: { ...dialog, step: idx, openedAt: state.clock, revealAll: false, choiceIndex: 0 },
  };
}

export function lineRevealed(state: OverworldState): boolean {
  const dialog = state.dialog;
  if (!dialog) return true;
  const step = getScript(dialog.scriptId)[dialog.step];
  if (step?.kind !== 'line') return true;
  if (dialog.revealAll) return true;
  return (state.clock - dialog.openedAt) / CHAR_MS >= step.text.length;
}

/** Apply a finished battle's result to the save and leave battle mode. */
function finishBattle(state: OverworldState): OverworldState {
  const result = state.battle?.result;
  const inventory = { ...(state.battle?.inventory ?? state.save.inventory) };
  let save: SaveData = { ...state.save, inventory };
  if (result?.outcome === 'victory') {
    const exp = state.save.exp + result.exp;
    save = {
      ...save,
      exp,
      gil: state.save.gil + result.gil,
      level: levelFromExp(exp),
      bossesBeaten:
        result.bossId && !state.save.bossesBeaten.includes(result.bossId)
          ? [...state.save.bossesBeaten, result.bossId]
          : state.save.bossesBeaten,
    };
  }
  const base: OverworldState = { ...state, battle: null, save, mode: 'walk', stepsSinceBattle: 0 };
  if (result?.outcome === 'defeat') {
    // wake at home, no penalty
    const house = getScene('house');
    return startFade(base, { scene: house.id, ...house.spawn });
  }
  return withPrompt(base);
}

export function overworldReducer(state: OverworldState, action: OverworldAction): OverworldState {
  switch (action.type) {
    case 'TICK': {
      let next = { ...state, clock: state.clock + action.dt };
      if (next.mode === 'fade' && next.fade) {
        const ms = next.pendingBattle ? SWIRL_MS : FADE_MS;
        const t = next.fade.t + action.dt / ms;
        if (t < 1) {
          next.fade = { ...next.fade, t };
        } else if (next.fade.phase === 'out' && next.pendingBattle) {
          next = {
            ...next,
            mode: 'battle',
            fade: null,
            battle: createBattleState(next.pendingBattle),
            pendingBattle: null,
            stepsSinceBattle: 0,
          };
        } else if (next.fade.phase === 'out' && next.fade.to) {
          const to = next.fade.to;
          next = {
            ...next,
            scene: to.scene,
            x: to.x,
            y: to.y,
            fromX: to.x,
            fromY: to.y,
            facing: to.facing,
            stepping: false,
            progress: 0,
            fade: { phase: 'in', t: 0 },
          };
        } else {
          next = withPrompt({ ...next, fade: null, mode: 'walk' });
        }
        return next;
      }
      if (next.mode === 'battle' && next.battle) {
        return { ...next, battle: battleReducer(next.battle, { type: 'TICK', dt: action.dt }) };
      }
      if (next.mode !== 'walk') return next;
      if (next.stepping) {
        next.progress = next.progress + action.dt / STEP_MS;
        if (next.progress >= 1) next = settle(next);
      }
      if (next.mode === 'walk' && !next.stepping) next = tryStartStep(next);
      return next;
    }

    case 'INPUT_DOWN': {
      if (state.mode !== 'walk') return state;
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
      if (state.mode === 'dialog' && state.dialog) {
        const script = getScript(state.dialog.scriptId);
        const step = script[state.dialog.step];
        if (step?.kind === 'choice') {
          const option = step.options[state.dialog.choiceIndex];
          return option ? runAction(state, option.action) : endDialog(state);
        }
        if (!lineRevealed(state)) {
          return { ...state, dialog: { ...state.dialog, revealAll: true } };
        }
        return enterStep(state, state.dialog.step + 1);
      }

      if (state.mode !== 'walk' || state.stepping || !state.prompt) return state;

      const scene = getScene(state.scene);
      if (state.prompt.kind === 'exit') {
        const exit = exitAt(scene, state.x, state.y);
        return exit ? startFade(state, exit.to) : state;
      }

      const ahead = interactableAhead(scene, state.x, state.y, state.facing);
      if (!ahead) return state;
      return openDialog(confirmed(state), ahead.scriptId);
    }

    case 'DIALOG_NAV': {
      const dialog = state.dialog;
      if (state.mode !== 'dialog' || !dialog) return state;
      const step = getScript(dialog.scriptId)[dialog.step];
      if (step?.kind !== 'choice') return state;
      const n = step.options.length;
      const choiceIndex = (dialog.choiceIndex + action.delta + n) % n;
      if (choiceIndex === dialog.choiceIndex) return state;
      return { ...state, dialog: { ...dialog, choiceIndex }, promptSeq: state.promptSeq + 1 };
    }

    case 'DIALOG_CANCEL':
      return state.mode === 'dialog' ? endDialog(state) : state;

    case 'CLOSE_WINDOW':
      return state.mode === 'window'
        ? withPrompt({ ...state, mode: 'walk', window: null })
        : state;

    case 'TELEPORT': {
      if (state.mode === 'fade' || state.mode === 'battle') return state;
      const scene = getScene(action.scene);
      if (scene.id === state.scene && state.mode === 'walk') return state;
      return startFade(state, { scene: scene.id, ...scene.spawn });
    }

    case 'START_BATTLE':
      if (state.mode === 'battle' || state.mode === 'fade') return state;
      return startBattle(state, action.setup);

    case 'BATTLE': {
      if (state.mode !== 'battle' || !state.battle) return state;
      const battle = battleReducer(state.battle, action.action);
      if (battle.phase !== 'done') return { ...state, battle };
      return finishBattle({ ...state, battle });
    }

    case 'TOGGLE_ENCOUNTERS':
      return confirmed({ ...state, save: { ...state.save, encounters: !state.save.encounters } });

    case 'SET_ENCOUNTERS':
      return { ...state, save: { ...state.save, encounters: action.on } };

    case 'SET_SOUND':
      return { ...state, save: { ...state.save, sound: action.on } };

    case 'SET_SAVE':
      return { ...state, save: action.save };

    case 'BUY': {
      const item = itemById(action.itemId);
      if (!item || state.save.gil < item.price) return state;
      const inventory = { ...state.save.inventory, [item.id]: (state.save.inventory[item.id] ?? 0) + 1 };
      return confirmed({ ...state, save: { ...state.save, gil: state.save.gil - item.price, inventory } });
    }

    case 'SHOW_INTRO': {
      if (state.save.seenIntro || state.mode !== 'walk') return state;
      return openDialog({ ...state, save: { ...state.save, seenIntro: true } }, 'intro-encounters');
    }

    default:
      return state;
  }
}
