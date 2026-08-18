// Scene system types for the RPG engine. Pure data - no React, no DOM.

import type { Direction, TileDef } from '../overworld';

export type { Direction, TileDef };

export interface SceneExit {
  /** walkable trigger tile (door mat) */
  at: { x: number; y: number };
  to: { scene: string; x: number; y: number; facing: Direction };
  /** prompt label, e.g. "LEAVE" or "ENTER MY HOUSE" */
  label: string;
  hint?: string;
}

export interface Interactable {
  /** unique within its scene */
  id: string;
  kind: 'npc' | 'object';
  /** prompt label, e.g. "TALK TO MARA", "EXAMINE MIRROR" */
  name: string;
  /** occupied tile; blocked for walking */
  at: { x: number; y: number };
  /** key into the interior sprite registry */
  sprite: string;
  /** dialog script key in src/data/dialogs.ts */
  scriptId: string;
  hint?: string;
}

export interface ScenePalette {
  wall: string;
  wallTop: string;
  floorA: string;
  floorB: string;
  rug: string;
}

export interface Scene {
  id: string;
  /** shown inside the game frame, e.g. "MY HOUSE" */
  name: string;
  rows: string[];
  legend: Record<string, TileDef>;
  /** default spawn, used by teleports */
  spawn: { x: number; y: number; facing: Direction };
  exits: SceneExit[];
  interactables: Interactable[];
  /** interior color scheme; world scene has none */
  palette?: ScenePalette;
}
