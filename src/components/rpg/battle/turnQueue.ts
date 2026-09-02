// CTB scheduling: every combatant carries a nextAct counter; the lowest acts.
// Cost after acting depends on speed and haste/slow. Pure functions.

import type { Combatant } from './types';

export const TICK_BASE = 100;
export const PREVIEW_SLOTS = 8;

export function actCost(c: Combatant): number {
  const base = Math.round(TICK_BASE / Math.max(1, c.spd));
  if (c.statuses.some((s) => s.id === 'haste')) return Math.max(1, Math.round(base / 2));
  if (c.statuses.some((s) => s.id === 'slow')) return base * 2;
  return base;
}

function byTurn(a: Combatant, b: Combatant): number {
  return a.nextAct - b.nextAct || b.spd - a.spd || a.key.localeCompare(b.key);
}

export function nextActor(cs: Combatant[]): Combatant | null {
  const alive = cs.filter((c) => c.alive);
  if (alive.length === 0) return null;
  return alive.slice().sort(byTurn)[0];
}

/** Simulates the queue forward without touching state. */
export function previewOrder(cs: Combatant[], n = PREVIEW_SLOTS): string[] {
  const sim = cs.filter((c) => c.alive).map((c) => ({ ...c, statuses: c.statuses.slice() }));
  const out: string[] = [];
  while (out.length < n && sim.length > 0) {
    const next = sim.slice().sort(byTurn)[0];
    out.push(next.key);
    next.nextAct += actCost(next);
  }
  return out;
}
