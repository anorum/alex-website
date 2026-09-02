import { describe, expect, it } from 'vitest';
import { createOverworldState, overworldReducer, ENCOUNTER_GRACE_STEPS } from '../../src/components/rpg/overworld/overworldReducer';
import { defaultSave } from '../../src/utils/rpg-save';
import { enemyById } from '../../src/data/enemies';

type S = ReturnType<typeof createOverworldState>;

function tick(s: S, ms: number): S {
  for (let t = 0; t < ms; t += 20) s = overworldReducer(s, { type: 'TICK', dt: 20 });
  return s;
}

function step(s: S, dir: 'left' | 'right' | 'up' | 'down'): S {
  s = overworldReducer(s, { type: 'INPUT_DOWN', dir });
  s = tick(s, 20);
  s = overworldReducer(s, { type: 'INPUT_UP', dir });
  return tick(s, 220);
}

const flaky = () => ({ kind: 'random' as const, enemies: [enemyById('flaky-test')!], level: 5, exp: 0, gil: 0, inventory: {}, seed: 4 });

describe('overworld battle mode', () => {
  it('starts with the save in state', () => {
    const s = createOverworldState(null, { ...defaultSave(), gil: 5 }, 1);
    expect(s.save.gil).toBe(5);
    expect(s.mode).toBe('walk');
  });

  it('START_BATTLE enters battle mode after the swirl and BATTLE forwards actions', () => {
    let s = createOverworldState(null, defaultSave(), 1);
    s = overworldReducer(s, { type: 'START_BATTLE', setup: flaky() });
    expect(s.mode).toBe('fade');
    s = tick(s, 800);
    expect(s.mode).toBe('battle');
    expect(s.battle?.phase).toBe('intro');
    s = tick(s, 2000);
    expect(s.battle?.phase).toBe('select');
  });

  it('a finished battle returns to walk', () => {
    let s = createOverworldState(null, defaultSave(), 1);
    s = overworldReducer(s, { type: 'START_BATTLE', setup: flaky() });
    s = tick(s, 3000);
    // RUN is the last of six root commands in a random battle
    s = overworldReducer(s, { type: 'BATTLE', action: { type: 'MENU_SET_CURSOR', index: 5 } });
    s = overworldReducer(s, { type: 'BATTLE', action: { type: 'MENU_CONFIRM' } });
    s = tick(s, 2000);
    expect(s.battle?.phase).toBe('fled');
    s = overworldReducer(s, { type: 'BATTLE', action: { type: 'RESULT_CONTINUE' } });
    expect(s.mode).toBe('walk');
    expect(s.battle).toBeNull();
  });

  it('walking with encounters on eventually triggers a battle, with encounters off never', () => {
    let on = createOverworldState(null, defaultSave(), 7);
    let fought = false;
    for (let i = 0; i < 80 && !fought; i++) {
      on = step(on, i % 2 === 0 ? 'left' : 'right');
      if (on.mode === 'fade' || on.mode === 'battle') fought = true;
    }
    expect(fought).toBe(true); // seed 7 is deterministic; if the map changes, pick a seed that fights within 80 steps

    let off = createOverworldState(null, { ...defaultSave(), encounters: false }, 7);
    for (let i = 0; i < 80; i++) off = step(off, i % 2 === 0 ? 'left' : 'right');
    expect(off.mode).toBe('walk');
  });

  it('TOGGLE_ENCOUNTERS flips the save flag', () => {
    let s = createOverworldState(null, defaultSave(), 1);
    s = overworldReducer(s, { type: 'TOGGLE_ENCOUNTERS' });
    expect(s.save.encounters).toBe(false);
  });

  it('gives grace steps after a battle', () => {
    expect(ENCOUNTER_GRACE_STEPS).toBeGreaterThan(0);
  });

  it('defeat fades home with no gil loss', () => {
    let s = createOverworldState(null, { ...defaultSave(), gil: 77 }, 1);
    s = overworldReducer(s, { type: 'START_BATTLE', setup: { ...flaky(), gil: 77 } });
    s = tick(s, 800);
    s = { ...s, battle: { ...s.battle!, phase: 'defeat', result: { outcome: 'defeat', exp: 0, gil: 0, drops: [], levelsGained: 0, newLevel: 5 } } };
    s = overworldReducer(s, { type: 'BATTLE', action: { type: 'RESULT_CONTINUE' } });
    expect(s.mode).toBe('fade');
    expect(s.fade?.to?.scene).toBe('house');
    expect(s.save.gil).toBe(77);
  });
});
