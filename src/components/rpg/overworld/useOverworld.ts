import { useEffect, useReducer, useRef } from 'react';
import type { Direction } from '../../../data/overworld';
import {
  createOverworldState,
  overworldReducer,
  type OverworldAction,
  type OverworldState,
  type ScenePos,
} from './overworldReducer';
import type { BattleAction, SfxKind } from '../battle/types';
import { loadSave, writeSave } from '../../../utils/rpg-save';
import {
  playBuzzer, playCancel, playConfirm, playCursor, playDefeat, playHeal, playHit, playHurt,
  playLimit, playVictory, setMuted,
} from '../../../utils/rpg-audio';
import { ff7MenuIsOpen } from '../../../utils/rpg-menu';

const POS_KEY = 'rpg-ow';

interface UseOverworldOptions {
  /** game clock multiplier, from the rpg-speed query param */
  speed: number;
}

const KEY_DIRS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const BATTLE_SFX: Record<SfxKind, () => void> = {
  cursor: playCursor,
  confirm: playConfirm,
  cancel: playCancel,
  buzzer: playBuzzer,
  hit: playHit,
  hurt: playHurt,
  heal: playHeal,
  limit: playLimit,
  victory: playVictory,
  defeat: playDefeat,
  weak: playLimit,
  miss: playCancel,
  levelup: playVictory,
  encounter: playBuzzer,
};

function isFormTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

function isConfirmKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}

function isCancelKey(key: string): boolean {
  return key === 'Escape' || key === 'x';
}

function isEncounterKey(key: string): boolean {
  return key === 'e' || key === 'E';
}

/** Play a sound each time the reducer bumps one of its sound counters. */
function useSoundOnSeq(seq: number, play: () => void): void {
  const last = useRef(seq);
  useEffect(() => {
    if (seq === last.current) return;
    last.current = seq;
    play();
  }, [seq]);
}

function readSavedPos(): Partial<ScenePos> | null {
  try {
    const raw = sessionStorage.getItem(POS_KEY);
    return raw ? (JSON.parse(raw) as Partial<ScenePos>) : null;
  } catch {
    return null;
  }
}

function readSeed(): number {
  const v = new URLSearchParams(window.location.search).get('rpg-seed');
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : Date.now() >>> 0;
}

/** Route a key press to the battle reducer, given the current battle phase. */
function battleActionForKey(state: OverworldState, key: string): BattleAction | null {
  const b = state.battle;
  if (!b) return null;
  const dir = KEY_DIRS[key];
  if (b.phase === 'victory' || b.phase === 'defeat' || b.phase === 'fled') {
    return isConfirmKey(key) ? { type: 'RESULT_CONTINUE' } : null;
  }
  if (b.phase === 'target') {
    if (dir === 'left' || dir === 'up') return { type: 'TARGET_MOVE', delta: -1 };
    if (dir === 'right' || dir === 'down') return { type: 'TARGET_MOVE', delta: 1 };
    if (isConfirmKey(key)) return { type: 'TARGET_CONFIRM' };
    if (isCancelKey(key)) return { type: 'MENU_CANCEL' };
    return null;
  }
  if (b.phase === 'select') {
    if (dir === 'up' || dir === 'left') return { type: 'MENU_MOVE', delta: -1 };
    if (dir === 'down' || dir === 'right') return { type: 'MENU_MOVE', delta: 1 };
    if (isConfirmKey(key)) return { type: 'MENU_CONFIRM' };
    if (isCancelKey(key)) return { type: 'MENU_CANCEL' };
    return null;
  }
  return null;
}

export function useOverworld({
  speed,
}: UseOverworldOptions): [OverworldState, React.Dispatch<OverworldAction>] {
  const [state, dispatch] = useReducer(overworldReducer, undefined, () =>
    createOverworldState(readSavedPos(), loadSave(), readSeed())
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  // Single rAF loop driving movement, fades, dialog typewriter, and battle timing
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!document.hidden) {
        dispatch({ type: 'TICK', dt: (now - last) * speed });
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isFormTarget(e.target)) return;
      // FF7 nav menu overlays the screen - let its own handler own the keys
      if (ff7MenuIsOpen()) return;

      const current = stateRef.current;
      const mode = current.mode;
      if (mode === 'window') return; // window components own their keys
      if (mode === 'fade') {
        e.preventDefault();
        return;
      }

      if (mode === 'battle') {
        const action = battleActionForKey(current, e.key);
        if (!action) return;
        dispatch({ type: 'BATTLE', action });
        e.preventDefault();
        return;
      }

      const dir = KEY_DIRS[e.key];

      if (mode === 'dialog') {
        if (dir === 'up') {
          dispatch({ type: 'DIALOG_NAV', delta: -1 });
        } else if (dir === 'down') {
          dispatch({ type: 'DIALOG_NAV', delta: 1 });
        } else if (isConfirmKey(e.key)) {
          dispatch({ type: 'INTERACT' });
        } else if (isCancelKey(e.key)) {
          dispatch({ type: 'DIALOG_CANCEL' });
        } else {
          return;
        }
        e.preventDefault();
        return;
      }

      if (dir) {
        if (!e.repeat) dispatch({ type: 'INPUT_DOWN', dir });
        e.preventDefault();
        return;
      }
      if (isEncounterKey(e.key)) {
        dispatch({ type: 'TOGGLE_ENCOUNTERS' });
        e.preventDefault();
        return;
      }
      if (isConfirmKey(e.key)) {
        dispatch({ type: 'INTERACT' });
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) dispatch({ type: 'INPUT_UP', dir });
    };
    const onBlur = () => dispatch({ type: 'CLEAR_INPUT' });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Menu quick-travel and commands, dispatched by RPGContainer/NavigationRPG
  useEffect(() => {
    const onGoto = (e: Event) => {
      const detail = (e as CustomEvent<{ scene?: string }>).detail;
      if (detail?.scene) dispatch({ type: 'TELEPORT', scene: detail.scene });
    };
    const onCommand = (e: Event) => {
      const command = (e as CustomEvent<{ command?: string }>).detail?.command;
      if (command === 'toggle-encounters') dispatch({ type: 'TOGGLE_ENCOUNTERS' });
      if (command === 'toggle-sound') dispatch({ type: 'SET_SOUND', on: !stateRef.current.save.sound });
    };
    document.addEventListener('rpg:goto', onGoto);
    document.addEventListener('rpg:command', onCommand);
    return () => {
      document.removeEventListener('rpg:goto', onGoto);
      document.removeEventListener('rpg:command', onCommand);
    };
  }, []);

  // Persist scene + settled position so reloads and theme flips resume in place
  useEffect(() => {
    if (state.stepping || state.mode === 'fade' || state.mode === 'battle') return;
    try {
      sessionStorage.setItem(
        POS_KEY,
        JSON.stringify({ scene: state.scene, x: state.x, y: state.y, facing: state.facing })
      );
    } catch {
      // private mode etc. - position just does not persist
    }
  }, [state.scene, state.x, state.y, state.facing, state.stepping, state.mode]);

  // Persist the save whenever it changes; mirror its flags onto the menu and the synth
  useEffect(() => {
    writeSave(state.save);
    setMuted(!state.save.sound);
    document.querySelectorAll('[data-encounters-label]').forEach((el) => {
      el.textContent = state.save.encounters ? 'ENCOUNTERS: ON' : 'ENCOUNTERS: OFF';
    });
    document.querySelectorAll('[data-sound-label]').forEach((el) => {
      el.textContent = state.save.sound ? 'SOUND: ON' : 'SOUND: OFF';
    });
  }, [state.save]);

  // Sounds: a new prompt or a moved dialog cursor blips, confirm-style actions confirm
  useSoundOnSeq(state.promptSeq, playCursor);
  useSoundOnSeq(state.confirmSeq, playConfirm);

  // Battle sound effects come from the battle reducer's own counter
  const lastBattleSfx = useRef(0);
  useEffect(() => {
    const sfx = state.battle?.lastSfx;
    if (!sfx || sfx.seq === lastBattleSfx.current) return;
    lastBattleSfx.current = sfx.seq;
    BATTLE_SFX[sfx.kind]?.();
  }, [state.battle?.lastSfx]);

  return [state, dispatch];
}
