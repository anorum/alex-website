// Damage and element math plus the seeded RNG. Pure functions that return
// the next rng state alongside their result so the reducer stays deterministic.

import type { Element } from '../../../data/materia';
import type { Combatant } from './types';

/** mulberry32 step */
export function nextRng(state: number): [value: number, next: number] {
  const t = (state + 0x6d2b79f5) | 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

export const DAMAGE_VARIANCE = 0.1;

export function rollVariance(rng: number): [mult: number, next: number] {
  const [r, next] = nextRng(rng);
  return [1 - DAMAGE_VARIANCE + 2 * DAMAGE_VARIANCE * r, next];
}

export function elementMultiplier(target: Combatant, element: Element): number {
  if (element === 'none') return 1;
  if (target.absorb.includes(element)) return 0;
  if (target.weak.includes(element)) return 2;
  if (target.resist.includes(element)) return 0.5;
  return 1;
}

function attackMultiplier(c: Combatant): number {
  let m = 1;
  if (c.statuses.some((s) => s.id === 'atkUp')) m *= 1.5;
  if (c.statuses.some((s) => s.id === 'atkDown')) m *= 0.7;
  return m;
}

function defenseValue(c: Combatant): number {
  let d = c.def;
  if (c.statuses.some((s) => s.id === 'defDown')) d = Math.round(d * 0.6);
  return d;
}

/** Physical: (atk * powerScale - def/2) with variance; defend halves. */
export function physicalDamage(
  attacker: Combatant,
  target: Combatant,
  powerScale: number,
  rng: number
): [amount: number, next: number] {
  const [v, next] = rollVariance(rng);
  const raw = attacker.atk * attackMultiplier(attacker) * powerScale - defenseValue(target) / 2;
  let dmg = raw * v;
  if (target.defending) dmg /= 2;
  return [Math.max(1, Math.round(dmg)), next];
}

/** Magic: (power + atk/2 - def/4) * element with variance; defend halves. */
export function magicDamage(
  caster: Combatant,
  target: Combatant,
  power: number,
  element: Element,
  rng: number
): [amount: number, next: number] {
  const [v, next] = rollVariance(rng);
  const mult = elementMultiplier(target, element);
  const raw = (power + (caster.atk * attackMultiplier(caster)) / 2 - defenseValue(target) / 4) * mult;
  let dmg = raw * v;
  if (target.defending) dmg /= 2;
  return [mult === 0 ? 0 : Math.max(1, Math.round(dmg)), next];
}
