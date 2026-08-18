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

const stonePalette: ScenePalette = {
  wall: '#5b5f6b',
  wallTop: '#43464f',
  floorA: '#b8b2a2',
  floorB: '#aca699',
  rug: '#3a5bb3',
};

const towerPalette: ScenePalette = {
  wall: '#4a3a6b',
  wallTop: '#362a4f',
  floorA: '#8f86a8',
  floorB: '#847a9e',
  rug: '#7a4fb3',
};

const dojoPalette: ScenePalette = {
  wall: '#5e4a32',
  wallTop: '#443622',
  floorA: '#9db06a',
  floorB: '#93a660',
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
  {
    id: 'hall',
    name: 'QUEST HALL',
    rows: assertRoom([
      '############',
      '#..........#',
      '#..........#',
      '#..........#',
      '#....rr....#',
      '#....rr....#',
      '#..........#',
      '#..........#',
      '############',
    ]),
    legend: interiorLegend,
    spawn: { x: 5, y: 6, facing: 'up' },
    exits: [
      {
        at: { x: 5, y: 7 },
        to: { scene: 'world', x: 10, y: 4, facing: 'down' },
        label: 'LEAVE',
        hint: 'Back to the world',
      },
    ],
    interactables: [
      {
        id: 'board',
        kind: 'object',
        name: 'READ QUEST BOARD',
        at: { x: 6, y: 1 },
        sprite: 'board',
        scriptId: 'hall-board',
        hint: 'Career history',
      },
      {
        id: 'receptionist',
        kind: 'npc',
        name: 'TALK TO RECEPTIONIST',
        at: { x: 2, y: 3 },
        sprite: 'receptionist',
        scriptId: 'hall-receptionist',
        hint: 'The guild',
      },
    ],
    palette: stonePalette,
  },
  {
    id: 'tower',
    name: 'MAGE TOWER',
    rows: assertRoom([
      '############',
      '#..........#',
      '#..........#',
      '#..........#',
      '#....rr....#',
      '#....rr....#',
      '#..........#',
      '#..........#',
      '############',
    ]),
    legend: interiorLegend,
    spawn: { x: 5, y: 6, facing: 'up' },
    exits: [
      {
        at: { x: 5, y: 7 },
        to: { scene: 'world', x: 17, y: 4, facing: 'down' },
        label: 'LEAVE',
        hint: 'Back to the world',
      },
    ],
    interactables: [
      {
        id: 'lectern',
        kind: 'object',
        name: 'READ THE CREED',
        at: { x: 3, y: 1 },
        sprite: 'lectern',
        scriptId: 'tower-lectern',
        hint: 'How I think',
      },
      {
        id: 'orb',
        kind: 'object',
        name: 'TOUCH THE ORB',
        at: { x: 8, y: 2 },
        sprite: 'orb',
        scriptId: 'tower-orb',
        hint: 'Abilities',
      },
    ],
    palette: towerPalette,
  },
  {
    id: 'dojo',
    name: 'TRAINING DOJO',
    rows: assertRoom([
      '############',
      '#..........#',
      '#..........#',
      '#..........#',
      '#....rr....#',
      '#....rr....#',
      '#..........#',
      '#..........#',
      '############',
    ]),
    legend: interiorLegend,
    spawn: { x: 5, y: 6, facing: 'up' },
    exits: [
      {
        at: { x: 5, y: 7 },
        to: { scene: 'world', x: 5, y: 9, facing: 'down' },
        label: 'LEAVE',
        hint: 'Back to the world',
      },
    ],
    interactables: [
      {
        id: 'shelf-core',
        kind: 'object',
        name: 'CORE MATERIA SHELF',
        at: { x: 2, y: 1 },
        sprite: 'shelfGreen',
        scriptId: 'dojo-shelf-core',
        hint: 'Daily drivers',
      },
      {
        id: 'shelf-also',
        kind: 'object',
        name: 'SUPPORT MATERIA SHELF',
        at: { x: 4, y: 1 },
        sprite: 'shelfBlue',
        scriptId: 'dojo-shelf-also',
        hint: 'Also in the bag',
      },
      {
        id: 'shelf-ai',
        kind: 'object',
        name: 'AI MATERIA SHELF',
        at: { x: 6, y: 1 },
        sprite: 'shelfPurple',
        scriptId: 'dojo-shelf-ai',
        hint: 'Newer orbs',
      },
      {
        id: 'shelf-honest',
        kind: 'object',
        name: 'HONEST SHELF',
        at: { x: 8, y: 1 },
        sprite: 'shelfYellow',
        scriptId: 'dojo-shelf-honest',
        hint: 'Truth in labeling',
      },
      {
        id: 'sensei',
        kind: 'npc',
        name: 'TALK TO SENSEI',
        at: { x: 8, y: 4 },
        sprite: 'sensei',
        scriptId: 'dojo-sensei',
        hint: 'On skill levels',
      },
    ],
    palette: dojoPalette,
  },
];
