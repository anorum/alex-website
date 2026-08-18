// Interior rooms. Shared legend: '#' wall (blocked), '.' floor, 'r' rug,
// '_' void outside the room (blocked, painted black).

import type { Scene, ScenePalette, TileDef } from './types';

export const interiorLegend: Record<string, TileDef> = {
  '#': { walkable: false },
  '.': { walkable: true },
  r: { walkable: true },
  _: { walkable: false },
};

const woodPalette: ScenePalette = {
  wall: '#6b4a32',
  wallTop: '#4c3322',
  floorA: '#a97e55',
  floorB: '#9d744d',
  rug: '#7d3b3b',
};

/** 12x9 room shell: solid walls, floor inside. Rows must be rectangular. */
function assertRoom(rows: string[]): string[] {
  const w = rows[0].length;
  if (rows.some((r) => r.length !== w)) throw new Error('room rows must be rectangular');
  return rows;
}

export const interiors: Scene[] = [
  {
    id: 'house',
    name: 'MY HOUSE',
    rows: assertRoom([
      '############',
      '#..........#',
      '#..........#',
      '#....rr....#',
      '#....rr....#',
      '#..........#',
      '#..........#',
      '#..........#',
      '############',
    ]),
    legend: interiorLegend,
    spawn: { x: 5, y: 6, facing: 'up' },
    exits: [
      {
        at: { x: 5, y: 7 },
        to: { scene: 'world', x: 3, y: 4, facing: 'down' },
        label: 'LEAVE',
        hint: 'Back to the world',
      },
    ],
    interactables: [
      {
        id: 'mirror',
        kind: 'object',
        name: 'EXAMINE MIRROR',
        at: { x: 2, y: 1 },
        sprite: 'mirror',
        scriptId: 'house-mirror',
        hint: 'Character data',
      },
      {
        id: 'desk',
        kind: 'object',
        name: 'EXAMINE DESK',
        at: { x: 9, y: 1 },
        sprite: 'desk',
        scriptId: 'house-desk',
        hint: 'About Alex',
      },
      {
        id: 'mara',
        kind: 'npc',
        name: 'TALK TO MARA',
        at: { x: 8, y: 5 },
        sprite: 'mara',
        scriptId: 'house-mara',
        hint: 'The dog',
      },
    ],
    palette: woodPalette,
  },
];
