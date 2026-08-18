import { useEffect, useReducer, useRef } from 'react';
import type { Direction } from '../../../data/overworld';
import {
  createOverworldState,
  overworldReducer,
  type OverworldAction,
  type OverworldState,
} from './overworldReducer';
import { playConfirm, playCursor } from '../../../utils/rpg-audio';

interface UseOverworldOptions {
  seed: number;
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

function menuIsOpen(): boolean {
  const nav = document.getElementById('ff7-nav');
  return !!nav && !nav.classList.contains('hidden');
}

export function useOverworld({ seed, speed, active }: UseOverworldOptions): [OverworldState, React.Dispatch<OverworldAction>] {
  const [state, dispatch] = useReducer(overworldReducer, undefined, () =>
    createOverworldState(seed)
  );

  // Single rAF loop driving movement
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
      if (menuIsOpen()) return;

      const dir = KEY_DIRS[e.key];
      if (dir) {
        if (!e.repeat) dispatch({ type: 'INPUT_DOWN', dir });
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e') {
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

  // Arriving at a door plays the cursor blip
  const lastDoorSeq = useRef(0);
  useEffect(() => {
    if (state.doorSeq !== lastDoorSeq.current) {
      lastDoorSeq.current = state.doorSeq;
      playCursor();
    }
  }, [state.doorSeq]);

  // Confirmed entry: play confirm and switch to the target section
  useEffect(() => {
    if (state.entered) {
      playConfirm();
      const fn = (window as unknown as { switchRPGSection?: (id: string) => void }).switchRPGSection;
      if (fn) fn(state.entered);
      dispatch({ type: 'ACK_ENTER' });
    }
  }, [state.entered]);

  return [state, dispatch];
}
