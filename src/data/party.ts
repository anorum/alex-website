// Party members, growth tables, EXP curve, learnsets. Pure data.

import { materiaById, type Element, type MateriaDef } from './materia';

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface LimitDef {
  id: string;
  name: string;
  line: string;
  hits: number;
  powerPerHit: number;
  element: Element;
  target: 'enemy' | 'enemies';
}

export interface PartyMemberDef {
  id: 'alex' | 'mara';
  name: string;
  /** stats at level 1 */
  base: Stats;
  /** added per level above 1 */
  growth: Stats;
  /** label for the materia command */
  materiaCommand: 'MATERIA' | 'TRICKS';
  attackName: string;
  attackLine: string;
  limit: LimitDef;
  learnset: { level: number; materiaId: string }[];
}

export const party: PartyMemberDef[] = [
  {
    id: 'alex',
    name: 'ALEX',
    base: { hp: 200, mp: 24, atk: 14, def: 8, spd: 6 },
    growth: { hp: 30, mp: 4, atk: 2, def: 1, spd: 0.5 },
    materiaCommand: 'MATERIA',
    attackName: 'ATTACK',
    attackLine: 'ALEX attacks.',
    limit: { id: 'omnislash', name: 'PLATFORM OMNISLASH', line: 'LIMIT BREAK. PLATFORM OMNISLASH.', hits: 5, powerPerHit: 26, element: 'earth', target: 'enemy' },
    learnset: [
      { level: 1, materiaId: 'snowflake-storm' },
      { level: 4, materiaId: 'airflow-gale' },
      { level: 7, materiaId: 'dbt-transform' },
      { level: 10, materiaId: 'terraform-quake' },
      { level: 12, materiaId: 'scan' },
      { level: 16, materiaId: 'haste' },
      { level: 20, materiaId: 'rollback' },
      { level: 25, materiaId: 'runbook-ritual' },
    ],
  },
  {
    id: 'mara',
    name: 'MARA',
    base: { hp: 140, mp: 8, atk: 10, def: 5, spd: 10 },
    growth: { hp: 20, mp: 2, atk: 2, def: 1, spd: 0.75 },
    materiaCommand: 'TRICKS',
    attackName: 'BITE',
    attackLine: 'MARA bites.',
    limit: { id: 'zoomies', name: 'ZOOMIES', line: 'LIMIT BREAK. ZOOMIES.', hits: 1, powerPerHit: 60, element: 'none', target: 'enemies' },
    learnset: [
      { level: 1, materiaId: 'bark' },
      { level: 3, materiaId: 'fetch' },
      { level: 9, materiaId: 'growl' },
      { level: 14, materiaId: 'lick' },
      { level: 18, materiaId: 'dig' },
    ],
  },
];

export const MAX_LEVEL = 99;

export function statsAt(member: PartyMemberDef, level: number): Stats {
  const n = Math.max(0, level - 1);
  const g = member.growth;
  const b = member.base;
  return {
    hp: Math.round(b.hp + g.hp * n),
    mp: Math.round(b.mp + g.mp * n),
    atk: Math.round(b.atk + g.atk * n),
    def: Math.round(b.def + g.def * n),
    spd: Math.round(b.spd + g.spd * n),
  };
}

/** Total EXP required to reach `level` (level 1 needs 0). */
export function expForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += Math.round(40 * Math.pow(l, 1.6));
  return total;
}

export function levelFromExp(exp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && exp >= expForLevel(level + 1)) level++;
  return level;
}

export function learnedMateria(member: PartyMemberDef, level: number): MateriaDef[] {
  return member.learnset
    .filter((l) => l.level <= level)
    .map((l) => materiaById(l.materiaId))
    .filter((m): m is MateriaDef => !!m);
}
