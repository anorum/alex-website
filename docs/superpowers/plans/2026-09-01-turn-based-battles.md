# Turn-Based Battles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active-time battle window with an in-world, FFX-style turn-based combat system with a two-character party, twelve random-encounter enemies, four rebuilt bosses, persistent progression, and an easily toggled random-encounter system.

**Architecture:** Battle becomes a fourth mode of the scene island (`walk | dialog | window | battle`); the overworld reducer owns the outer state machine and delegates combat to a new pure, seeded battle reducer. A versioned save object in localStorage carries level, EXP, gil, inventory, and flags, and is held inside reducer state so every reducer stays pure. The `#rpg-battle` section, backdrop, back bar, and `switchRPGSection` are deleted.

**Tech Stack:** Astro 5 static site, React 18 islands (`client:visible`), TypeScript, Vitest for unit tests (new), Playwright for the existing end-to-end suite, WebAudio synth SFX, string-grid SVG pixel art.

**Spec:** `docs/superpowers/specs/2026-09-01-turn-based-battles-design.md`

## Global Constraints

- No em dashes anywhere in copy or code comments; use a plain hyphen.
- Game copy is dry and plain. It never brags about Alex's real skills. No exclamation-point-heavy hype outside battle callouts like "WEAK!".
- No skill levels or mastery percentages for real-world skills. Game levels are game levels.
- Standard-theme visitors must keep downloading zero RPG JavaScript (everything new lives inside the `client:visible` overworld island or modules it imports).
- Reducers are pure and deterministic: no `Date.now()`, no `Math.random()`, no DOM. Randomness comes from the mulberry32 `rng` field carried in state.
- All animation timing is driven by the reducer clock so `?rpg-speed=N` and reduced motion keep working.
- Every task ends with `npm run build` passing. Tasks that touch the RPG end with `npm run e2e` passing.
- Commit after each task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File map

Create:
- `src/data/party.ts` - party member definitions, growth tables, EXP curve, learnsets
- `src/data/materia.ts` - every spell and trick
- `src/data/items.ts` - battle items with shop prices
- `src/data/enemies.ts` - random-encounter enemies, terrain pools
- `src/data/bosses.ts` - the four bosses (replaces `src/data/battles.ts`)
- `src/utils/rpg-save.ts` - save load/write/migrate
- `src/components/rpg/battle/types.ts` - rewritten battle state types
- `src/components/rpg/battle/turnQueue.ts` - CTB scheduling
- `src/components/rpg/battle/damage.ts` - damage and element math
- `src/components/rpg/battle/ai.ts` - enemy rule selection
- `src/components/rpg/battle/battleReducer.ts` - rewritten
- `src/components/rpg/battle/BattleView.tsx` - renders inside `.ow-frame`
- `src/components/rpg/battle/battle.css` - `.rpgb-*` styles, imported by BattleView
- `src/components/rpg/battle/EnemySprites.tsx` - enemy pixel sprites (extends existing Sprites.tsx grids)
- `src/components/rpg/overworld/encounters.ts` - terrain lookup and encounter rolls
- `tests/unit/*.test.ts` - Vitest unit tests
- `vitest.config.ts`

Modify:
- `src/components/rpg/overworld/overworldReducer.ts` - battle mode, save in state, encounter rolls, toggles
- `src/components/rpg/overworld/useOverworld.ts` - key routing in battle mode, `rpg:command`, save persistence
- `src/components/rpg/overworld/OverworldIsland.tsx` - render BattleView, swirl, results
- `src/components/rpg/overworld/overworld.css` - swirl mask, help line
- `src/components/rpg/RPGContainer.astro` - drop battle section, backdrop, back bar, switchRPGSection
- `src/components/rpg/NavigationRPG.astro` - BATTLE goes to the arena, ENCOUNTERS toggle entry
- `src/components/rpg/windows/StatusSheet.tsx` - reads the save
- `src/components/rpg/windows/ShopWindow.tsx` - BUY tab
- `src/data/character.ts` - flavor only (equipment, limit break text)
- `src/data/dialogs.ts` - Mara keep-watch, shopkeeper BUY, gatekeeper boss select, first-entry intro
- `src/layouts/BaseLayout.astro` - stop importing `ff7-battle.css`
- `package.json` - vitest, `test` script; CI runs it
- `tests/e2e.mjs` - new battle flows

Delete (Task 12):
- `src/components/rpg/battle/BattleIsland.tsx`, `BattleScreen.tsx`, `CommandMenu.tsx`, `EncounterSelect.tsx`, `ResultPanels.tsx`, `StatusPanel.tsx`, `useBattle.ts`
- `src/data/battles.ts`
- `src/styles/ff7-battle.css`

---

### Task 1: Vitest and the save module

**Files:**
- Create: `vitest.config.ts`, `src/utils/rpg-save.ts`, `tests/unit/save.test.ts`
- Modify: `package.json`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `SaveData`, `defaultSave()`, `loadSave()`, `writeSave(save)`, `SAVE_KEY`.

- [ ] **Step 1: Install vitest and add scripts**

```bash
npm install -D vitest@^3 jsdom@^26
```

Add to `package.json` scripts: `"test": "vitest run"`. In `.github/workflows/deploy.yml`, add a step `- name: Unit tests` / `run: npm test` right after the Typecheck step.

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Write the failing save tests**

`tests/unit/save.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSave, loadSave, writeSave, SAVE_KEY } from '../../src/utils/rpg-save';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('rpg-save', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  });

  it('returns the default save when nothing is stored', () => {
    const s = loadSave();
    expect(s.v).toBe(1);
    expect(s.level).toBe(5);
    expect(s.encounters).toBe(true);
    expect(s.gil).toBe(0);
  });

  it('round-trips through localStorage', () => {
    const s = { ...defaultSave(), gil: 123, level: 7 };
    writeSave(s);
    expect(loadSave().gil).toBe(123);
    expect(loadSave().level).toBe(7);
  });

  it('migrates the old win list and sound flag, then removes them', () => {
    localStorage.setItem('rpg-battles-won', JSON.stringify(['on-prem-titan']));
    localStorage.setItem('rpg-sound', 'on');
    const s = loadSave();
    expect(s.bossesBeaten).toEqual(['on-prem-titan']);
    expect(s.sound).toBe(true);
    expect(localStorage.getItem('rpg-battles-won')).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('falls back to defaults on corrupt data', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    expect(loadSave().level).toBe(5);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, cannot resolve `../../src/utils/rpg-save`.

- [ ] **Step 4: Implement the save module**

`src/utils/rpg-save.ts`:

```ts
// The single persisted RPG save. Read once into reducer state; written by
// the hook whenever state.save changes. Pure apart from the storage calls.

export const SAVE_KEY = 'rpg-save';
const LEGACY_WINS_KEY = 'rpg-battles-won';
const LEGACY_SOUND_KEY = 'rpg-sound';

export interface SaveData {
  v: 1;
  level: number;
  exp: number;
  gil: number;
  inventory: Record<string, number>;
  bossesBeaten: string[];
  encounters: boolean;
  sound: boolean;
  seenIntro: boolean;
}

export function defaultSave(): SaveData {
  return {
    v: 1,
    level: 5,
    exp: 0,
    gil: 0,
    inventory: { coffee: 2, runbook: 1 },
    bossesBeaten: [],
    encounters: true,
    sound: false,
    seenIntro: false,
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  const st = storage();
  if (!st) return defaultSave();
  const base = defaultSave();
  try {
    const raw = st.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return { ...base, ...parsed, inventory: { ...base.inventory, ...(parsed.inventory ?? {}) }, v: 1 };
    }
  } catch {
    // corrupt: fall through to a fresh save
  }
  // first load: migrate the two legacy flags, if present
  try {
    const wins = st.getItem(LEGACY_WINS_KEY);
    if (wins) base.bossesBeaten = JSON.parse(wins);
    base.sound = st.getItem(LEGACY_SOUND_KEY) === 'on';
    st.removeItem(LEGACY_WINS_KEY);
    st.removeItem(LEGACY_SOUND_KEY);
  } catch {
    // ignore legacy corruption
  }
  writeSave(base);
  return base;
}

export function writeSave(save: SaveData): void {
  const st = storage();
  if (!st) return;
  try {
    st.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // private mode etc.
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json .github/workflows/deploy.yml src/utils/rpg-save.ts tests/unit/save.test.ts
git commit -m "Add vitest and the versioned RPG save module

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Party, materia, and items data

**Files:**
- Create: `src/data/party.ts`, `src/data/materia.ts`, `src/data/items.ts`, `tests/unit/party.test.ts`

**Interfaces:**
- Produces: `Element`, `StatusId`, `TargetKind`, `MateriaDef`, `materia`, `materiaById(id)`, `ItemDef`, `items`, `itemById(id)`, `PartyMemberDef`, `party`, `Stats`, `statsAt(member, level)`, `expForLevel(level)`, `levelFromExp(exp)`, `learnedMateria(member, level)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/party.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { party, statsAt, expForLevel, levelFromExp, learnedMateria } from '../../src/data/party';
import { materia, materiaById } from '../../src/data/materia';
import { items, itemById } from '../../src/data/items';

describe('party', () => {
  it('has alex and mara', () => {
    expect(party.map((p) => p.id)).toEqual(['alex', 'mara']);
  });

  it('stats grow with level and mara is faster', () => {
    const [alex, mara] = party;
    expect(statsAt(alex, 5)).toEqual({ hp: 320, mp: 40, atk: 22, def: 12, spd: 8 });
    expect(statsAt(alex, 6).hp).toBeGreaterThan(320);
    expect(statsAt(mara, 5).spd).toBeGreaterThan(statsAt(alex, 5).spd);
  });

  it('exp curve is monotonic and levelFromExp inverts it', () => {
    expect(expForLevel(1)).toBe(0);
    expect(expForLevel(6)).toBeGreaterThan(expForLevel(5));
    expect(levelFromExp(expForLevel(9))).toBe(9);
    expect(levelFromExp(expForLevel(9) - 1)).toBe(8);
    expect(levelFromExp(1e9)).toBe(99);
  });

  it('learnsets unlock by level', () => {
    const [alex, mara] = party;
    expect(learnedMateria(alex, 5).map((m) => m.id)).toEqual(['snowflake-storm', 'airflow-gale']);
    expect(learnedMateria(alex, 10).map((m) => m.id)).toContain('terraform-quake');
    expect(learnedMateria(mara, 1).map((m) => m.id)).toEqual(['bark']);
  });
});

describe('materia and items', () => {
  it('every learnset entry resolves', () => {
    for (const m of party) for (const l of m.learnset) expect(materiaById(l.materiaId)).toBeTruthy();
  });
  it('items have prices', () => {
    expect(items.length).toBe(4);
    expect(itemById('pager')?.price).toBe(200);
  });
  it('materia have owners and lines', () => {
    for (const m of materia) {
      expect(['alex', 'mara']).toContain(m.owner);
      expect(m.line).toMatch(/[A-Z]/);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the data modules**

`src/data/materia.ts`:

```ts
// Every spell and trick. Pure data - no React, no DOM.

export type Element = 'fire' | 'ice' | 'lightning' | 'earth' | 'none';
export type StatusId = 'poison' | 'slow' | 'haste' | 'silence' | 'atkDown' | 'defDown' | 'atkUp';
export type TargetKind = 'enemy' | 'enemies' | 'ally' | 'self' | 'party';

export interface MateriaDef {
  id: string;
  name: string;
  owner: 'alex' | 'mara';
  kind: 'damage' | 'heal' | 'status' | 'cure' | 'scan' | 'fetch';
  element: Element;
  /** damage base or heal amount; 0 for utility */
  power: number;
  mpCost: number;
  target: TargetKind;
  /** status applied on hit, with chance 0..1 */
  status?: { id: StatusId; chance: number; turns: number };
  line: string;
}

export const materia: MateriaDef[] = [
  { id: 'snowflake-storm', name: 'SNOWFLAKE STORM', owner: 'alex', kind: 'damage', element: 'ice', power: 34, mpCost: 6, target: 'enemy', line: 'ALEX casts SNOWFLAKE STORM.' },
  { id: 'airflow-gale', name: 'AIRFLOW GALE', owner: 'alex', kind: 'damage', element: 'lightning', power: 30, mpCost: 5, target: 'enemy', line: 'ALEX summons AIRFLOW GALE.' },
  { id: 'dbt-transform', name: 'DBT TRANSFORM', owner: 'alex', kind: 'status', element: 'none', power: 0, mpCost: 5, target: 'self', status: { id: 'atkUp', chance: 1, turns: 4 }, line: 'ALEX refactors with DBT. Tests pass.' },
  { id: 'terraform-quake', name: 'TERRAFORM QUAKE', owner: 'alex', kind: 'damage', element: 'earth', power: 40, mpCost: 10, target: 'enemies', line: 'ALEX casts TERRAFORM QUAKE.' },
  { id: 'scan', name: 'SCAN', owner: 'alex', kind: 'scan', element: 'none', power: 0, mpCost: 1, target: 'enemy', line: 'ALEX runs SCAN.' },
  { id: 'haste', name: 'HASTE', owner: 'alex', kind: 'status', element: 'none', power: 0, mpCost: 8, target: 'ally', status: { id: 'haste', chance: 1, turns: 4 }, line: 'ALEX casts HASTE.' },
  { id: 'rollback', name: 'ROLLBACK', owner: 'alex', kind: 'heal', element: 'none', power: 120, mpCost: 7, target: 'ally', line: 'ALEX runs ROLLBACK.' },
  { id: 'runbook-ritual', name: 'RUNBOOK RITUAL', owner: 'alex', kind: 'cure', element: 'none', power: 0, mpCost: 6, target: 'party', line: 'ALEX follows the RUNBOOK. Statuses cleared.' },
  { id: 'bark', name: 'BARK', owner: 'mara', kind: 'status', element: 'none', power: 0, mpCost: 2, target: 'enemy', status: { id: 'atkDown', chance: 1, turns: 3 }, line: 'MARA barks. The enemy hesitates.' },
  { id: 'fetch', name: 'FETCH', owner: 'mara', kind: 'fetch', element: 'none', power: 0, mpCost: 3, target: 'self', line: 'MARA runs off and comes back with something.' },
  { id: 'growl', name: 'GROWL', owner: 'mara', kind: 'status', element: 'none', power: 0, mpCost: 2, target: 'enemy', status: { id: 'defDown', chance: 1, turns: 3 }, line: 'MARA growls.' },
  { id: 'lick', name: 'LICK', owner: 'mara', kind: 'heal', element: 'none', power: 70, mpCost: 3, target: 'ally', line: 'MARA licks a wound. It helps, somehow.' },
  { id: 'dig', name: 'DIG', owner: 'mara', kind: 'damage', element: 'earth', power: 36, mpCost: 4, target: 'enemy', line: 'MARA digs furiously.' },
];

export function materiaById(id: string): MateriaDef | undefined {
  return materia.find((m) => m.id === id);
}
```

`src/data/items.ts`:

```ts
// Battle items and their shop prices. Pure data.

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  effect: 'hp' | 'mp' | 'cure' | 'escape';
  amount: number;
  line: string;
  description: string;
}

export const items: ItemDef[] = [
  { id: 'coffee', name: 'COFFEE', price: 60, effect: 'mp', amount: 30, line: 'drinks COFFEE. MP restored.', description: 'Restores 30 MP.' },
  { id: 'runbook', name: 'RUNBOOK', price: 120, effect: 'hp', amount: 200, line: 'consults the RUNBOOK. HP restored.', description: 'Restores 200 HP.' },
  { id: 'patch', name: 'PATCH', price: 90, effect: 'cure', amount: 0, line: 'applies a PATCH. Statuses cleared.', description: 'Cures every status.' },
  { id: 'pager', name: 'PAGER', price: 200, effect: 'escape', amount: 0, line: 'gets paged. Time to leave.', description: 'Escape any random battle.' },
];

export function itemById(id: string): ItemDef | undefined {
  return items.find((i) => i.id === id);
}
```

`src/data/party.ts`:

```ts
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
```

Note: with these tables, `statsAt(alex, 5)` is `{ hp: 320, mp: 40, atk: 22, def: 12, spd: 8 }`, matching the spec's starting point.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/data/party.ts src/data/materia.ts src/data/items.ts tests/unit/party.test.ts
git commit -m "Add party, materia, and item data for the turn-based battle system

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Enemies and bosses data

**Files:**
- Create: `src/data/enemies.ts`, `src/data/bosses.ts`, `tests/unit/enemies.test.ts`

**Interfaces:**
- Produces: `AiRule`, `AiAction`, `EnemyDef`, `enemies`, `enemyById(id)`, `Terrain`, `terrainPools`, `RARE_ENEMY_ID`, `BossDef`, `bosses`, `bossById(id)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/enemies.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { enemies, enemyById, terrainPools, RARE_ENEMY_ID } from '../../src/data/enemies';
import { bosses, bossById } from '../../src/data/bosses';

describe('enemies', () => {
  it('has twelve enemies with unique ids and sprites', () => {
    expect(enemies.length).toBe(12);
    expect(new Set(enemies.map((e) => e.id)).size).toBe(12);
    for (const e of enemies) expect(e.spriteId).toBeTruthy();
  });
  it('every pool entry resolves and the rare enemy is not in a pool', () => {
    for (const pool of Object.values(terrainPools)) {
      for (const entry of pool) {
        expect(enemyById(entry.id)).toBeTruthy();
        expect(entry.id).not.toBe(RARE_ENEMY_ID);
      }
    }
    expect(enemyById(RARE_ENEMY_ID)?.name).toBe('PROD INCIDENT');
  });
  it('every enemy has at least one always rule', () => {
    for (const e of enemies) expect(e.ai.some((r) => r.when === 'always')).toBe(true);
  });
});

describe('bosses', () => {
  it('has the four bosses in difficulty order', () => {
    expect(bosses.map((b) => b.stars)).toEqual([1, 2, 3, 4]);
    expect(bossById('sql-hydra')?.heads).toBe(3);
    expect(bossById('legacy-monolith')?.countersPhysical).toBe(true);
    expect(bossById('rogue-agent')?.limitWeak).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write enemies.ts**

```ts
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
```

- [ ] **Step 4: Write bosses.ts**

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add src/data/enemies.ts src/data/bosses.ts tests/unit/enemies.test.ts
git commit -m "Add enemy roster, terrain pools, and rebuilt boss definitions

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Battle types, turn queue, and damage math

**Files:**
- Create: `src/components/rpg/battle/types.ts` (overwrite), `src/components/rpg/battle/turnQueue.ts`, `src/components/rpg/battle/damage.ts`, `tests/unit/turnQueue.test.ts`, `tests/unit/damage.test.ts`

**Interfaces:**
- Produces: `Combatant`, `StatusInst`, `BattlePhase`, `BattleState`, `BattleAction`, `TimedEvent`, `SfxKind`, `Floater`, `Callout`, `BattleResult`, `TICK_BASE`, `actCost(c)`, `nextActor(cs)`, `previewOrder(cs, n)`, `elementMultiplier(c, element)`, `rollVariance(rng)`, `physicalDamage(...)`, `magicDamage(...)`, `nextRng(state)`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/turnQueue.test.ts`:

```ts
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
    expect(nextActor(cs)!.key).toBe('mara'); // fastest among ties
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
```

`tests/unit/damage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write types.ts (replace the whole file)**

```ts
// Battle state for the turn-based engine. Pure data types - no React.

import type { Element, StatusId } from '../../../data/materia';

export interface StatusInst {
  id: StatusId;
  /** remaining turns of the affected combatant */
  turns: number;
}

export interface Combatant {
  /** unique within the battle: 'alex', 'mara', 'e1', 'e2', 'e3' */
  key: string;
  side: 'party' | 'enemy';
  name: string;
  /** party member id or enemy/boss def id */
  defId: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  statuses: StatusInst[];
  /** 0..1 limit gauge (party only) */
  limit: number;
  defending: boolean;
  /** CTB counter: lowest acts next */
  nextAct: number;
  alive: boolean;
  dodge: number;
  weak: Element[];
  resist: Element[];
  absorb: Element[];
  immune: StatusId[];
  actsTwice: boolean;
  turnsTaken: number;
}

export type BattlePhase =
  | 'intro'
  | 'select'
  | 'target'
  | 'resolving'
  | 'victory'
  | 'defeat'
  | 'fled'
  | 'done';

export type SfxKind =
  | 'cursor' | 'confirm' | 'cancel' | 'buzzer' | 'hit' | 'hurt' | 'heal'
  | 'limit' | 'victory' | 'defeat' | 'weak' | 'miss' | 'levelup' | 'encounter';

export type FloaterKind = 'damage' | 'heal' | 'mp' | 'buff' | 'miss' | 'status';

export interface Floater {
  id: number;
  targetKey: string;
  text: string;
  kind: FloaterKind;
  bornAt: number;
}

export type CalloutKind = 'WEAK!' | 'RESIST' | 'ABSORB' | 'MISS' | 'COUNTER' | 'CRITICAL';

export interface Callout {
  id: number;
  targetKey: string;
  text: CalloutKind;
  bornAt: number;
}

export type TimedEvent =
  | { at: number; type: 'message'; text: string }
  | { at: number; type: 'sfx'; sfx: SfxKind }
  | { at: number; type: 'damage'; targetKey: string; amount: number; callout?: CalloutKind; sfx: SfxKind }
  | { at: number; type: 'miss'; targetKey: string }
  | { at: number; type: 'heal'; targetKey: string; stat: 'hp' | 'mp'; amount: number }
  | { at: number; type: 'status'; targetKey: string; status: StatusInst | null; text: string }
  | { at: number; type: 'cure'; targetKey: string }
  | { at: number; type: 'scan'; targetKey: string }
  | { at: number; type: 'fetch'; itemId: string }
  | { at: number; type: 'flee'; key: string }
  | { at: number; type: 'regrow'; key: string }
  | { at: number; type: 'phase2' }
  | { at: number; type: 'end' }
  | { at: number; type: 'finish'; outcome: 'victory' | 'defeat' | 'fled' };

export type MenuId = 'root' | 'materia' | 'item';

export interface BattleMenu {
  open: MenuId;
  cursor: number;
  /** command chosen, waiting for a target */
  pending: { kind: 'attack' } | { kind: 'materia'; id: string } | { kind: 'item'; id: string } | { kind: 'limit' } | null;
  targetCursor: number;
}

export interface BattleResult {
  outcome: 'victory' | 'defeat' | 'fled';
  exp: number;
  gil: number;
  drops: string[];
  levelsGained: number;
  newLevel: number;
  bossId?: string;
}

export interface BattleState {
  kind: 'random' | 'boss';
  bossId?: string;
  phase: BattlePhase;
  clock: number;
  rng: number;
  combatants: Combatant[];
  /** key of the combatant whose turn it is */
  active: string | null;
  /** next actors, computed on each turn start */
  order: string[];
  menu: BattleMenu;
  queue: TimedEvent[];
  message: string;
  floaters: Floater[];
  callouts: Callout[];
  seq: number;
  shakeUntil: number;
  flashUntil: Record<string, number>;
  /** keys revealed by SCAN */
  scanned: string[];
  /** inventory in play; written back to the save on finish */
  inventory: Record<string, number>;
  /** level at battle start, for the results screen */
  level: number;
  exp: number;
  gil: number;
  phase2Done: boolean;
  lastSfx: { seq: number; kind: SfxKind } | null;
  result: BattleResult | null;
}

export type BattleAction =
  | { type: 'TICK'; dt: number }
  | { type: 'MENU_MOVE'; delta: number }
  | { type: 'MENU_SET_CURSOR'; index: number }
  | { type: 'MENU_CONFIRM' }
  | { type: 'MENU_CANCEL' }
  | { type: 'TARGET_MOVE'; delta: number }
  | { type: 'TARGET_SET'; index: number }
  | { type: 'TARGET_CONFIRM' }
  | { type: 'RESULT_CONTINUE' };
```

- [ ] **Step 4: Write turnQueue.ts**

```ts
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
```

- [ ] **Step 5: Write damage.ts**

```ts
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

/** Physical: (atk * power/10 - def/2) with variance; defend halves. */
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
  const raw = (power + caster.atk * attackMultiplier(caster) / 2 - defenseValue(target) / 4) * mult;
  let dmg = raw * v;
  if (target.defending) dmg /= 2;
  return [mult === 0 ? 0 : Math.max(1, Math.round(dmg)), next];
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: all passing. (The old `battleReducer.ts` still imports from `types.ts` and `battles.ts` and will fail typecheck until Task 5 replaces it; do not run `npm run typecheck` yet.)

- [ ] **Step 7: Commit**

```bash
git add src/components/rpg/battle/types.ts src/components/rpg/battle/turnQueue.ts src/components/rpg/battle/damage.ts tests/unit/turnQueue.test.ts tests/unit/damage.test.ts
git commit -m "Add turn queue, damage math, and battle state types for the turn-based engine

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Enemy AI and the battle reducer

**Files:**
- Create: `src/components/rpg/battle/ai.ts`, `tests/unit/battleReducer.test.ts`
- Modify (rewrite): `src/components/rpg/battle/battleReducer.ts`

**Interfaces:**
- Consumes: everything from Tasks 2 to 4.
- Produces: `chooseEnemyAction(enemy, state)` returning `[AiAction, nextRng]`; `BattleSetup`, `createBattleState(setup)`, `battleReducer(state, action)`, `rootCommandsFor(c)`, `menuLengthFor(state)`, `availableMateria(state, c)`, `livingEnemies(state)`, `partyMembers(state)`.

- [ ] **Step 1: Write the failing reducer tests**

`tests/unit/battleReducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createBattleState, battleReducer, livingEnemies, rootCommandsFor } from '../../src/components/rpg/battle/battleReducer';
import { chooseEnemyAction } from '../../src/components/rpg/battle/ai';
import { enemyById } from '../../src/data/enemies';
import { bossById } from '../../src/data/bosses';
import type { BattleState } from '../../src/components/rpg/battle/types';

function tick(s: BattleState, ms: number): BattleState {
  for (let t = 0; t < ms; t += 25) s = battleReducer(s, { type: 'TICK', dt: 25 });
  return s;
}

function randomFight(seed = 7) {
  return createBattleState({
    kind: 'random',
    enemies: [enemyById('flaky-test')!],
    level: 5,
    exp: 0,
    gil: 0,
    inventory: { coffee: 1 },
    seed,
  });
}

/** Advance until a party member is choosing a command. */
function untilSelect(s: BattleState): BattleState {
  for (let i = 0; i < 400 && s.phase !== 'select' && s.phase !== 'victory' && s.phase !== 'defeat'; i++) {
    s = battleReducer(s, { type: 'TICK', dt: 25 });
  }
  return s;
}

describe('battle reducer', () => {
  it('starts in intro then hands the first turn to the fastest combatant', () => {
    let s = randomFight();
    expect(s.phase).toBe('intro');
    s = untilSelect(s);
    expect(s.phase).toBe('select');
    expect(s.active).toBe('mara'); // mara spd 13 beats flaky test 9 and alex 8
    expect(s.order.length).toBe(8);
  });

  it('attack goes through target selection and damages the enemy', () => {
    let s = untilSelect(randomFight());
    const before = livingEnemies(s)[0].hp;
    s = battleReducer(s, { type: 'MENU_CONFIRM' }); // BITE -> target phase
    expect(s.phase).toBe('target');
    s = battleReducer(s, { type: 'TARGET_CONFIRM' });
    expect(s.phase).toBe('resolving');
    s = tick(s, 2000);
    const after = s.combatants.find((c) => c.key === 'e1')!.hp;
    expect(after).toBeLessThanOrEqual(before); // flaky test may dodge, never gains hp
  });

  it('RUN ends a random battle as fled', () => {
    let s = untilSelect(randomFight());
    const cmds = rootCommandsFor(s.combatants.find((c) => c.key === s.active)!, s);
    const runIndex = cmds.indexOf('RUN');
    expect(runIndex).toBeGreaterThan(-1);
    s = battleReducer(s, { type: 'MENU_SET_CURSOR', index: runIndex });
    s = battleReducer(s, { type: 'MENU_CONFIRM' });
    s = tick(s, 3000);
    expect(s.phase).toBe('fled');
    expect(s.result?.outcome).toBe('fled');
  });

  it('boss battles have no RUN and pay exp on victory', () => {
    let s = createBattleState({ kind: 'boss', enemies: [bossById('on-prem-titan')!], level: 30, exp: 0, gil: 0, inventory: {}, seed: 3, bossId: 'on-prem-titan' });
    s = untilSelect(s);
    const cmds = rootCommandsFor(s.combatants.find((c) => c.key === s.active)!, s);
    expect(cmds).not.toContain('RUN');
    // brute force: attack until the boss dies (level 30 party wins comfortably)
    for (let i = 0; i < 60 && s.phase !== 'victory'; i++) {
      s = untilSelect(s);
      if (s.phase !== 'select') break;
      s = battleReducer(s, { type: 'MENU_SET_CURSOR', index: 0 });
      s = battleReducer(s, { type: 'MENU_CONFIRM' });
      if (s.phase === 'target') s = battleReducer(s, { type: 'TARGET_CONFIRM' });
      s = tick(s, 4000);
    }
    expect(s.phase).toBe('victory');
    expect(s.result?.exp).toBe(400);
    expect(s.result?.bossId).toBe('on-prem-titan');
  });

  it('is deterministic for a seed', () => {
    const a = tick(untilSelect(randomFight(11)), 500);
    const b = tick(untilSelect(randomFight(11)), 500);
    expect(a).toEqual(b);
  });

  it('hydra spawns three heads', () => {
    const s = createBattleState({ kind: 'boss', enemies: [bossById('sql-hydra')!], level: 10, exp: 0, gil: 0, inventory: {}, seed: 1, bossId: 'sql-hydra' });
    expect(s.combatants.filter((c) => c.side === 'enemy').length).toBe(3);
  });
});

describe('enemy ai', () => {
  it('prefers hpBelow30 rules when hurt', () => {
    const s = createBattleState({ kind: 'random', enemies: [enemyById('prod-incident')!], level: 20, exp: 0, gil: 0, inventory: {}, seed: 5 });
    const enemy = s.combatants.find((c) => c.key === 'e1')!;
    enemy.hp = 10;
    const [action] = chooseEnemyAction(enemy, s);
    expect(action.type).toBe('heal');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL on the reducer file (old exports).

- [ ] **Step 3: Write ai.ts**

```ts
// Enemy decision making: the first matching rule group wins, one action is
// drawn by weight with the seeded rng. Pure.

import { enemyById, type AiAction, type AiCondition, type AiRule } from '../../../data/enemies';
import { bossById } from '../../../data/bosses';
import { nextRng } from './damage';
import type { BattleState, Combatant } from './types';

const CONDITION_PRIORITY: AiCondition[] = ['hpBelow30', 'allyDown', 'turn3', 'partyPoisoned', 'always'];

function rulesFor(enemy: Combatant, state: BattleState): AiRule[] {
  const boss = bossById(enemy.defId);
  if (boss) {
    if (boss.phase2 && state.phase2Done) return boss.phase2.ai;
    return boss.ai;
  }
  return enemyById(enemy.defId)?.ai ?? [];
}

function holds(cond: AiCondition, enemy: Combatant, state: BattleState): boolean {
  switch (cond) {
    case 'always':
      return true;
    case 'hpBelow30':
      return enemy.hp < enemy.maxHp * 0.3;
    case 'allyDown':
      return state.combatants.some((c) => c.side === 'enemy' && c.key !== enemy.key && !c.alive);
    case 'turn3':
      return enemy.turnsTaken >= 2;
    case 'partyPoisoned':
      return state.combatants.some((c) => c.side === 'party' && c.statuses.some((s) => s.id === 'poison'));
  }
}

export function chooseEnemyAction(enemy: Combatant, state: BattleState): [AiAction, number] {
  const rules = rulesFor(enemy, state);
  let rng = state.rng;
  for (const cond of CONDITION_PRIORITY) {
    const group = rules.filter((r) => r.when === cond && holds(cond, enemy, state));
    if (group.length === 0) continue;
    const total = group.reduce((sum, r) => sum + r.weight, 0);
    const [r, next] = nextRng(rng);
    rng = next;
    let pick = r * total;
    for (const rule of group) {
      pick -= rule.weight;
      if (pick <= 0) return [rule.do, rng];
    }
    return [group[group.length - 1].do, rng];
  }
  return [{ type: 'wait', name: 'does nothing' }, rng];
}
```

- [ ] **Step 4: Rewrite battleReducer.ts**

Replace the whole file with:

```ts
// Pure turn-based battle reducer. No timers in select/target: the clock only
// drives animation queues. Randomness comes from state.rng (mulberry32).

import { party, statsAt, learnedMateria, levelFromExp, type PartyMemberDef } from '../../../data/party';
import { materiaById, type MateriaDef, type StatusId } from '../../../data/materia';
import { items, itemById } from '../../../data/items';
import { enemies, type EnemyDef, type AiAction } from '../../../data/enemies';
import { bossById } from '../../../data/bosses';
import { actCost, previewOrder, nextActor } from './turnQueue';
import { nextRng, physicalDamage, magicDamage, elementMultiplier } from './damage';
import { chooseEnemyAction } from './ai';
import type {
  BattleState, BattleAction, Combatant, TimedEvent, SfxKind, FloaterKind, CalloutKind, StatusInst,
} from './types';

export const timing = {
  introMs: 1400,
  messageLeadMs: 600,
  impactGapMs: 420,
  settleMs: 500,
  floaterMs: 900,
  calloutMs: 1100,
  shakeMs: 320,
  flashMs: 200,
  resultDelayMs: 900,
  statusTickMs: 700,
};

export const LIMIT_FILL_DAMAGE = 260;
export const DEFEND_LIMIT_GAIN = 0.15;
export const POISON_FRACTION = 0.06;

export interface BattleSetup {
  kind: 'random' | 'boss';
  bossId?: string;
  enemies: EnemyDef[];
  level: number;
  exp: number;
  gil: number;
  inventory: Record<string, number>;
  seed: number;
}

function partyCombatant(def: PartyMemberDef, level: number): Combatant {
  const s = statsAt(def, level);
  return {
    key: def.id, side: 'party', name: def.name, defId: def.id,
    hp: s.hp, maxHp: s.hp, mp: s.mp, maxMp: s.mp, atk: s.atk, def: s.def, spd: s.spd,
    statuses: [], limit: 0, defending: false, nextAct: 0, alive: true,
    dodge: 0, weak: [], resist: [], absorb: [], immune: [], actsTwice: false, turnsTaken: 0,
  };
}

function enemyCombatant(def: EnemyDef, key: string, nameSuffix = ''): Combatant {
  const boss = bossById(def.id);
  return {
    key, side: 'enemy', name: def.name + nameSuffix, defId: def.id,
    hp: def.hp, maxHp: def.hp, mp: 0, maxMp: 0, atk: def.atk, def: def.def, spd: def.spd,
    statuses: [], limit: 0, defending: false, nextAct: 0, alive: true,
    dodge: def.dodge, weak: def.weak, resist: def.resist, absorb: def.absorb,
    immune: boss?.immune ?? [], actsTwice: def.actsTwice, turnsTaken: 0,
  };
}

export function createBattleState(setup: BattleSetup): BattleState {
  const combatants: Combatant[] = party.map((p) => partyCombatant(p, setup.level));
  let n = 1;
  for (const def of setup.enemies) {
    const boss = bossById(def.id);
    if (boss?.heads) {
      for (let h = 0; h < boss.heads; h++) combatants.push(enemyCombatant(def, `e${n++}`, ` ${['A', 'B', 'C'][h]}`));
    } else {
      combatants.push(enemyCombatant(def, `e${n++}`));
      if (def.pair) combatants.push(enemyCombatant(def, `e${n++}`, ' B'));
    }
  }
  const intro = setup.kind === 'boss' && setup.bossId
    ? bossById(setup.bossId)!.intro
    : combatants.filter((c) => c.side === 'enemy').length > 1
      ? `${setup.enemies[0].name} and company appear.`
      : `${setup.enemies[0].name} appears.`;
  return {
    kind: setup.kind,
    bossId: setup.bossId,
    phase: 'intro',
    clock: 0,
    rng: setup.seed >>> 0 || 1,
    combatants,
    active: null,
    order: previewOrder(combatants),
    menu: { open: 'root', cursor: 0, pending: null, targetCursor: 0 },
    queue: [
      { at: 200, type: 'sfx', sfx: 'encounter' },
      { at: 250, type: 'message', text: intro },
      { at: timing.introMs, type: 'end' },
    ],
    message: '',
    floaters: [],
    callouts: [],
    seq: 0,
    shakeUntil: 0,
    flashUntil: {},
    scanned: [],
    inventory: { ...setup.inventory },
    level: setup.level,
    exp: setup.exp,
    gil: setup.gil,
    phase2Done: false,
    lastSfx: null,
    result: null,
  };
}

// ---------- selectors ----------

export function livingEnemies(s: BattleState): Combatant[] {
  return s.combatants.filter((c) => c.side === 'enemy' && c.alive);
}

export function partyMembers(s: BattleState): Combatant[] {
  return s.combatants.filter((c) => c.side === 'party');
}

export function combatant(s: BattleState, key: string): Combatant {
  return s.combatants.find((c) => c.key === key)!;
}

export function memberDef(c: Combatant): PartyMemberDef {
  return party.find((p) => p.id === c.defId)!;
}

export type RootCommand = 'ATTACK' | 'BITE' | 'MATERIA' | 'TRICKS' | 'DEFEND' | 'ITEM' | 'LIMIT' | 'RUN';

export function rootCommandsFor(c: Combatant, s: BattleState): RootCommand[] {
  const def = memberDef(c);
  const cmds: RootCommand[] = [def.attackName as RootCommand, def.materiaCommand, 'DEFEND', 'ITEM', 'LIMIT'];
  if (s.kind === 'random') cmds.push('RUN');
  return cmds;
}

export function availableMateria(s: BattleState, c: Combatant): MateriaDef[] {
  return learnedMateria(memberDef(c), s.level);
}

export function menuLengthFor(s: BattleState): number {
  const c = s.active ? combatant(s, s.active) : null;
  if (!c) return 1;
  if (s.menu.open === 'root') return rootCommandsFor(c, s).length;
  if (s.menu.open === 'materia') return availableMateria(s, c).length;
  return items.length;
}

function hasStatus(c: Combatant, id: StatusId): boolean {
  return c.statuses.some((st) => st.id === id);
}

// ---------- helpers that mutate a cloned state ----------

function clone(s: BattleState): BattleState {
  return {
    ...s,
    combatants: s.combatants.map((c) => ({ ...c, statuses: c.statuses.map((st) => ({ ...st })) })),
    menu: { ...s.menu },
    queue: s.queue.slice(),
    floaters: s.floaters.slice(),
    callouts: s.callouts.slice(),
    flashUntil: { ...s.flashUntil },
    scanned: s.scanned.slice(),
    inventory: { ...s.inventory },
  };
}

function sfx(s: BattleState, kind: SfxKind) {
  s.seq += 1;
  s.lastSfx = { seq: s.seq, kind };
}

function floater(s: BattleState, targetKey: string, text: string, kind: FloaterKind) {
  s.seq += 1;
  s.floaters.push({ id: s.seq, targetKey, text, kind, bornAt: s.clock });
}

function callout(s: BattleState, targetKey: string, text: CalloutKind) {
  s.seq += 1;
  s.callouts.push({ id: s.seq, targetKey, text, bornAt: s.clock });
}

function roll(s: BattleState): number {
  const [r, next] = nextRng(s.rng);
  s.rng = next;
  return r;
}

function applyStatus(s: BattleState, target: Combatant, st: StatusInst): boolean {
  if (target.immune.includes(st.id)) return false;
  const existing = target.statuses.find((x) => x.id === st.id);
  if (existing) existing.turns = Math.max(existing.turns, st.turns);
  else target.statuses.push({ ...st });
  // opposing statuses cancel
  if (st.id === 'haste') target.statuses = target.statuses.filter((x) => x.id !== 'slow');
  if (st.id === 'slow') target.statuses = target.statuses.filter((x) => x.id !== 'haste');
  return true;
}

function randomTarget(s: BattleState, side: 'party' | 'enemy', mode: 'random' | 'weakest' = 'random'): Combatant | null {
  const pool = s.combatants.filter((c) => c.side === side && c.alive);
  if (pool.length === 0) return null;
  if (mode === 'weakest') return pool.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  return pool[Math.floor(roll(s) * pool.length)];
}

// ---------- action queuing ----------

function endOfAction(s: BattleState, at: number) {
  s.queue.push({ at, type: 'end' });
  s.phase = 'resolving';
  s.menu = { open: 'root', cursor: 0, pending: null, targetCursor: 0 };
}

function queuePhysical(s: BattleState, attacker: Combatant, target: Combatant, powerScale: number, at: number, element: 'none' | 'earth' = 'none'): number {
  if (target.dodge > 0 && roll(s) < target.dodge) {
    s.queue.push({ at, type: 'miss', targetKey: target.key });
    return at;
  }
  const [base, next] = physicalDamage(attacker, target, powerScale, s.rng);
  s.rng = next;
  const mult = elementMultiplier(target, element);
  const amount = Math.round(base * (element === 'none' ? 1 : mult));
  const co: CalloutKind | undefined = element !== 'none' && mult === 2 ? 'WEAK!' : element !== 'none' && mult === 0.5 ? 'RESIST' : undefined;
  s.queue.push({ at, type: 'damage', targetKey: target.key, amount, callout: co, sfx: attacker.side === 'party' ? 'hit' : 'hurt' });
  return at;
}

function queueMagic(s: BattleState, caster: Combatant, target: Combatant, m: MateriaDef, at: number) {
  const [amount, next] = magicDamage(caster, target, m.power, m.element, s.rng);
  s.rng = next;
  const mult = elementMultiplier(target, m.element);
  const co: CalloutKind | undefined = mult === 2 ? 'WEAK!' : mult === 0.5 ? 'RESIST' : mult === 0 ? 'ABSORB' : undefined;
  if (mult === 0) {
    s.queue.push({ at, type: 'heal', targetKey: target.key, stat: 'hp', amount: Math.round(m.power / 2) });
    s.queue.push({ at, type: 'damage', targetKey: target.key, amount: 0, callout: co, sfx: 'heal' });
  } else {
    s.queue.push({ at, type: 'damage', targetKey: target.key, amount, callout: co, sfx: 'hit' });
  }
}

function startPartyAction(s: BattleState, actor: Combatant, targetKey: string | null) {
  const c = s.clock;
  const lead = timing.messageLeadMs;
  const pending = s.menu.pending!;
  const def = memberDef(actor);
  s.queue = [];

  if (pending.kind === 'attack') {
    const target = combatant(s, targetKey!);
    s.queue.push({ at: c, type: 'message', text: def.attackLine });
    queuePhysical(s, actor, target, 1, c + lead);
    const boss = bossById(target.defId);
    if (boss?.countersPhysical) {
      s.queue.push({ at: c + lead + timing.impactGapMs, type: 'message', text: `${target.name} counters.` });
      const [amount, next] = physicalDamage(target, actor, 0.7, s.rng);
      s.rng = next;
      s.queue.push({ at: c + lead + timing.impactGapMs * 2, type: 'damage', targetKey: actor.key, amount, callout: 'COUNTER', sfx: 'hurt' });
      endOfAction(s, c + lead + timing.impactGapMs * 2 + timing.settleMs);
      return;
    }
    endOfAction(s, c + lead + timing.settleMs);
    return;
  }

  if (pending.kind === 'limit') {
    const lim = def.limit;
    s.queue.push({ at: c, type: 'message', text: lim.line });
    s.queue.push({ at: c + 80, type: 'sfx', sfx: 'limit' });
    const targets = lim.target === 'enemies' ? livingEnemies(s) : [combatant(s, targetKey!)];
    let at = c + lead;
    for (let h = 0; h < lim.hits; h++) {
      for (const t of targets) {
        const [amount, next] = magicDamage(actor, t, lim.powerPerHit, lim.element, s.rng);
        s.rng = next;
        const boss = bossById(t.defId);
        const scaled = boss?.limitWeak ? amount * 2 : amount;
        s.queue.push({ at, type: 'damage', targetKey: t.key, amount: scaled, callout: boss?.limitWeak ? 'CRITICAL' : undefined, sfx: 'hit' });
      }
      at += timing.impactGapMs;
    }
    actor.limit = 0;
    endOfAction(s, at + timing.settleMs);
    return;
  }

  if (pending.kind === 'materia') {
    const m = materiaById(pending.id)!;
    actor.mp -= m.mpCost;
    s.queue.push({ at: c, type: 'message', text: m.line });
    const at = c + lead;
    if (m.kind === 'damage') {
      const targets = m.target === 'enemies' ? livingEnemies(s) : [combatant(s, targetKey!)];
      for (const t of targets) queueMagic(s, actor, t, m, at);
    } else if (m.kind === 'heal') {
      s.queue.push({ at, type: 'heal', targetKey: targetKey!, stat: 'hp', amount: m.power });
    } else if (m.kind === 'status' && m.status) {
      const t = m.target === 'self' ? actor : combatant(s, targetKey!);
      const lands = roll(s) < m.status.chance && !t.immune.includes(m.status.id);
      s.queue.push({ at, type: 'status', targetKey: t.key, status: lands ? { id: m.status.id, turns: m.status.turns } : null, text: lands ? m.status.id.toUpperCase() : 'NO EFFECT' });
    } else if (m.kind === 'cure') {
      for (const p of partyMembers(s)) s.queue.push({ at, type: 'cure', targetKey: p.key });
    } else if (m.kind === 'scan') {
      s.queue.push({ at, type: 'scan', targetKey: targetKey! });
    } else if (m.kind === 'fetch') {
      const pool = ['coffee', 'coffee', 'runbook', 'patch', 'pager'];
      s.queue.push({ at, type: 'fetch', itemId: pool[Math.floor(roll(s) * pool.length)] });
    }
    endOfAction(s, at + timing.settleMs);
    return;
  }

  // item
  const item = itemById(pending.kind === 'item' ? pending.id : '')!;
  s.inventory[item.id] = (s.inventory[item.id] ?? 1) - 1;
  s.queue.push({ at: c, type: 'message', text: `${actor.name} ${item.line}` });
  const at = c + lead;
  if (item.effect === 'hp') s.queue.push({ at, type: 'heal', targetKey: targetKey!, stat: 'hp', amount: item.amount });
  else if (item.effect === 'mp') s.queue.push({ at, type: 'heal', targetKey: targetKey!, stat: 'mp', amount: item.amount });
  else if (item.effect === 'cure') s.queue.push({ at, type: 'cure', targetKey: targetKey! });
  else if (item.effect === 'escape') {
    s.queue.push({ at, type: 'finish', outcome: 'fled' });
    s.phase = 'resolving';
    return;
  }
  endOfAction(s, at + timing.settleMs);
}

function startEnemyAction(s: BattleState, enemy: Combatant) {
  const c = s.clock;
  const lead = timing.messageLeadMs;
  const [action, rng] = chooseEnemyAction(enemy, s);
  s.rng = rng;
  s.queue = [];
  const act = (a: AiAction, at: number): number => {
    switch (a.type) {
      case 'attack': {
        const t = randomTarget(s, 'party', a.target);
        if (!t) return at;
        s.queue.push({ at, type: 'message', text: `${enemy.name} uses ${a.name}.` });
        const [base, next] = physicalDamage(enemy, t, a.power / 12, s.rng);
        s.rng = next;
        const mult = elementMultiplier(t, a.element);
        s.queue.push({ at: at + lead, type: 'damage', targetKey: t.key, amount: Math.round(base * mult), sfx: 'hurt' });
        return at + lead;
      }
      case 'attackAll': {
        s.queue.push({ at, type: 'message', text: `${enemy.name} uses ${a.name}.` });
        let t2 = at + lead;
        for (const p of partyMembers(s).filter((p) => p.alive)) {
          const [base, next] = physicalDamage(enemy, p, a.power / 12, s.rng);
          s.rng = next;
          s.queue.push({ at: t2, type: 'damage', targetKey: p.key, amount: base, sfx: 'hurt' });
          t2 += timing.impactGapMs / 2;
        }
        return t2;
      }
      case 'status': {
        const targets = a.target === 'self' ? [enemy] : a.target === 'allies' ? s.combatants.filter((x) => x.side === 'enemy' && x.alive) : [randomTarget(s, 'party')].filter((x): x is Combatant => !!x);
        s.queue.push({ at, type: 'message', text: `${enemy.name} uses ${a.name}.` });
        for (const t of targets) {
          const lands = roll(s) < a.chance && !t.immune.includes(a.status);
          s.queue.push({ at: at + lead, type: 'status', targetKey: t.key, status: lands ? { id: a.status, turns: a.turns } : null, text: lands ? a.status.toUpperCase() : 'NO EFFECT' });
        }
        return at + lead;
      }
      case 'heal': {
        s.queue.push({ at, type: 'message', text: `${enemy.name} uses ${a.name}.` });
        s.queue.push({ at: at + lead, type: 'heal', targetKey: enemy.key, stat: 'hp', amount: a.amount });
        return at + lead;
      }
      case 'flee':
        s.queue.push({ at, type: 'message', text: `${enemy.name} ${a.name.toLowerCase()}.` });
        s.queue.push({ at: at + lead, type: 'flee', key: enemy.key });
        return at + lead;
      case 'wait':
        s.queue.push({ at, type: 'message', text: `${enemy.name} ${a.name}.` });
        return at + lead / 2;
    }
  };
  let at = act(action, c);
  if (enemy.actsTwice && enemy.alive) {
    const [second, rng2] = chooseEnemyAction(enemy, s);
    s.rng = rng2;
    at = act(second, at + timing.impactGapMs);
  }
  s.queue.push({ at: at + timing.settleMs, type: 'end' });
  s.phase = 'resolving';
}

// ---------- turn flow ----------

function tickStatuses(s: BattleState, c: Combatant) {
  // poison bites at the start of the combatant's turn
  if (hasStatus(c, 'poison') && c.alive) {
    const dmg = Math.max(1, Math.round(c.maxHp * POISON_FRACTION));
    c.hp = Math.max(0, c.hp - dmg);
    floater(s, c.key, String(dmg), 'damage');
    if (c.hp === 0) c.alive = false;
  }
  for (const st of c.statuses) st.turns -= 1;
  c.statuses = c.statuses.filter((st) => st.turns > 0);
}

function beginTurn(s: BattleState) {
  const next = nextActor(s.combatants);
  if (!next) return;
  s.active = next.key;
  next.defending = false;
  tickStatuses(s, next);
  next.turnsTaken += 1;
  next.nextAct += actCost(next);
  s.order = [next.key, ...previewOrder(s.combatants, 7)];
  if (!next.alive) {
    // died to poison on its own turn
    endOfAction(s, s.clock + timing.statusTickMs);
    return;
  }
  if (next.side === 'party') {
    s.phase = 'select';
    s.menu = { open: 'root', cursor: 0, pending: null, targetCursor: 0 };
    s.message = '';
  } else {
    startEnemyAction(s, next);
  }
}

function checkOutcome(s: BattleState): boolean {
  const enemiesDead = livingEnemies(s).length === 0;
  const partyDead = partyMembers(s).every((p) => !p.alive);
  if (enemiesDead) {
    const bossLine = s.bossId ? bossById(s.bossId)!.defeatLine : 'The field is clear.';
    s.queue = [
      { at: s.clock + 150, type: 'message', text: bossLine },
      { at: s.clock + timing.resultDelayMs, type: 'sfx', sfx: 'victory' },
      { at: s.clock + timing.resultDelayMs, type: 'finish', outcome: 'victory' },
    ];
    s.phase = 'resolving';
    return true;
  }
  if (partyDead) {
    s.queue = [
      { at: s.clock + 150, type: 'message', text: 'The party is down. Rolling back.' },
      { at: s.clock + timing.resultDelayMs, type: 'sfx', sfx: 'defeat' },
      { at: s.clock + timing.resultDelayMs, type: 'finish', outcome: 'defeat' },
    ];
    s.phase = 'resolving';
    return true;
  }
  return false;
}

function finish(s: BattleState, outcome: 'victory' | 'defeat' | 'fled') {
  s.phase = outcome;
  s.queue = [];
  const enemyDefs = s.combatants.filter((c) => c.side === 'enemy');
  let exp = 0;
  let gil = 0;
  const drops: string[] = [];
  if (outcome === 'victory') {
    const seen = new Set<string>();
    for (const e of enemyDefs) {
      const boss = bossById(e.defId);
      const def = boss ?? enemies.find((x) => x.id === e.defId);
      if (!def) continue;
      if (boss && seen.has(boss.id)) continue; // hydra heads count once
      seen.add(e.defId);
      exp += def.exp;
      gil += def.gil;
      if (def.drop && roll(s) < def.drop.chance) drops.push(def.drop.itemId);
    }
  }
  const newExp = s.exp + exp;
  const newLevel = levelFromExp(newExp);
  for (const d of drops) s.inventory[d] = (s.inventory[d] ?? 0) + 1;
  s.result = { outcome, exp, gil, drops, levelsGained: Math.max(0, newLevel - s.level), newLevel, bossId: s.bossId };
}

function processQueue(s: BattleState) {
  while (s.queue.length > 0 && s.queue[0].at <= s.clock) {
    const ev = s.queue.shift()!;
    switch (ev.type) {
      case 'message':
        s.message = ev.text;
        break;
      case 'sfx':
        sfx(s, ev.sfx);
        break;
      case 'miss': {
        callout(s, ev.targetKey, 'MISS');
        sfx(s, 'miss');
        break;
      }
      case 'damage': {
        const t = combatant(s, ev.targetKey);
        if (ev.amount > 0) {
          t.hp = Math.max(0, t.hp - ev.amount);
          floater(s, t.key, String(ev.amount), 'damage');
          if (t.side === 'party') {
            s.shakeUntil = s.clock + timing.shakeMs;
            t.limit = Math.min(1, t.limit + ev.amount / LIMIT_FILL_DAMAGE);
          } else {
            s.flashUntil[t.key] = s.clock + timing.flashMs;
          }
          if (t.hp === 0) t.alive = false;
        }
        if (ev.callout) {
          callout(s, t.key, ev.callout);
          if (ev.callout === 'WEAK!') sfx(s, 'weak');
        }
        sfx(s, ev.sfx);
        // boss phase change
        const boss = s.bossId ? bossById(s.bossId) : undefined;
        if (boss?.phase2 && !s.phase2Done && t.side === 'enemy' && t.hp > 0 && t.hp < t.maxHp * boss.phase2.hpBelow) {
          s.phase2Done = true;
          s.queue.unshift({ at: s.clock, type: 'phase2' });
        }
        break;
      }
      case 'phase2': {
        const boss = bossById(s.bossId!)!;
        s.message = boss.phase2!.message;
        break;
      }
      case 'heal': {
        const t = combatant(s, ev.targetKey);
        if (ev.stat === 'hp') {
          t.hp = Math.min(t.maxHp, t.hp + ev.amount);
          floater(s, t.key, `+${ev.amount}`, 'heal');
        } else {
          t.mp = Math.min(t.maxMp, t.mp + ev.amount);
          floater(s, t.key, `+${ev.amount} MP`, 'mp');
        }
        sfx(s, 'heal');
        break;
      }
      case 'status': {
        const t = combatant(s, ev.targetKey);
        if (ev.status) {
          applyStatus(s, t, ev.status);
          floater(s, t.key, ev.text, 'status');
          sfx(s, ev.status.id === 'haste' || ev.status.id === 'atkUp' ? 'heal' : 'hurt');
        } else {
          floater(s, t.key, ev.text, 'miss');
          sfx(s, 'buzzer');
        }
        break;
      }
      case 'cure': {
        const t = combatant(s, ev.targetKey);
        t.statuses = [];
        floater(s, t.key, 'CLEAR', 'buff');
        sfx(s, 'heal');
        break;
      }
      case 'scan': {
        if (!s.scanned.includes(ev.targetKey)) s.scanned.push(ev.targetKey);
        const t = combatant(s, ev.targetKey);
        const weak = t.weak.length ? t.weak.join(', ').toUpperCase() : 'nothing';
        s.message = `${t.name}: HP ${t.hp}/${t.maxHp}. Weak to ${weak}.`;
        sfx(s, 'confirm');
        break;
      }
      case 'fetch': {
        s.inventory[ev.itemId] = (s.inventory[ev.itemId] ?? 0) + 1;
        const item = itemById(ev.itemId)!;
        s.message = `MARA found a ${item.name}.`;
        floater(s, 'mara', item.name, 'buff');
        sfx(s, 'heal');
        break;
      }
      case 'flee': {
        const t = combatant(s, ev.key);
        t.alive = false;
        t.hp = 0;
        floater(s, t.key, 'GONE', 'miss');
        break;
      }
      case 'regrow': {
        const t = combatant(s, ev.key);
        t.alive = true;
        t.hp = Math.round(t.maxHp * 0.4);
        floater(s, t.key, 'REGROWS', 'status');
        sfx(s, 'buzzer');
        break;
      }
      case 'end': {
        if (s.phase === 'intro') {
          s.phase = 'resolving';
          s.message = '';
          beginTurn(s);
          break;
        }
        // hydra: a dead head regrows at the start of the hydra's next turn
        // unless every head died in this same round
        const boss = s.bossId ? bossById(s.bossId) : undefined;
        if (boss?.heads) {
          const heads = s.combatants.filter((c) => c.side === 'enemy');
          const dead = heads.filter((h) => !h.alive);
          if (dead.length > 0 && dead.length < heads.length) {
            const activeHead = s.active ? combatant(s, s.active) : null;
            if (activeHead?.side === 'enemy') {
              s.queue.unshift({ at: s.clock, type: 'regrow', key: dead[0].key });
              s.queue.push({ at: s.clock + timing.settleMs, type: 'end' });
              break;
            }
          }
        }
        if (checkOutcome(s)) break;
        s.message = '';
        beginTurn(s);
        break;
      }
      case 'finish':
        finish(s, ev.outcome);
        break;
    }
  }
}

// ---------- reducer ----------

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (state.phase === 'done') return state;
  const s = clone(state);

  switch (action.type) {
    case 'TICK': {
      if (s.phase === 'victory' || s.phase === 'defeat' || s.phase === 'fled') {
        s.clock += Math.min(action.dt, 50);
        return s;
      }
      const dt = Math.min(action.dt, 50);
      s.clock += dt;
      s.floaters = s.floaters.filter((f) => s.clock - f.bornAt < timing.floaterMs);
      s.callouts = s.callouts.filter((f) => s.clock - f.bornAt < timing.calloutMs);
      if (s.phase === 'intro' || s.phase === 'resolving') processQueue(s);
      return s;
    }

    case 'MENU_MOVE': {
      if (s.phase !== 'select') return state;
      const len = menuLengthFor(s);
      s.menu.cursor = (s.menu.cursor + action.delta + len) % len;
      sfx(s, 'cursor');
      return s;
    }

    case 'MENU_SET_CURSOR': {
      if (s.phase !== 'select') return state;
      s.menu.cursor = action.index;
      return s;
    }

    case 'MENU_CANCEL': {
      if (s.phase === 'target') {
        s.phase = 'select';
        s.menu.pending = null;
        sfx(s, 'cancel');
        return s;
      }
      if (s.phase !== 'select' || s.menu.open === 'root') return state;
      s.menu = { ...s.menu, open: 'root', cursor: 0, pending: null };
      sfx(s, 'cancel');
      return s;
    }

    case 'MENU_CONFIRM': {
      if (s.phase !== 'select' || !s.active) return state;
      const actor = combatant(s, s.active);
      const { open, cursor } = s.menu;

      if (open === 'root') {
        const cmd = rootCommandsFor(actor, s)[cursor];
        if (cmd === 'ATTACK' || cmd === 'BITE') {
          s.menu.pending = { kind: 'attack' };
          s.phase = 'target';
          s.menu.targetCursor = 0;
          sfx(s, 'confirm');
        } else if (cmd === 'MATERIA' || cmd === 'TRICKS') {
          if (hasStatus(actor, 'silence')) {
            sfx(s, 'buzzer');
            s.message = `${actor.name} is silenced.`;
          } else {
            s.menu = { ...s.menu, open: 'materia', cursor: 0 };
            sfx(s, 'confirm');
          }
        } else if (cmd === 'DEFEND') {
          actor.defending = true;
          actor.limit = Math.min(1, actor.limit + DEFEND_LIMIT_GAIN);
          sfx(s, 'confirm');
          s.queue = [{ at: s.clock, type: 'message', text: `${actor.name} defends.` }];
          endOfAction(s, s.clock + timing.settleMs);
        } else if (cmd === 'ITEM') {
          s.menu = { ...s.menu, open: 'item', cursor: 0 };
          sfx(s, 'confirm');
        } else if (cmd === 'LIMIT') {
          if (actor.limit >= 1) {
            s.menu.pending = { kind: 'limit' };
            sfx(s, 'confirm');
            if (memberDef(actor).limit.target === 'enemies') startPartyAction(s, actor, null);
            else {
              s.phase = 'target';
              s.menu.targetCursor = 0;
            }
          } else {
            sfx(s, 'buzzer');
            s.message = 'LIMIT gauge is not full.';
          }
        } else if (cmd === 'RUN') {
          sfx(s, 'confirm');
          s.queue = [
            { at: s.clock, type: 'message', text: 'The party runs.' },
            { at: s.clock + timing.settleMs, type: 'finish', outcome: 'fled' },
          ];
          s.phase = 'resolving';
        }
        return s;
      }

      if (open === 'materia') {
        const m = availableMateria(s, actor)[cursor];
        if (!m) return state;
        if (actor.mp < m.mpCost) {
          sfx(s, 'buzzer');
          s.message = 'Not enough MP.';
          return s;
        }
        s.menu.pending = { kind: 'materia', id: m.id };
        sfx(s, 'confirm');
        if (m.target === 'enemy' || m.target === 'ally') {
          s.phase = 'target';
          s.menu.targetCursor = 0;
        } else {
          startPartyAction(s, actor, null);
        }
        return s;
      }

      // item submenu
      const item = items[cursor];
      if ((s.inventory[item.id] ?? 0) <= 0) {
        sfx(s, 'buzzer');
        s.message = `No ${item.name} left.`;
        return s;
      }
      s.menu.pending = { kind: 'item', id: item.id };
      sfx(s, 'confirm');
      if (item.effect === 'escape') {
        if (s.kind === 'boss') {
          sfx(s, 'buzzer');
          s.message = 'Nobody answers the page.';
          s.menu.pending = null;
          return s;
        }
        startPartyAction(s, actor, null);
      } else {
        s.phase = 'target';
        s.menu.targetCursor = 0;
      }
      return s;
    }

    case 'TARGET_MOVE': {
      if (s.phase !== 'target') return state;
      const pool = targetPool(s);
      s.menu.targetCursor = (s.menu.targetCursor + action.delta + pool.length) % pool.length;
      sfx(s, 'cursor');
      return s;
    }

    case 'TARGET_SET': {
      if (s.phase !== 'target') return state;
      s.menu.targetCursor = action.index;
      return s;
    }

    case 'TARGET_CONFIRM': {
      if (s.phase !== 'target' || !s.active) return state;
      const pool = targetPool(s);
      const target = pool[s.menu.targetCursor] ?? pool[0];
      if (!target) return state;
      sfx(s, 'confirm');
      startPartyAction(s, combatant(s, s.active), target.key);
      return s;
    }

    case 'RESULT_CONTINUE': {
      if (s.phase !== 'victory' && s.phase !== 'defeat' && s.phase !== 'fled') return state;
      s.phase = 'done';
      return s;
    }

    default:
      return state;
  }
}

/** Who the pending command can target: enemies for attacks, party for heals. */
export function targetPool(s: BattleState): Combatant[] {
  const p = s.menu.pending;
  const allies = partyMembers(s).filter((c) => c.alive);
  if (!p) return livingEnemies(s);
  if (p.kind === 'materia') {
    const m = materiaById(p.id)!;
    return m.target === 'ally' ? allies : livingEnemies(s);
  }
  if (p.kind === 'item') return allies;
  return livingEnemies(s);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: all passing. If `it('attack goes through target selection...')` fails because Mara's BITE missed and `after === before`, that is allowed by the assertion (`toBeLessThanOrEqual`).

- [ ] **Step 6: Run the typecheck**

Run: `npm run typecheck`
Expected: errors only from the old battle UI files (`BattleScreen.tsx`, `CommandMenu.tsx`, `useBattle.ts`, `ResultPanels.tsx`, `StatusPanel.tsx`, `EncounterSelect.tsx`) and `battles.ts` consumers. Those are deleted in Task 12. Confirm no errors in the new files.

- [ ] **Step 7: Commit**

```bash
git add src/components/rpg/battle/ai.ts src/components/rpg/battle/battleReducer.ts tests/unit/battleReducer.test.ts
git commit -m "Rewrite the battle reducer as a turn-based CTB engine with enemy AI

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Encounters module

**Files:**
- Create: `src/components/rpg/overworld/encounters.ts`, `tests/unit/encounters.test.ts`

**Interfaces:**
- Consumes: `worldRows`, `tileLegend`, `worldLocations` from `src/data/overworld.ts`; `terrainPools`, `encounterRate`, `enemyById`, `RARE_ENEMY_ID`, `RARE_CHANCE` from `enemies.ts`; `nextRng` from `damage.ts`.
- Produces: `terrainAt(x, y): Terrain | null`, `rollEncounter(rng, x, y): { rng: number; group: EnemyDef[] | null }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/encounters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { terrainAt, rollEncounter } from '../../src/components/rpg/overworld/encounters';
import { worldLocations } from '../../src/data/overworld';

describe('encounters', () => {
  it('classifies terrain', () => {
    expect(terrainAt(11, 5)).toBe('grass'); // spawn
    expect(terrainAt(14, 3)).toBeNull(); // tree (not walkable)
    expect(terrainAt(4, 13)).toBe('sand');
    expect(terrainAt(4, 1)).toBe('forest'); // grass beside the northern trees
    for (const loc of worldLocations) expect(terrainAt(loc.door.x, loc.door.y)).toBeNull(); // door mats are safe
  });
  it('shore is grass next to water', () => {
    // (1,8) is grass with water at (0,8)
    expect(terrainAt(1, 8)).toBe('shore');
  });
  it('rolls are seeded and land at roughly the configured rate', () => {
    let rng = 12345;
    let fights = 0;
    for (let i = 0; i < 2000; i++) {
      const r = rollEncounter(rng, 11, 5);
      rng = r.rng;
      if (r.group) fights++;
    }
    expect(fights).toBeGreaterThan(100);
    expect(fights).toBeLessThan(200); // ~1/14 of 2000 = 143
    expect(rollEncounter(12345, 11, 5)).toEqual(rollEncounter(12345, 11, 5));
  });
  it('groups have one to three enemies and pairs come in pairs', () => {
    let rng = 99;
    for (let i = 0; i < 300; i++) {
      const r = rollEncounter(rng, 11, 5);
      rng = r.rng;
      if (!r.group) continue;
      expect(r.group.length).toBeGreaterThanOrEqual(1);
      expect(r.group.length).toBeLessThanOrEqual(3);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 3: Write encounters.ts**

```ts
// Random-encounter rolls for the world scene. Pure: takes and returns the rng.

import { worldRows, tileLegend, worldLocations, insideBuilding } from '../../../data/overworld';
import {
  enemyById, terrainPools, encounterRate, RARE_ENEMY_ID, RARE_CHANCE, type EnemyDef, type Terrain,
} from '../../../data/enemies';
import { nextRng } from '../battle/damage';

const WATER = 'w';
const SAND = 's';
const TREES = 't';
const GRASS = 'g';

function tileAt(x: number, y: number): string | null {
  return worldRows[y]?.[x] ?? null;
}

function isDoor(x: number, y: number): boolean {
  return worldLocations.some((l) => l.door.x === x && l.door.y === y);
}

/** Terrain class of a walkable world tile, or null where encounters never happen. */
export function terrainAt(x: number, y: number): Terrain | null {
  const t = tileAt(x, y);
  if (!t || !tileLegend[t]?.walkable || insideBuilding(x, y) || isDoor(x, y)) return null;
  if (t === SAND) return 'sand';
  if (t !== GRASS) return null;
  const neighbours = [tileAt(x - 1, y), tileAt(x + 1, y), tileAt(x, y - 1), tileAt(x, y + 1)];
  if (neighbours.includes(WATER)) return 'shore';
  if (neighbours.includes(TREES)) return 'forest';
  return 'grass';
}

function pick<T extends { weight: number }>(rng: number, entries: T[]): [T, number] {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  const [r, next] = nextRng(rng);
  let acc = r * total;
  for (const e of entries) {
    acc -= e.weight;
    if (acc <= 0) return [e, next];
  }
  return [entries[entries.length - 1], next];
}

export function rollEncounter(rng: number, x: number, y: number): { rng: number; group: EnemyDef[] | null } {
  const terrain = terrainAt(x, y);
  if (!terrain) return { rng, group: null };
  let [r, next] = nextRng(rng);
  if (r >= encounterRate[terrain]) return { rng: next, group: null };

  [r, next] = nextRng(next);
  if (r < RARE_CHANCE) return { rng: next, group: [enemyById(RARE_ENEMY_ID)!] };

  const [entry, afterPick] = pick(next, terrainPools[terrain]);
  next = afterPick;
  const lead = enemyById(entry.id)!;
  if (lead.pair) return { rng: next, group: [lead] }; // pair expands to two combatants in the reducer

  [r, next] = nextRng(next);
  const count = r < 0.55 ? 1 : r < 0.9 ? 2 : 3;
  const group: EnemyDef[] = [lead];
  for (let i = 1; i < count; i++) {
    const [extra, n2] = pick(next, terrainPools[terrain].filter((e) => !enemyById(e.id)!.pair));
    next = n2;
    group.push(enemyById(extra.id)!);
  }
  return { rng: next, group };
}
```

Coordinates were checked against `worldRows` in `src/data/overworld.ts`: (14,3) is a tree, (4,13) is sand, (1,8) is grass with water to its west, (4,1) is grass with a tree to its west. Forest means any grass tile touching a tree; requiring two tree neighbours would leave almost no forest on this map.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/rpg/overworld/encounters.ts tests/unit/encounters.test.ts
git commit -m "Add seeded terrain-based encounter rolls

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Battle mode in the overworld reducer

**Files:**
- Modify: `src/components/rpg/overworld/overworldReducer.ts`
- Modify: `src/data/dialogs.ts` (action type gains `bossId`)
- Create: `tests/unit/overworldBattle.test.ts`

**Interfaces:**
- Consumes: `createBattleState`, `battleReducer`, `rollEncounter`, `SaveData`, `defaultSave`, `levelFromExp`, `bossById`.
- Produces on `OverworldState`: `save: SaveData`, `battle: BattleState | null`, `mode` gains `'battle'`, `encounterFade: number`, `stepsSinceBattle: number`, `pendingBattle: BattleSetup | null`. New actions: `{ type: 'START_BATTLE'; setup: BattleSetup }`, `{ type: 'BATTLE'; action: BattleAction }`, `{ type: 'TOGGLE_ENCOUNTERS' }`, `{ type: 'SET_SOUND'; on: boolean }`, `{ type: 'SET_SAVE'; save: SaveData }`. Dialog action `{ type: 'battle'; bossId: string }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/overworldBattle.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createOverworldState, overworldReducer, ENCOUNTER_GRACE_STEPS } from '../../src/components/rpg/overworld/overworldReducer';
import { defaultSave } from '../../src/utils/rpg-save';
import { enemyById } from '../../src/data/enemies';

function tick(s: ReturnType<typeof createOverworldState>, ms: number) {
  for (let t = 0; t < ms; t += 20) s = overworldReducer(s, { type: 'TICK', dt: 20 });
  return s;
}

function step(s: ReturnType<typeof createOverworldState>, dir: 'left' | 'right' | 'up' | 'down') {
  s = overworldReducer(s, { type: 'INPUT_DOWN', dir });
  s = tick(s, 20);
  s = overworldReducer(s, { type: 'INPUT_UP', dir });
  return tick(s, 220);
}

describe('overworld battle mode', () => {
  it('starts with the save in state', () => {
    const s = createOverworldState(null, { ...defaultSave(), gil: 5 }, 1);
    expect(s.save.gil).toBe(5);
    expect(s.mode).toBe('walk');
  });

  it('START_BATTLE enters battle mode after the swirl and BATTLE forwards actions', () => {
    let s = createOverworldState(null, defaultSave(), 1);
    s = overworldReducer(s, { type: 'START_BATTLE', setup: { kind: 'random', enemies: [enemyById('flaky-test')!], level: 5, exp: 0, gil: 0, inventory: {}, seed: 4 } });
    expect(s.mode).toBe('fade');
    s = tick(s, 800);
    expect(s.mode).toBe('battle');
    expect(s.battle?.phase).toBe('intro');
    s = tick(s, 2000);
    expect(s.battle?.phase).toBe('select');
  });

  it('a finished battle applies rewards to the save and returns to walk', () => {
    let s = createOverworldState(null, defaultSave(), 1);
    s = overworldReducer(s, { type: 'START_BATTLE', setup: { kind: 'random', enemies: [enemyById('flaky-test')!], level: 5, exp: 0, gil: 0, inventory: {}, seed: 4 } });
    s = tick(s, 3000);
    // run away
    const cmds = 6; // RUN is the last root command in a random battle
    s = overworldReducer(s, { type: 'BATTLE', action: { type: 'MENU_SET_CURSOR', index: cmds - 1 } });
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

  it('defeat fades home with full HP and no gil loss', () => {
    let s = createOverworldState(null, { ...defaultSave(), gil: 77 }, 1);
    s = overworldReducer(s, { type: 'START_BATTLE', setup: { kind: 'random', enemies: [enemyById('prod-incident')!], level: 1, exp: 0, gil: 77, inventory: {}, seed: 4 } });
    s = tick(s, 800);
    // force the outcome: a level 1 party against PROD INCIDENT loses, but do not rely on it
    s = { ...s, battle: { ...s.battle!, phase: 'defeat', result: { outcome: 'defeat', exp: 0, gil: 0, drops: [], levelsGained: 0, newLevel: 1 } } };
    s = overworldReducer(s, { type: 'BATTLE', action: { type: 'RESULT_CONTINUE' } });
    expect(s.mode).toBe('fade');
    expect(s.fade?.to?.scene).toBe('house');
    expect(s.save.gil).toBe(77);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL (`createOverworldState` signature, missing actions).

- [ ] **Step 3: Extend the overworld reducer**

In `src/components/rpg/overworld/overworldReducer.ts`:

Add imports:

```ts
import { createBattleState, battleReducer, type BattleSetup } from '../battle/battleReducer';
import type { BattleAction, BattleState } from '../battle/types';
import { rollEncounter } from './encounters';
import { nextRng } from '../battle/damage';
import { levelFromExp } from '../../../data/party';
import { bossById } from '../../../data/bosses';
import type { SaveData } from '../../../utils/rpg-save';
```

Change the mode union and state:

```ts
export type Mode = 'walk' | 'dialog' | 'window' | 'fade' | 'battle';
export const ENCOUNTER_GRACE_STEPS = 4;
export const SWIRL_MS = 500;

export interface OverworldState {
  // ...existing fields...
  save: SaveData;
  battle: BattleState | null;
  /** queued while the swirl plays */
  pendingBattle: BattleSetup | null;
  /** 0..1 swirl progress while a battle is starting */
  swirl: number;
  stepsSinceBattle: number;
  rng: number;
}
```

Add actions:

```ts
  | { type: 'START_BATTLE'; setup: BattleSetup }
  | { type: 'BATTLE'; action: BattleAction }
  | { type: 'TOGGLE_ENCOUNTERS' }
  | { type: 'SET_SOUND'; on: boolean }
  | { type: 'SET_SAVE'; save: SaveData }
```

Change `createOverworldState(saved?, save: SaveData, seed: number)` to set `save`, `battle: null`, `pendingBattle: null`, `swirl: 0`, `stepsSinceBattle: ENCOUNTER_GRACE_STEPS`, `rng: seed >>> 0 || 1`.

In `settle` (called when a step completes), after `withPrompt`, add the encounter roll for the world scene only:

```ts
function settle(state: OverworldState): OverworldState {
  const settled = withPrompt({
    ...state,
    stepping: false,
    progress: 0,
    fromX: state.x,
    fromY: state.y,
    stepFrame: state.stepFrame === 0 ? 1 : 0,
    stepsSinceBattle: state.stepsSinceBattle + 1,
  });
  if (settled.scene !== 'world' || !settled.save.encounters || settled.stepsSinceBattle < ENCOUNTER_GRACE_STEPS) return settled;
  const roll = rollEncounter(settled.rng, settled.x, settled.y);
  if (!roll.group) return { ...settled, rng: roll.rng };
  return startBattle({ ...settled, rng: roll.rng }, {
    kind: 'random',
    enemies: roll.group,
    level: settled.save.level,
    exp: settled.save.exp,
    gil: settled.save.gil,
    inventory: settled.save.inventory,
    seed: roll.rng,
  });
}

function startBattle(state: OverworldState, setup: BattleSetup): OverworldState {
  return {
    ...state,
    mode: 'fade',
    fade: { phase: 'out', t: 0 },
    swirl: 0,
    pendingBattle: setup,
    prompt: null,
    dialog: null,
    window: null,
    queue: [],
    confirmSeq: state.confirmSeq + 1,
  };
}
```

In `TICK`, the fade branch: when `phase === 'out'` completes and `next.pendingBattle` is set, instead of switching scene, create the battle:

```ts
        } else if (next.fade.phase === 'out' && next.pendingBattle) {
          next = {
            ...next,
            mode: 'battle',
            fade: null,
            battle: createBattleState(next.pendingBattle),
            pendingBattle: null,
            stepsSinceBattle: 0,
          };
        } else if (next.fade.phase === 'out' && next.fade.to) {
```

Use `SWIRL_MS` instead of `FADE_MS` for the out phase when `pendingBattle` is set (`const ms = next.pendingBattle ? SWIRL_MS : FADE_MS;`).

Add a battle branch to TICK before the walk branch:

```ts
      if (next.mode === 'battle' && next.battle) {
        next.battle = battleReducer(next.battle, { type: 'TICK', dt: action.dt });
        return next;
      }
```

Add the new cases:

```ts
    case 'START_BATTLE':
      if (state.mode === 'battle' || state.mode === 'fade') return state;
      return startBattle(state, action.setup);

    case 'BATTLE': {
      if (state.mode !== 'battle' || !state.battle) return state;
      const battle = battleReducer(state.battle, action.action);
      if (battle.phase !== 'done') return { ...state, battle };
      return finishBattle({ ...state, battle });
    }

    case 'TOGGLE_ENCOUNTERS':
      return { ...state, save: { ...state.save, encounters: !state.save.encounters }, confirmSeq: state.confirmSeq + 1 };

    case 'SET_SOUND':
      return { ...state, save: { ...state.save, sound: action.on } };

    case 'SET_SAVE':
      return { ...state, save: action.save };
```

And the finisher:

```ts
function finishBattle(state: OverworldState): OverworldState {
  const b = state.battle!;
  const r = b.result!;
  let save = { ...state.save, inventory: { ...b.inventory } };
  if (r.outcome === 'victory') {
    save.exp = state.save.exp + r.exp;
    save.gil = state.save.gil + r.gil;
    save.level = levelFromExp(save.exp);
    if (r.bossId && !save.bossesBeaten.includes(r.bossId)) save.bossesBeaten = [...save.bossesBeaten, r.bossId];
  }
  const base = { ...state, battle: null, save, mode: 'walk' as const, stepsSinceBattle: 0 };
  if (r.outcome === 'defeat') {
    // wake at home, no penalty
    const house = getScene('house');
    return startFade(base, { scene: 'house', ...house.spawn });
  }
  return withPrompt(base);
}
```

Gatekeeper: change the dialog action union in `src/data/dialogs.ts` to `{ type: 'battle'; bossId: string }` and in the reducer's `runAction`:

```ts
    case 'battle': {
      const boss = bossById(action.bossId);
      if (!boss) return endDialog(state);
      return startBattle(endDialog(state), {
        kind: 'boss',
        bossId: boss.id,
        enemies: [boss],
        level: state.save.level,
        exp: state.save.exp,
        gil: state.save.gil,
        inventory: state.save.inventory,
        seed: nextRng(state.rng)[1],
      });
    }
```

Remove the `entered` field and `ACK_ENTER` action entirely (nothing hands off to a section anymore). In `dialogs.ts`, replace the gatekeeper choice with four boss options plus NOT YET:

```ts
    {
      kind: 'choice',
      prompt: 'Which one?',
      options: [
        { label: 'ON-PREM TITAN', action: { type: 'battle', bossId: 'on-prem-titan' } },
        { label: 'SPAGHETTI SQL HYDRA', action: { type: 'battle', bossId: 'sql-hydra' } },
        { label: 'LEGACY MONOLITH', action: { type: 'battle', bossId: 'legacy-monolith' } },
        { label: 'ROGUE AGENT', action: { type: 'battle', bossId: 'rogue-agent' } },
        { label: 'NOT YET', action: { type: 'end' } },
      ],
    },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all passing. The `useOverworld.ts` hook and island still pass `createOverworldState(readSavedPos())` with the old signature; fix them in Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/components/rpg/overworld/overworldReducer.ts src/data/dialogs.ts tests/unit/overworldBattle.test.ts
git commit -m "Add battle mode, encounter rolls, and the save to the overworld reducer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Hook and island wiring, enemy sprites, BattleView

**Files:**
- Modify: `src/components/rpg/overworld/useOverworld.ts`, `src/components/rpg/overworld/OverworldIsland.tsx`, `src/components/rpg/overworld/overworld.css`, `src/components/rpg/overworld/TouchControls.tsx`
- Create: `src/components/rpg/battle/EnemySprites.tsx`, `src/components/rpg/battle/BattleView.tsx`, `src/components/rpg/battle/battle.css`

**Interfaces:**
- Consumes: reducer actions from Task 7; `Sprites.tsx` grids for the four bosses (move the grid arrays into `EnemySprites.tsx`).
- Produces: `<BattleView state dispatch reducedMotion />`, `EnemySprite({ spriteId })`, `PartySprite({ id })`, and `useOverworld` gains `save` persistence and battle key routing.

- [ ] **Step 1: Update the hook**

In `useOverworld.ts`:

- `useOverworld({ speed, active })` initializes with `createOverworldState(readSavedPos(), loadSave(), readSeed())` where `readSeed()` reads `?rpg-seed` or `Date.now() >>> 0` (client only; this runs inside a `useReducer` initializer after hydration guards in the island).
- Persist the save: `useEffect(() => writeSave(state.save), [state.save]);`
- Key routing: add a `battle` branch before the dialog branch:

```ts
      if (mode === 'battle') {
        const b = stateRef.current.battle;
        if (!b) return;
        const send = (a: BattleAction) => dispatch({ type: 'BATTLE', action: a });
        if (b.phase === 'victory' || b.phase === 'defeat' || b.phase === 'fled') {
          if (isConfirmKey(e.key)) send({ type: 'RESULT_CONTINUE' });
        } else if (b.phase === 'target') {
          if (dir === 'left' || dir === 'up') send({ type: 'TARGET_MOVE', delta: -1 });
          else if (dir === 'right' || dir === 'down') send({ type: 'TARGET_MOVE', delta: 1 });
          else if (isConfirmKey(e.key)) send({ type: 'TARGET_CONFIRM' });
          else if (isCancelKey(e.key)) send({ type: 'MENU_CANCEL' });
          else return;
        } else if (b.phase === 'select') {
          if (dir === 'up' || dir === 'left') send({ type: 'MENU_MOVE', delta: -1 });
          else if (dir === 'down' || dir === 'right') send({ type: 'MENU_MOVE', delta: 1 });
          else if (isConfirmKey(e.key)) send({ type: 'MENU_CONFIRM' });
          else if (isCancelKey(e.key)) send({ type: 'MENU_CANCEL' });
          else return;
        } else {
          return;
        }
        e.preventDefault();
        return;
      }
```

  Keep a `stateRef` (`useRef(state); stateRef.current = state;`) alongside `modeRef`.
- Add the `E` key in walk mode: `if (e.key === 'e' || e.key === 'E') { dispatch({ type: 'TOGGLE_ENCOUNTERS' }); e.preventDefault(); return; }` placed before the confirm check (note: `e` was previously a confirm key; remove it from `isConfirmKey` so `e` means encounters).
- `rpg:command` listener: `document.addEventListener('rpg:command', (ev) => { const cmd = (ev as CustomEvent<{ command: string }>).detail?.command; if (cmd === 'toggle-encounters') dispatch({ type: 'TOGGLE_ENCOUNTERS' }); if (cmd === 'toggle-sound') dispatch({ type: 'SET_SOUND', on: !stateRef.current.save.sound }); })`.
- Mirror the encounters flag onto the menu: `useEffect(() => { document.querySelectorAll('[data-encounters-label]').forEach((el) => { el.textContent = state.save.encounters ? 'ENCOUNTERS: ON' : 'ENCOUNTERS: OFF'; }); }, [state.save.encounters]);`
- Sound: `useEffect(() => setMuted(!state.save.sound), [state.save.sound]);` (import `setMuted` from rpg-audio) and battle SFX: watch `state.battle?.lastSfx` seq and play through a map identical to the one in the old `useBattle.ts` (`cursor, confirm, cancel, buzzer, hit, hurt, heal, limit, victory, defeat`), plus `weak: playLimit`, `miss: playCancel`, `levelup: playVictory`, `encounter: playBuzzer`.
- Remove the `entered` / `switchRPGSection` effect.

- [ ] **Step 2: Enemy sprites**

Create `EnemySprites.tsx`: move the four boss grids (`titan`, `hydra`, `monolith`, `agent`) and the `PixelGrid` helper out of `Sprites.tsx` (delete `Sprites.tsx` afterwards), and add twelve 12x12 grids for the enemies. Each grid is an original pixel design in the same style; keep palettes to 3 or 4 colors with a `#10122e` outline. Export:

```ts
export function EnemySprite({ spriteId, name, className }: { spriteId: string; name: string; className?: string }) { /* PixelGrid by id, falls back to 'flaky' */ }
export function PartySprite({ id }: { id: 'alex' | 'mara' }) { /* reuse the overworld player 'down' frame for alex and the mara interior sprite via pixelRects */ }
```

Sprite ids used by data: `flaky, nullptr, cache, offbyone, lake, spaghetti, merge, deadlink, timeout, cron, race, incident, titan, hydra, monolith, agent`.

- [ ] **Step 3: BattleView**

`BattleView.tsx` renders inside `.ow-frame` and takes `{ state: BattleState; dispatch: (a: BattleAction) => void; reducedMotion: boolean }`:

Structure:

```tsx
<div className="rpgb" data-testid="battle-view" data-phase={state.phase}>
  <TurnStrip order={state.order} combatants={state.combatants} />
  <div className={`rpgb-field${shaking ? ' rpgb-shaking' : ''}`}>
    <div className="rpgb-enemies">{enemies.map(e => <EnemyCard .../>)}</div>
    <div className="rpgb-party">{party.map(p => <PartyCard .../>)}</div>
    {floaters}{callouts}
  </div>
  <div className="rpgw-dialog rpgb-message" aria-live="polite">{state.message || hint}</div>
  <div className="rpgb-bottom">
    <StatusRows party={party} />
    <Commands state={state} dispatch={dispatch} />
  </div>
  {result && <ResultWindow .../>}
</div>
```

- `EnemyCard`: sprite with `rpgb-bob` idle animation (paused under reduced motion), `rpgb-flash` while `clock < flashUntil[key]`, `rpgb-dead` dissolve when `!alive`, a target cursor `▶` when `phase === 'target'` and this enemy is `targetPool[targetCursor]`, an HP bar that only shows once the enemy is in `scanned` or is a boss.
- `PartyCard`: portrait (me.jpeg for alex, mara sprite), name, HP/MP numbers and bars, limit bar, status badges (`rpgb-badge`) from `statuses`.
- `Commands`: root list from `rootCommandsFor(active)`, materia list from `availableMateria`, item list from `items` with counts; the focused row shows `▶`; `onMouseEnter` sets cursor, click confirms (`MENU_SET_CURSOR` then `MENU_CONFIRM`); in `target` phase the enemy cards are clickable (`TARGET_SET` then `TARGET_CONFIRM`). RUN shows only in random battles, LIMIT shows `CHARGING` when the gauge is under 1.
- `TurnStrip`: eight slots, each a 20px portrait or enemy thumb with the first slot highlighted; keys `e1..e3` show the enemy thumb.
- `ResultWindow`: for `victory` shows "VICTORY", EXP gained with a bar that fills from the old EXP fraction to the new one over 900ms of clock (render-driven from `state.clock` at `finish` time captured in a ref), level-up flashes (`LEVEL UP! LV n`) for each level in `result.levelsGained`, gil, drops, and for bosses the achievement panel from `experience.ts` (same lookup as the old `VictoryPanel`). For `defeat`: "ROLLED BACK" plus "Rolled back to the last known-good deploy." For `fled`: "GOT AWAY". A `CONTINUE ▶` button dispatches `RESULT_CONTINUE`.

Styling in `battle.css`, imported by BattleView, all under `.theme-rpg .rpgb-*`: port the good parts of `ff7-battle.css` (window bevel, bars, shake/flash/float/appear keyframes, reduced-motion block) and add `rpgb-bob`, `rpgb-dissolve`, `rpgb-strip`, `rpgb-badge`, `rpgb-callout` (large yellow text that pops and fades). The layout is absolute inside `.ow-frame` (`inset: 0`), with a dark blue field background so the map never shows through.

- [ ] **Step 4: Island**

In `OverworldIsland.tsx`:

- When `state.mode === 'battle' && state.battle`, render `<BattleView state={state.battle} dispatch={(a) => dispatch({ type: 'BATTLE', action: a })} reducedMotion={reducedMotion} />` inside `.ow-frame` and hide the prompt/dialog/window (already gated by `overlayOpen`; include battle in `overlayOpen`).
- Swirl: when `state.pendingBattle` is set and `state.fade`, give `.ow-fade` the class `ow-swirl` and set `--swirl` to `state.fade.t`; under reduced motion skip the class (plain fade).
- Help line: in walk mode read `ARROWS / WASD TO MOVE · ENTER TO INTERACT · E: ENCOUNTERS ${state.save.encounters ? 'ON' : 'OFF'}`; in battle `ARROWS SELECT · ENTER CONFIRM · ESC BACK`.
- Touch: `TouchControls` in battle mode maps the D-pad to menu/target moves and A to confirm, B to cancel (pass `onDown` through the same routing as keys by giving `TouchControls` an `onDir(dir)` tap handler used when `mode === 'battle'`).
- First-entry intro: in the island, `useEffect(() => { if (!state.save.seenIntro && state.mode === 'walk') dispatch({ type: 'SHOW_INTRO' }); }, [state.save.seenIntro, state.mode]);`. Add to the reducer's action union `{ type: 'SHOW_INTRO' }` and the case:

```ts
    case 'SHOW_INTRO': {
      if (state.save.seenIntro || state.mode !== 'walk') return state;
      return {
        ...state,
        mode: 'dialog',
        prompt: null,
        queue: [],
        save: { ...state.save, seenIntro: true },
        dialog: { scriptId: 'intro-encounters', step: 0, openedAt: state.clock, revealAll: false, choiceIndex: 0 },
      };
    }
```

and in `dialogs.ts`:

```ts
  'intro-encounters': [
    { kind: 'line', text: 'Wild data roams these fields.' },
    { kind: 'line', text: 'Press E if you would rather walk in peace. Mara can also keep watch at the house.' },
  ],
```

- [ ] **Step 5: overworld.css additions**

```css
/* Battle swirl: a radial mask that closes in over the frame */
.ow-fade.ow-swirl {
  opacity: 1;
  background: radial-gradient(circle at 50% 50%, transparent calc((1 - var(--swirl, 0)) * 90%), #02021e calc((1 - var(--swirl, 0)) * 90% + 12%));
  transition: none;
}
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: builds. `npm run typecheck` still reports the old battle UI files; that is expected until Task 12.

- [ ] **Step 7: Commit**

```bash
git add src/components/rpg/overworld src/components/rpg/battle/EnemySprites.tsx src/components/rpg/battle/BattleView.tsx src/components/rpg/battle/battle.css src/data/dialogs.ts
git commit -m "Render turn-based battles inside the world frame with swirl, sprites, and results

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Container and menu cleanup

**Files:**
- Modify: `src/components/rpg/RPGContainer.astro`, `src/components/rpg/NavigationRPG.astro`, `src/layouts/BaseLayout.astro`

- [ ] **Step 1: RPGContainer**

Remove `#rpg-window-backdrop`, `#rpg-back-world`, the `#rpg-battle` section and its `BattleIsland` import, the whole `switchRPGSection` function, the Escape handler, and the window CSS (`.rpg-section.active:not(#rpg-overworld)`, `.rpg-window-backdrop`, `rpgWindowIn`, `.rpg-back-world`, `.rpg-back-esc`). Keep `#rpg-overworld` (drop the `rpg-section` class machinery: it is the only section now), `gotoRPGScene`, and the sessionStorage migration (simplify: any saved `rpg-active-section` value is removed and ignored).

`gotoRPGScene` becomes:

```js
  window.gotoRPGScene = function(scene) {
    document.dispatchEvent(new CustomEvent('rpg:goto', { detail: { scene: scene } }));
  };
  window.rpgCommand = function(command) {
    document.dispatchEvent(new CustomEvent('rpg:command', { detail: { command: command } }));
    var menu = document.getElementById('ff7-nav');
    if (menu) menu.classList.add('hidden');
  };
```

- [ ] **Step 2: NavigationRPG**

- BATTLE entry: `{ name: "BATTLE", scene: "arena", ... }`.
- New entry after MAP: `{ name: "ENCOUNTERS: ON", command: "toggle-encounters", labelAttr: "data-encounters-label", ... }` rendered as `<div class="ff7-menu-option" data-encounters-label onclick="rpgCommand('toggle-encounters')">` with the text span carrying `data-encounters-label` so the island can update it.
- New entry `{ name: "SOUND", command: "toggle-sound" }` rendered the same way (the battle sound toggle used to live in the battle screen).
- Remove the `section` branch from the template.

- [ ] **Step 3: BaseLayout**

Remove `import "../styles/ff7-battle.css";`.

- [ ] **Step 4: Build and smoke**

Run: `npm run build && npm run e2e`
Expected: build passes. The e2e suite will fail on the arena/battle checks (they look for `#rpg-battle`) - those are rewritten in Task 11. Everything else must pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/rpg/RPGContainer.astro src/components/rpg/NavigationRPG.astro src/layouts/BaseLayout.astro
git commit -m "Remove the battle section window; menu gains encounter and sound toggles

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Status sheet, shop BUY tab, Mara keeps watch

**Files:**
- Modify: `src/components/rpg/windows/StatusSheet.tsx`, `src/components/rpg/windows/ShopWindow.tsx`, `src/data/character.ts`, `src/data/dialogs.ts`, `src/components/rpg/overworld/OverworldIsland.tsx`, `src/components/rpg/ui/ff7-window.css`

**Interfaces:**
- Windows receive the save and a dispatcher: change `WindowContentProps` in `ui/Window.tsx` to `{ onClose: () => void; save: SaveData; dispatch: (a: OverworldAction) => void }` and pass both from `windowFor` in the island.
- New reducer action `{ type: 'BUY'; itemId: string }` (deducts price, adds one; no-op if gil is short) and `{ type: 'SET_ENCOUNTERS'; on: boolean }`.
- Dialog action `{ type: 'setEncounters'; on: boolean }` handled in `runAction`.

- [ ] **Step 1: character.ts**

Remove `level`, `hp`, `mp`, `attributes`, `exp`, `limit` (numbers now come from the save and `statsAt`). Keep `name`, `charClass`, `equipment`, `limitBreak`, `location`, `party`, `contact`.

- [ ] **Step 2: StatusSheet**

Read `save`: header `LV {save.level}`, HP/MP from `statsAt(alexDef, save.level)` (full, since HP is restored outside battle), `EXP {save.exp} / NEXT {expForLevel(save.level + 1) - save.exp}`, `GIL {save.gil}`, materia slots list `learnedMateria(alex, level)` names as orbs with names, `BOSSES {save.bossesBeaten.length}/4`, plus the flavor rows. A `MARA` block with her stats at the same level.

- [ ] **Step 3: ShopWindow**

Add a top tab row `WARES | BUY` (state `tab`). BUY lists `items` with price and owned count; Enter/click buys via `dispatch({ type: 'BUY', itemId })`; a `GIL {save.gil}` readout; "Not enough gil." message when short. Keyboard: ArrowLeft/Right switch tabs.

- [ ] **Step 4: Dialogs**

Shopkeeper choice becomes `BROWSE WARES` (openWindow shop), `BUY ITEMS` (openWindow `shop:buy`; the island passes `initialTab="buy"` when the id has the suffix), `LEAVE`.
Mara's script ends with a choice: prompt "Keep watch?" with `YES` → `{ type: 'setEncounters', on: false }` followed by the line "Mara keeps watch. The fields go quiet." and `NO` → `{ type: 'setEncounters', on: true }` followed by "Mara goes back to sleep. Wild data roams again." Implement by making `setEncounters` set the flag and continue to the next step (not end).

- [ ] **Step 5: Reducer additions**

```ts
    case 'BUY': {
      const item = itemById(action.itemId);
      if (!item || state.save.gil < item.price) return { ...state, confirmSeq: state.confirmSeq }; // no-op
      const inventory = { ...state.save.inventory, [item.id]: (state.save.inventory[item.id] ?? 0) + 1 };
      return { ...state, save: { ...state.save, gil: state.save.gil - item.price, inventory }, confirmSeq: state.confirmSeq + 1 };
    }
    case 'SET_ENCOUNTERS':
      return { ...state, save: { ...state.save, encounters: action.on } };
```

and in `runAction`:

```ts
    case 'setEncounters':
      return enterStep({ ...state, save: { ...state.save, encounters: action.on } }, state.dialog!.step + 1);
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add src/components/rpg/windows src/components/rpg/ui src/data/character.ts src/data/dialogs.ts src/components/rpg/overworld/OverworldIsland.tsx src/components/rpg/overworld/overworldReducer.ts
git commit -m "Status sheet reads the save, shop sells items, Mara can keep watch

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: End-to-end tests

**Files:**
- Modify: `tests/e2e.mjs`

- [ ] **Step 1: Replace the arena block and add battle flows**

Replace the "arena: gatekeeper hands off to the battle section" block with:

```js
    // arena: gatekeeper -> boss battle in the frame
    await teleport(page, 'world');
    await walk(page, 'ArrowDown', 4);
    await walk(page, 'ArrowRight', 7);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    check('inside arena', (await scene(page)) === 'arena');
    await walk(page, 'ArrowUp', 3);
    await tap(page, 'ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await advanceDialog(page);
    check('gatekeeper lists bosses', (await page.locator('.rpgw-choice').count()) === 5);
    await page.keyboard.press('Enter'); // ON-PREM TITAN
    await page.waitForTimeout(1200);
    check('boss battle renders in frame', await page.locator('.ow-frame [data-testid="battle-view"]').isVisible());
    await page.waitForSelector('[data-testid="battle-view"][data-phase="select"]', { timeout: 6000 });
    check('turn strip has eight slots', (await page.locator('.rpgb-strip-slot').count()) === 8);
    check('no RUN against a boss', !(await page.locator('.rpgb-cmd', { hasText: 'RUN' }).count()));
```

Add a new section after the interiors block:

```js
  console.log('random encounters');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem('site-theme', 'rpg'));
    const page = await ctx.newPage();
    await page.goto(BASE + '/?rpg-speed=2&rpg-seed=7', { waitUntil: 'networkidle' });
    await page.waitForSelector('.ow');
    // first-entry intro dialog
    check('encounter intro shown once', await page.locator('.rpgw-dialog').isVisible());
    await advanceDialog(page);
    let fought = false;
    for (let i = 0; i < 80 && !fought; i++) {
      await walk(page, i % 2 ? 'ArrowRight' : 'ArrowLeft', 1);
      fought = (await page.locator('[data-testid="battle-view"]').count()) > 0;
    }
    check('random encounter triggers with seed 7', fought);
    await page.waitForSelector('[data-testid="battle-view"][data-phase="select"]', { timeout: 6000 });
    // run away
    await page.click('.rpgb-cmd:has-text("RUN")');
    await page.waitForSelector('[data-testid="battle-view"][data-phase="fled"]', { timeout: 6000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    check('back to walking after fleeing', (await page.locator('[data-testid="battle-view"]').count()) === 0);

    // toggle off with E, 60 steps, no battle
    await page.keyboard.press('e');
    await page.waitForTimeout(100);
    check('help line shows encounters off', /ENCOUNTERS OFF/.test(await page.locator('.ow-help').innerText()));
    let quiet = true;
    for (let i = 0; i < 60; i++) {
      await walk(page, i % 2 ? 'ArrowRight' : 'ArrowLeft', 1);
      if ((await page.locator('[data-testid="battle-view"]').count()) > 0) quiet = false;
    }
    check('no encounters while off', quiet);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')));
    check('save persists the toggle', saved.encounters === false);

    // menu toggle turns it back on
    await page.click('#ff7-menu-button');
    await page.click('[data-encounters-label]');
    await page.waitForTimeout(200);
    check('menu toggle turns encounters on', (await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')).encounters)) === true);

    // win a fight: fight until victory with ATTACK/BITE, then check exp
    fought = false;
    for (let i = 0; i < 80 && !fought; i++) {
      await walk(page, i % 2 ? 'ArrowRight' : 'ArrowLeft', 1);
      fought = (await page.locator('[data-testid="battle-view"]').count()) > 0;
    }
    for (let turn = 0; turn < 40; turn++) {
      const phase = await page.getAttribute('[data-testid="battle-view"]', 'data-phase').catch(() => null);
      if (!phase) break;
      if (phase === 'victory' || phase === 'defeat' || phase === 'fled') break;
      if (phase === 'select') { await page.keyboard.press('Enter'); await page.waitForTimeout(150); }
      else if (phase === 'target') { await page.keyboard.press('Enter'); await page.waitForTimeout(150); }
      else await page.waitForTimeout(200);
    }
    const outcome = await page.getAttribute('[data-testid="battle-view"]', 'data-phase');
    check('fight resolves', ['victory', 'defeat'].includes(outcome || ''));
    if (outcome === 'victory') {
      check('results show exp', /EXP/.test(await page.locator('.rpgb-result').innerText()));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')));
      check('exp saved after victory', after.exp > 0);
    }
    await ctx.close();
  }
```

And in the house block, after the status window opens: `check('status shows real level', /LV \d+/.test(statusText) && !statusText.includes('LV 99'));` replacing the LV 99 check, and after the mara dialog add the keep-watch choice: `check('mara offers to keep watch', await page.locator('.rpgw-choices').isVisible()); await page.keyboard.press('Escape');`. In the shop block add: click BUY tab (`.rpgsh-tab:has-text("BUY")`), assert `GIL` readout present.

- [ ] **Step 2: Run the suite**

Run: `npm run build && npm run e2e`
Expected: ALL CHECKS PASSED. Fix any selector drift in BattleView (`data-testid="battle-view"`, `data-phase`, `.rpgb-strip-slot`, `.rpgb-cmd`, `.rpgb-result`, `.rpgsh-tab`) rather than loosening the checks.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.mjs
git commit -m "End-to-end coverage for random encounters, toggles, boss fights, and the shop

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Delete the old battle system and finish

**Files:**
- Delete: `src/components/rpg/battle/BattleIsland.tsx`, `BattleScreen.tsx`, `CommandMenu.tsx`, `EncounterSelect.tsx`, `ResultPanels.tsx`, `StatusPanel.tsx`, `useBattle.ts`, `Sprites.tsx` (if not already folded into EnemySprites), `src/data/battles.ts`, `src/styles/ff7-battle.css`
- Modify: memory notes are not part of the repo; update `README.md` "Checks" section to mention `npm test`.

- [ ] **Step 1: Delete and grep**

```bash
git rm src/components/rpg/battle/BattleIsland.tsx src/components/rpg/battle/BattleScreen.tsx src/components/rpg/battle/CommandMenu.tsx src/components/rpg/battle/EncounterSelect.tsx src/components/rpg/battle/ResultPanels.tsx src/components/rpg/battle/StatusPanel.tsx src/components/rpg/battle/useBattle.ts src/data/battles.ts src/styles/ff7-battle.css
grep -rn "battles'\|ff7-battle\|switchRPGSection\|rpg-battles-won\|BattleIsland" src/ tests/ README.md
```

Expected: no matches.

- [ ] **Step 2: Typecheck, unit, build, e2e**

Run: `npm run typecheck && npm test && npm run build && npm run e2e`
Expected: all clean.

- [ ] **Step 3: Simplifier pass**

Run the code-simplifier agent over `git diff <first-commit-of-this-plan>..HEAD` with the same hard rules used before (no behavior change, keep test selectors and storage keys). Review its edits, re-run the four commands.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "Remove the active-time battle system now that turn-based battles live in the world

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Push only when Alex says to (a push deploys alexnorum.com).
