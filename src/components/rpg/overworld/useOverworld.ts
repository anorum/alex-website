import { useEffect, useReducer, useRef } from 'react';
import type { Direction } from '../../../data/overworld';
import {
  createOverworldState,
  overworldReducer,
  type OverworldAction,
  type OverworldState,
  type ScenePos,
} from './overworldReducer';
import { playConfirm, playCursor } from '../../../utils/rpg-audio';
import { ff7MenuIsOpen } from '../../../utils/rpg-menu';

const POS_KEY = 'rpg-ow';

/** Defined by the script tag in RPGContainer.astro */
type RPGWindow = Window & { switchRPGSection?: (id: string) => void };

interface UseOverworldOptions {
  speed: number;
  /** overworld section is currently visible */
  active: boolean;
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

function isFormTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

function isConfirmKey(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'e';
}

function isCancelKey(key: string): boolean {
  return key === 'Escape' || key === 'x';
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

export function useOverworld({
  speed,
  active,
}: UseOverworldOptions): [OverworldState, React.Dispatch<OverworldAction>] {
  const [state, dispatch] = useReducer(overworldReducer, undefined, () =>
    createOverworldState(readSavedPos())
  );

  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  // Single rAF loop driving movement, fades, and the dialog typewriter
  useEffect(() => {
    if (!active) return;
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
  }, [active, speed]);

  // Keyboard controls, attached only while the overworld section is active
  useEffect(() => {
    if (!active) {
      dispatch({ type: 'CLEAR_INPUT' });
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isFormTarget(e.target)) return;
      // FF7 nav menu overlays the screen - let its own handler own the keys
      if (ff7MenuIsOpen()) return;

      const mode = modeRef.current;
      if (mode === 'window') return; // window components own their keys
      if (mode === 'fade') {
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
  }, [active]);

  // Menu quick-travel: RPGContainer dispatches 'rpg:goto' with a scene id
  useEffect(() => {
    const onGoto = (e: Event) => {
      const detail = (e as CustomEvent<{ scene?: string }>).detail;
      if (detail?.scene) dispatch({ type: 'TELEPORT', scene: detail.scene });
    };
    document.addEventListener('rpg:goto', onGoto);
    return () => document.removeEventListener('rpg:goto', onGoto);
  }, []);

  // Persist scene + settled position so reloads and theme flips resume in place
  useEffect(() => {
    if (state.stepping || state.mode === 'fade') return;
    try {
      sessionStorage.setItem(
        POS_KEY,
        JSON.stringify({ scene: state.scene, x: state.x, y: state.y, facing: state.facing })
      );
    } catch {
      // private mode etc. - position just does not persist
    }
  }, [state.scene, state.x, state.y, state.facing, state.stepping, state.mode]);

  // Sounds: a new prompt or a moved dialog cursor blips, confirm-style actions confirm
  useSoundOnSeq(state.promptSeq, playCursor);
  useSoundOnSeq(state.confirmSeq, playConfirm);

  // Section handoff: the arena gatekeeper hands the player over to the battle section
  useEffect(() => {
    if (!state.entered) return;
    const switchSection = (window as RPGWindow).switchRPGSection;
    if (switchSection) switchSection(state.entered);
    dispatch({ type: 'ACK_ENTER' });
  }, [state.entered]);

  return [state, dispatch];
}
