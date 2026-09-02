// The four arena bosses for the turn-based engine. Pure data.

import type { AiRule, EnemyDef } from './enemies';
import type { StatusId } from './materia';

export interface BossDef extends EnemyDef {
  era: string;
  stars: number;
  intro: string;
  defeatLine: string;
  /** Maps a victory to the real career achievements on the results screen */
  experienceMatch: { company: string; period?: string };
  /** statuses the boss ignores */
  immune: StatusId[];
  /** hydra: number of heads that fight as separate combatants */
  heads?: number;
  /** takes a free counter attack whenever hit by a physical attack */
  countersPhysical?: boolean;
  /** takes double damage from limit breaks */
  limitWeak?: boolean;
  /** rule set swap below an HP fraction */
  phase2?: { hpBelow: number; message: string; ai: AiRule[] };
}

const noEnemyFlags = { dodge: 0, actsTwice: false, pair: false, absorb: [] as never[] };

export const bosses: BossDef[] = [
  {
    ...noEnemyFlags,
    id: 'on-prem-titan',
    name: 'ON-PREM TITAN',
    era: 'Oracle · Cloud Migration',
    stars: 1,
    hp: 520, atk: 16, def: 10, spd: 4, exp: 400, gil: 220,
    weak: ['lightning'], resist: ['earth'],
    spriteId: 'titan',
    intro: 'ON-PREM TITAN blocks the migration path.',
    defeatLine: 'ON-PREM TITAN powers down. The cloud is open.',
    experienceMatch: { company: 'Oracle' },
    immune: ['slow', 'silence'],
    ai: [
      { when: 'always', do: { type: 'attack', name: 'RACK QUAKE', power: 20, element: 'earth', target: 'random' }, weight: 3 },
      { when: 'always', do: { type: 'attack', name: 'LEGACY LOCK-IN', power: 16, element: 'none', target: 'weakest' }, weight: 2 },
    ],
    phase2: {
      hpBelow: 0.5,
      message: 'ON-PREM TITAN spins up every rack at once.',
      ai: [
        { when: 'always', do: { type: 'attackAll', name: 'RACK QUAKE', power: 18, element: 'earth' }, weight: 3 },
        { when: 'always', do: { type: 'attack', name: 'DOWNTIME WINDOW', power: 26, element: 'none', target: 'random' }, weight: 2 },
      ],
    },
  },
  {
    ...noEnemyFlags,
    id: 'sql-hydra',
    name: 'SPAGHETTI SQL HYDRA',
    era: 'New Relic · Analytics Engineering',
    stars: 2,
    hp: 150, atk: 14, def: 6, spd: 8, exp: 700, gil: 380,
    weak: ['fire'], resist: [],
    spriteId: 'hydra',
    intro: 'SPAGHETTI SQL HYDRA rears three untested heads.',
    defeatLine: 'The hydra collapses into tidy, tested models.',
    experienceMatch: { company: 'New Relic' },
    immune: ['slow'],
    heads: 3,
    ai: [
      { when: 'always', do: { type: 'attack', name: 'UNTESTED JOIN', power: 15, element: 'none', target: 'random' }, weight: 3 },
      { when: 'always', do: { type: 'status', name: 'NULL FLOOD', status: 'poison', chance: 0.6, turns: 3, target: 'random' }, weight: 2 },
    ],
  },
  {
    ...noEnemyFlags,
    id: 'legacy-monolith',
    name: 'LEGACY MONOLITH',
    era: 'LegalZoom · Platform Rebuild',
    stars: 3,
    hp: 900, atk: 20, def: 14, spd: 5, exp: 1200, gil: 600,
    weak: ['earth'], resist: ['fire', 'ice'],
    spriteId: 'monolith',
    intro: 'LEGACY MONOLITH looms over the platform.',
    defeatLine: 'LEGACY MONOLITH crumbles. Everything is code now.',
    experienceMatch: { company: 'LegalZoom', period: '2021 - 2023' },
    immune: ['slow', 'silence', 'poison'],
    countersPhysical: true,
    ai: [
      { when: 'always', do: { type: 'attack', name: 'TECH DEBT CRUSH', power: 24, element: 'none', target: 'random' }, weight: 3 },
      { when: 'always', do: { type: 'attack', name: 'BRITTLE CRON', power: 18, element: 'none', target: 'weakest' }, weight: 2 },
    ],
    phase2: {
      hpBelow: 0.4,
      message: 'LEGACY MONOLITH hardens. Nobody documented this part.',
      ai: [
        { when: 'always', do: { type: 'status', name: 'UNDOCUMENTED', status: 'defDown', chance: 0.8, turns: 3, target: 'random' }, weight: 2 },
        { when: 'always', do: { type: 'attackAll', name: 'MIDNIGHT OUTAGE', power: 22, element: 'none' }, weight: 3 },
      ],
    },
  },
  {
    ...noEnemyFlags,
    id: 'rogue-agent',
    name: 'ROGUE AGENT',
    era: 'LegalZoom · AI Gone Wrong',
    stars: 4,
    hp: 1100, atk: 22, def: 12, spd: 11, exp: 2000, gil: 900,
    weak: [], resist: [],
    spriteId: 'agent',
    intro: 'ROGUE AGENT materializes from the context window.',
    defeatLine: 'ROGUE AGENT is aligned. The MCP server hums.',
    experienceMatch: { company: 'LegalZoom', period: '2023 - 2026' },
    immune: ['slow', 'silence', 'poison'],
    limitWeak: true,
    ai: [
      { when: 'always', do: { type: 'status', name: 'PROMPT INJECTION', status: 'silence', chance: 0.7, turns: 3, target: 'random' }, weight: 2 },
      { when: 'always', do: { type: 'status', name: 'TOKEN BURST', status: 'haste', chance: 1, turns: 3, target: 'self' }, weight: 1 },
      { when: 'always', do: { type: 'attack', name: 'HALLUCINATED ANSWER', power: 24, element: 'none', target: 'random' }, weight: 3 },
      { when: 'hpBelow30', do: { type: 'attackAll', name: 'CONTEXT OVERFLOW', power: 26, element: 'none' }, weight: 4 },
    ],
  },
];

export function bossById(id: string): BossDef | undefined {
  return bosses.find((b) => b.id === id);
}
