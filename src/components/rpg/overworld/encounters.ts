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
  if (lead.pair) return { rng: next, group: [lead] }; // pairs expand to two combatants in the reducer

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
