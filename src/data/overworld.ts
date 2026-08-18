// World map data for the RPG overworld. Pure data - no React, no DOM.
// Terrain is a grid of legend chars; buildings sit on top with their own
// footprints (blocked) and a door tile in front (walkable, triggers entry).

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TileDef {
  walkable: boolean;
}

// g grass, s sand, t tree, w water, m mountain
export const tileLegend: Record<string, TileDef> = {
  g: { walkable: true },
  s: { walkable: true },
  t: { walkable: false },
  w: { walkable: false },
  m: { walkable: false },
};

// 22 x 15 tiles
export const worldRows: string[] = [
  'mmmmmmmmmmmmmmmmmmmmmm',
  'mmttggggggggggggggttmm',
  'mtggggggggggggggggggtm',
  'mgggggggggggggttgggggm',
  'mggggggggggggggggggggm',
  'tggggggggggggggggggggt',
  'tggggggggggggggggggggt',
  'gggggggggggggggggggggt',
  'wggggggggggggggggggggt',
  'wwggggggggggggggggggtt',
  'wwsgggttgggggggggggstt',
  'wwssggggggggggggggsstt',
  'wwwssggggggggggggssstt',
  'wwwwssssggggggggssswww',
  'wwwwwwwwwwwwwwwwwwwwww',
];

export const worldCols = worldRows[0].length;

export type BuildingKind =
  | 'house'
  | 'hall'
  | 'tower'
  | 'dojo'
  | 'shop'
  | 'arena'
  | 'camp'
  | 'harbor';

export interface WorldLocation {
  id: string;
  /** Name shown in the enter prompt */
  name: string;
  /** Short label drawn on the map, matches the FF7 menu vocabulary */
  label: string;
  /** Short hint under the prompt */
  hint: string;
  kind: BuildingKind;
  /** Top-left tile of the 2x2 building footprint (blocked) */
  at: { x: number; y: number };
  /** Walkable tile that triggers the enter prompt */
  door: { x: number; y: number };
}

export const worldLocations: WorldLocation[] = [
  {
    id: 'house',
    label: 'STATUS',
    name: 'MY HOUSE',
    hint: 'Character data',
    kind: 'house',
    at: { x: 2, y: 2 },
    door: { x: 3, y: 4 },
  },
  {
    id: 'hall',
    label: 'QUESTS',
    name: 'QUEST HALL',
    hint: 'Career history',
    kind: 'hall',
    at: { x: 9, y: 2 },
    door: { x: 10, y: 4 },
  },
  {
    id: 'tower',
    label: 'ABILITIES',
    name: 'MAGE TOWER',
    hint: 'Abilities',
    kind: 'tower',
    at: { x: 17, y: 2 },
    door: { x: 17, y: 4 },
  },
  {
    id: 'dojo',
    label: 'SKILLS',
    name: 'TRAINING DOJO',
    hint: 'Materia and skills',
    kind: 'dojo',
    at: { x: 4, y: 7 },
    door: { x: 5, y: 9 },
  },
  {
    id: 'shop',
    label: 'SHOP',
    name: 'ITEM SHOP',
    hint: 'Side projects',
    kind: 'shop',
    at: { x: 12, y: 7 },
    door: { x: 12, y: 9 },
  },
  {
    id: 'arena',
    label: 'BATTLE',
    name: 'BATTLE ARENA',
    hint: 'Fight the bosses',
    kind: 'arena',
    at: { x: 17, y: 7 },
    door: { x: 18, y: 9 },
  },
  {
    id: 'camp',
    label: 'CRAFTS',
    name: 'CAMPSITE',
    hint: 'Off the clock',
    kind: 'camp',
    at: { x: 8, y: 11 },
    door: { x: 9, y: 13 },
  },
  {
    id: 'harbor',
    label: 'TRAVEL',
    name: 'HARBOR',
    hint: 'Places traveled',
    kind: 'harbor',
    at: { x: 4, y: 12 },
    door: { x: 6, y: 13 },
  },
];

export const spawn = { x: 11, y: 5 };

/** ms per tile step at speed 1 */
export const STEP_MS = 190;

export function terrainAt(x: number, y: number): TileDef | undefined {
  if (y < 0 || y >= worldRows.length || x < 0 || x >= worldCols) return undefined;
  return tileLegend[worldRows[y][x]];
}

export function insideBuilding(x: number, y: number): boolean {
  return worldLocations.some(
    (loc) => x >= loc.at.x && x <= loc.at.x + 1 && y >= loc.at.y && y <= loc.at.y + 1
  );
}

export function isWalkable(x: number, y: number): boolean {
  const t = terrainAt(x, y);
  return !!t && t.walkable && !insideBuilding(x, y);
}

export function doorAt(x: number, y: number): WorldLocation | null {
  return worldLocations.find((loc) => loc.door.x === x && loc.door.y === y) ?? null;
}
