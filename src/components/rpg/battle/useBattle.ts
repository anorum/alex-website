import { useEffect, useReducer, useRef } from 'react';
import type { Boss } from '../../../data/battles';
import { battleReducer, createBattleState } from './battleReducer';
import type { BattleAction, BattleState } from './types';
import {
  playCursor,
  playConfirm,
  playCancel,
  playBuzzer,
  playHit,
  playHurt,
  playHeal,
  playLimit,
  playVictory,
  playDefeat,
} from '../../../utils/rpg-audio';

const sfxMap = {
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
} as const;

interface UseBattleOptions {
  boss: Boss;
  seed: number;
  speed: number;
  /** battle section is currently visible */
  active: boolean;
}

function isFormTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

export function useBattle({ boss, seed, speed, active }: UseBattleOptions): [BattleState, React.Dispatch<BattleAction>] {
  const [state, dispatch] = useReducer(battleReducer, undefined, () => createBattleState(boss, seed));

  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;

  // Single rAF loop driving all battle timing
  const running = active && state.phase !== 'victory' && state.phase !== 'defeat';
  useEffect(() => {
    if (!running) return;
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
  }, [running, speed]);

  // Keyboard controls, attached only while the battle section is active
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isFormTarget(e.target)) return;
      // FF7 nav menu overlays the screen — let its own handler own the keys
      const nav = document.getElementById('ff7-nav');
      if (nav && !nav.classList.contains('hidden')) return;
      if (phaseRef.current !== 'command') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          dispatch({ type: 'MENU_MOVE', delta: -1 });
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          dispatch({ type: 'MENU_MOVE', delta: 1 });
          e.preventDefault();
          break;
        case 'Enter':
          dispatch({ type: 'MENU_CONFIRM' });
          e.preventDefault();
          break;
        case 'Escape':
          dispatch({ type: 'MENU_CANCEL' });
          e.preventDefault();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);

  // Sound effects
  const lastSfxSeq = useRef(0);
  useEffect(() => {
    if (state.lastSfx && state.lastSfx.seq !== lastSfxSeq.current) {
      lastSfxSeq.current = state.lastSfx.seq;
      sfxMap[state.lastSfx.kind]?.();
    }
  }, [state.lastSfx]);

  return [state, dispatch];
}
