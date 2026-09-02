// Random-encounter enemies and the terrain pools they spawn from. Pure data.

import type { Element, StatusId } from './materia';

export type AiCondition = 'always' | 'hpBelow30' | 'allyDown' | 'turn3' | 'partyPoisoned';

export type AiAction =
  | { type: 'attack'; name: string; power: number; element: Element; target: 'random' | 'weakest' }
  | { type: 'attackAll'; name: string; power: number; element: Element }
  | { type: 'status'; name: string; status: StatusId; chance: number; turns: number; target: 'random' | 'self' | 'allies' }
  | { type: 'heal'; name: string; amount: number; target: 'self' | 'allies' }
  | { type: 'flee'; name: string }
  | { type: 'wait'; name: string };

export interface AiRule {
  when: AiCondition;
  do: AiAction;
  weight: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  exp: number;
  gil: number;
  weak: Element[];
  resist: Element[];
  absorb: Element[];
  /** chance 0..1 to dodge physical attacks */
  dodge: number;
  /** acts twice each time its turn comes up */
  actsTwice: boolean;
  /** always spawns as a pair */
  pair: boolean;
  spriteId: string;
  ai: AiRule[];
  drop?: { itemId: string; chance: number };
}

const hit = (name: string, power: number, element: Element = 'none', weight = 3): AiRule => ({
  when: 'always',
  do: { type: 'attack', name, power, element, target: 'random' },
  weight,
});

export const enemies: EnemyDef[] = [
  { id: 'flaky-test', name: 'FLAKY TEST', hp: 60, atk: 9, def: 3, spd: 9, exp: 14, gil: 8, weak: [], resist: [], absorb: [], dodge: 0.3, actsTwice: false, pair: false, spriteId: 'flaky', ai: [hit('RANDOM FAILURE', 12), { when: 'always', do: { type: 'wait', name: 'passes this time' }, weight: 1 }] },
  { id: 'null-pointer', name: 'NULL POINTER', hp: 45, atk: 16, def: 2, spd: 7, exp: 18, gil: 10, weak: ['lightning'], resist: [], absorb: [], dodge: 0, actsTwice: false, pair: false, spriteId: 'nullptr', ai: [hit('SEGFAULT', 20)] },
  { id: 'stale-cache', name: 'STALE CACHE', hp: 110, atk: 10, def: 8, spd: 3, exp: 22, gil: 12, weak: ['fire'], resist: ['ice', 'lightning'], absorb: [], dodge: 0, actsTwice: false, pair: false, spriteId: 'cache', ai: [hit('OLD DATA', 12), { when: 'always', do: { type: 'status', name: 'STALE READ', status: 'slow', chance: 0.5, turns: 3, target: 'random' }, weight: 1 }] },
  { id: 'off-by-one', name: 'OFF BY ONE', hp: 55, atk: 11, def: 4, spd: 8, exp: 12, gil: 7, weak: [], resist: [], absorb: [], dodge: 0, actsTwice: false, pair: true, spriteId: 'offbyone', ai: [hit('FENCEPOST', 13)] },
  { id: 'data-lake-monster', name: 'DATA LAKE MONSTER', hp: 180, atk: 14, def: 7, spd: 4, exp: 34, gil: 20, weak: ['fire'], resist: ['ice'], absorb: [], dodge: 0, actsTwice: false, pair: false, spriteId: 'lake', ai: [hit('SWAMP SLAP', 18), { when: 'always', do: { type: 'status', name: 'SILT CLOUD', status: 'slow', chance: 0.7, turns: 3, target: 'random' }, weight: 2 }] },
  { id: 'spaghetti-code', name: 'SPAGHETTI CODE', hp: 90, atk: 12, def: 5, spd: 6, exp: 24, gil: 13, weak: ['fire'], resist: [], absorb: [], dodge: 0, actsTwice: false, pair: false, spriteId: 'spaghetti', ai: [hit('TANGLE', 14), { when: 'always', do: { type: 'status', name: 'GOTO', status: 'poison', chance: 0.8, turns: 4, target: 'random' }, weight: 3 }] },
  { id: 'merge-conflict', name: 'MERGE CONFLICT', hp: 70, atk: 12, def: 5, spd: 7, exp: 16, gil: 11, weak: [], resist: [], absorb: [], dodge: 0, actsTwice: false, pair: true, spriteId: 'merge', ai: [hit('REBASE', 14), { when: 'always', do: { type: 'status', name: 'FORCE PUSH', status: 'atkUp', chance: 1, turns: 3, target: 'allies' }, weight: 1 }] },
  { id: 'dead-link', name: 'DEAD LINK', hp: 80, atk: 11, def: 6, spd: 5, exp: 20, gil: 12, weak: ['earth'], resist: [], absorb: ['lightning'], dodge: 0, actsTwice: false, pair: false, spriteId: 'deadlink', ai: [hit('404', 15)] },
  { id: 'timeout', name: 'TIMEOUT', hp: 65, atk: 10, def: 4, spd: 11, exp: 26, gil: 18, weak: [], resist: [], absorb: [], dodge: 0.1, actsTwice: false, pair: false, spriteId: 'timeout', ai: [{ when: 'turn3', do: { type: 'flee', name: 'GIVES UP WAITING' }, weight: 10 }, { when: 'always', do: { type: 'status', name: 'RETRY STORM', status: 'haste', chance: 1, turns: 3, target: 'self' }, weight: 1 }, hit('LONG POLL', 12)] },
  { id: 'cron-gone-wrong', name: 'CRON GONE WRONG', hp: 95, atk: 12, def: 5, spd: 7, exp: 30, gil: 16, weak: ['earth'], resist: [], absorb: [], dodge: 0, actsTwice: true, pair: false, spriteId: 'cron', ai: [hit('EVERY MINUTE', 11)] },
  { id: 'race-condition', name: 'RACE CONDITION', hp: 75, atk: 13, def: 4, spd: 13, exp: 28, gil: 15, weak: ['ice'], resist: [], absorb: [], dodge: 0.15, actsTwice: false, pair: false, spriteId: 'race', ai: [hit('DOUBLE WRITE', 15)] },
  { id: 'prod-incident', name: 'PROD INCIDENT', hp: 260, atk: 20, def: 9, spd: 9, exp: 120, gil: 90, weak: ['earth'], resist: ['fire', 'ice', 'lightning'], absorb: [], dodge: 0, actsTwice: false, pair: false, spriteId: 'incident', ai: [{ when: 'hpBelow30', do: { type: 'heal', name: 'HOTFIX', amount: 80, target: 'self' }, weight: 4 }, { when: 'always', do: { type: 'attackAll', name: 'PAGE EVERYONE', power: 16, element: 'none' }, weight: 2 }, hit('SEV ONE', 24)], drop: { itemId: 'pager', chance: 1 } },
];

export function enemyById(id: string): EnemyDef | undefined {
  return enemies.find((e) => e.id === id);
}

export type Terrain = 'grass' | 'forest' | 'sand' | 'shore';

export const terrainPools: Record<Terrain, { id: string; weight: number }[]> = {
  grass: [
    { id: 'flaky-test', weight: 4 },
    { id: 'null-pointer', weight: 3 },
    { id: 'stale-cache', weight: 2 },
    { id: 'off-by-one', weight: 2 },
  ],
  shore: [
    { id: 'data-lake-monster', weight: 3 },
    { id: 'flaky-test', weight: 2 },
    { id: 'stale-cache', weight: 1 },
  ],
  forest: [
    { id: 'spaghetti-code', weight: 4 },
    { id: 'merge-conflict', weight: 3 },
    { id: 'dead-link', weight: 2 },
  ],
  sand: [
    { id: 'timeout', weight: 3 },
    { id: 'cron-gone-wrong', weight: 3 },
    { id: 'race-condition', weight: 2 },
  ],
};

export const RARE_ENEMY_ID = 'prod-incident';
export const RARE_CHANCE = 0.04;

/** Encounter chance per settled step, by terrain. */
export const encounterRate: Record<Terrain, number> = {
  grass: 1 / 14,
  forest: 1 / 9,
  sand: 1 / 20,
  shore: 1 / 16,
};
