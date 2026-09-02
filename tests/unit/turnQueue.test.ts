import { describe, expect, it } from 'vitest';
import { actCost, nextActor, previewOrder, TICK_BASE } from '../../src/components/rpg/battle/turnQueue';
import type { Combatant } from '../../src/components/rpg/battle/types';

function c(key: string, spd: number, statuses: Combatant['statuses'] = []): Combatant {
  return {
    key, side: key.startsWith('e') ? 'enemy' : 'party', name: key.toUpperCase(), defId: key,
    hp: 100, maxHp: 100, mp: 10, maxMp: 10, atk: 10, def: 5, spd,
    statuses, limit: 0, defending: false, nextAct: 0, alive: true,
    dodge: 0, weak: [], resist: [], absorb: [], immune: [], actsTwice: false, turnsTaken: 0,
  };
}

describe('turn queue', () => {
  it('costs less for faster combatants', () => {
    expect(actCost(c('a', 20))).toBeLessThan(actCost(c('b', 10)));
    expect(actCost(c('b', 10))).toBe(Math.round(TICK_BASE / 10));
  });
  it('haste halves and slow doubles the cost', () => {
    const base = actCost(c('a', 10));
    expect(actCost(c('a', 10, [{ id: 'haste', turns: 2 }]))).toBe(Math.round(base / 2));
    expect(actCost(c('a', 10, [{ id: 'slow', turns: 2 }]))).toBe(base * 2);
  });
  it('picks the lowest nextAct, ties broken by speed then key', () => {
    const cs = [c('alex', 8), c('mara', 12), c('e1', 8)];
    cs[0].nextAct = 10; cs[1].nextAct = 5; cs[2].nextAct = 10;
    expect(nextActor(cs)!.key).toBe('mara');
    cs[1].nextAct = 10;
    expect(nextActor(cs)!.key).toBe('mara');
  });
  it('previews eight actors without mutating state', () => {
    const cs = [c('alex', 8), c('mara', 16), c('e1', 8)];
    const order = previewOrder(cs, 8);
    expect(order.length).toBe(8);
    expect(order.filter((k) => k === 'mara').length).toBeGreaterThan(order.filter((k) => k === 'alex').length);
    expect(cs.every((x) => x.nextAct === 0)).toBe(true);
  });
  it('skips dead combatants', () => {
    const cs = [c('alex', 8), c('e1', 30)];
    cs[1].alive = false;
    expect(previewOrder(cs, 3)).toEqual(['alex', 'alex', 'alex']);
  });
});
