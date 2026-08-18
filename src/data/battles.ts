// Battle data for the RPG mode battle arena. Pure data - no React, no DOM.

export interface BossAttack {
  name: string;
  power: number;
}

export interface Boss {
  id: string;
  name: string;
  era: string;
  stars: number;
  maxHp: number;
  atbMs: number;
  attacks: BossAttack[];
  spriteId: 'titan' | 'hydra' | 'monolith' | 'agent';
  intro: string;
  defeatLine: string;
  // Maps a victory to the real career achievements shown on the QUEST COMPLETE screen
  experienceMatch: { company: string; period?: string };
}

export interface Spell {
  id: string;
  name: string;
  mpCost: number;
  power: number;
  kind: 'damage' | 'buff';
  line: string;
}

export interface BattleItem {
  id: string;
  name: string;
  uses: number;
  effect: 'restore-mp' | 'restore-hp';
  amount: number;
  line: string;
}

export const bosses: Boss[] = [
  {
    id: 'on-prem-titan',
    name: 'ON-PREM TITAN',
    era: 'Oracle · Cloud Migration',
    stars: 1,
    maxHp: 300,
    atbMs: 4600,
    attacks: [
      { name: 'RACK QUAKE', power: 70 },
      { name: 'LEGACY LOCK-IN', power: 55 },
      { name: 'DOWNTIME WINDOW', power: 90 },
    ],
    spriteId: 'titan',
    intro: 'ON-PREM TITAN blocks the migration path!',
    defeatLine: 'ON-PREM TITAN powers down. The cloud awaits.',
    experienceMatch: { company: 'Oracle' },
  },
  {
    id: 'sql-hydra',
    name: 'SPAGHETTI SQL HYDRA',
    era: 'New Relic · Analytics Engineering',
    stars: 2,
    maxHp: 480,
    atbMs: 4100,
    attacks: [
      { name: 'UNTESTED JOIN', power: 100 },
      { name: 'NULL FLOOD', power: 130 },
      { name: 'STALE DASHBOARD', power: 85 },
    ],
    spriteId: 'hydra',
    intro: 'SPAGHETTI SQL HYDRA rears its untested heads!',
    defeatLine: 'The hydra collapses into tidy, tested models.',
    experienceMatch: { company: 'New Relic' },
  },
  {
    id: 'legacy-monolith',
    name: 'LEGACY MONOLITH',
    era: 'LegalZoom · Platform Rebuild',
    stars: 3,
    maxHp: 650,
    atbMs: 3900,
    attacks: [
      { name: 'TECH DEBT CRUSH', power: 160 },
      { name: 'MIDNIGHT OUTAGE', power: 200 },
      { name: 'BRITTLE CRON', power: 120 },
    ],
    spriteId: 'monolith',
    intro: 'LEGACY MONOLITH looms over the platform!',
    defeatLine: 'LEGACY MONOLITH crumbles. GitOps reigns.',
    experienceMatch: { company: 'LegalZoom', period: '2021 - 2023' },
  },
  {
    id: 'rogue-agent',
    name: 'ROGUE AGENT',
    era: 'LegalZoom · AI Gone Wrong',
    stars: 4,
    maxHp: 850,
    atbMs: 3300,
    attacks: [
      { name: 'HALLUCINATED ANSWER', power: 210 },
      { name: 'PROMPT INJECTION', power: 250 },
      { name: 'TOKEN OVERFLOW', power: 290 },
    ],
    spriteId: 'agent',
    intro: 'ROGUE AGENT materializes from the context window!',
    defeatLine: 'ROGUE AGENT is aligned. The MCP server hums.',
    experienceMatch: { company: 'LegalZoom', period: '2023 - 2026' },
  },
];

export const spells: Spell[] = [
  { id: 'snowflake-storm', name: 'SNOWFLAKE STORM', mpCost: 24, power: 120, kind: 'damage', line: 'ALEX casts SNOWFLAKE STORM!' },
  { id: 'airflow-gale', name: 'AIRFLOW GALE', mpCost: 16, power: 90, kind: 'damage', line: 'ALEX summons AIRFLOW GALE!' },
  { id: 'terraform-quake', name: 'TERRAFORM QUAKE', mpCost: 34, power: 160, kind: 'damage', line: 'ALEX casts TERRAFORM QUAKE!' },
  { id: 'dbt-transform', name: 'DBT TRANSFORM', mpCost: 20, power: 0, kind: 'buff', line: 'ALEX refactors with DBT! Tests pass! POWER UP!' },
];

export const items: BattleItem[] = [
  { id: 'coffee', name: 'COFFEE', uses: 3, effect: 'restore-mp', amount: 40, line: 'ALEX drinks COFFEE. MP restored!' },
  { id: 'runbook', name: 'RUNBOOK', uses: 3, effect: 'restore-hp', amount: 600, line: 'ALEX consults the RUNBOOK. HP restored!' },
];

export const playerBase = {
  name: 'ALEX',
  maxHp: 1800,
  maxMp: 120,
  attackPower: 68,
  attackLine: 'ALEX attacks!',
  buffMultiplier: 1.5,
  // Limit gauge fills after this much damage taken
  limitFillDamage: 600,
  limit: {
    name: 'PLATFORM OMNISLASH',
    hits: 5,
    powerPerHit: 90,
    line: 'LIMIT BREAK! PLATFORM OMNISLASH!',
  },
};

// Timing constants (ms of battle clock)
export const timing = {
  playerAtbMs: 3000,
  introMs: 1600,
  messageLeadMs: 700,   // message shows before impact
  impactGapMs: 550,     // between multi-hits / after impact before settle
  settleMs: 600,        // pause after last impact before control returns
  floaterMs: 900,       // floating damage number lifetime
  shakeMs: 360,
  flashMs: 220,
  victoryDelayMs: 900,  // pause before victory/defeat panel
};

export const damageVariance = 0.1; // ±10%
