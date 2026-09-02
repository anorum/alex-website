import { describe, expect, it } from 'vitest';
import { elementMultiplier, physicalDamage, magicDamage, nextRng } from '../../src/components/rpg/battle/damage';
import type { Combatant } from '../../src/components/rpg/battle/types';

const target = (over: Partial<Combatant> = {}): Combatant => ({
  key: 'e1', side: 'enemy', name: 'E', defId: 'e', hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 10, def: 6, spd: 5,
  statuses: [], limit: 0, defending: false, nextAct: 0, alive: true, dodge: 0,
  weak: ['fire'], resist: ['ice'], absorb: ['lightning'], immune: [], actsTwice: false, turnsTaken: 0, ...over,
});

describe('damage', () => {
  it('element multipliers', () => {
    const t = target();
    expect(elementMultiplier(t, 'fire')).toBe(2);
    expect(elementMultiplier(t, 'ice')).toBe(0.5);
    expect(elementMultiplier(t, 'lightning')).toBe(0);
    expect(elementMultiplier(t, 'earth')).toBe(1);
    expect(elementMultiplier(t, 'none')).toBe(1);
  });
  it('rng is deterministic', () => {
    const [a, s1] = nextRng(42);
    const [b] = nextRng(42);
    expect(a).toBe(b);
    expect(s1).not.toBe(42);
  });
  it('physical damage scales with atk minus def, defend halves, never below 1', () => {
    const attacker = target({ key: 'a', side: 'party', atk: 20 });
    const [d1] = physicalDamage(attacker, target({ def: 6 }), 1, 7);
    const [d2] = physicalDamage(attacker, target({ def: 6, defending: true }), 1, 7);
    expect(d2).toBeLessThan(d1);
    expect(d2).toBeGreaterThanOrEqual(1);
    const [tiny] = physicalDamage(target({ key: 'a', atk: 1 }), target({ def: 99 }), 1, 7);
    expect(tiny).toBe(1);
  });
  it('magic damage applies element and ignores half of def', () => {
    const caster = target({ key: 'a', side: 'party', atk: 10 });
    const [weak] = magicDamage(caster, target(), 30, 'fire', 7);
    const [plain] = magicDamage(caster, target(), 30, 'earth', 7);
    expect(weak).toBeGreaterThan(plain);
  });
});
