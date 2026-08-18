// Scene registry and scene-aware collision helpers. Pure data - no DOM.

import {
  tileLegend,
  worldRows,
  worldLocations,
  spawn as worldSpawn,
  insideBuilding,
  STEP_MS,
} from '../overworld';
import { interiors } from './interiors';
import type { Interactable, Scene, SceneExit } from './types';

export type { Interactable, Scene, SceneExit } from './types';
export { STEP_MS };

/** The overworld as a scene. Every building door is an exit into its interior. */
export const worldScene: Scene = {
  id: 'world',
  name: 'WORLD',
  rows: worldRows,
  legend: tileLegend,
  spawn: { ...worldSpawn, facing: 'down' },
  exits: worldLocations.map((loc): SceneExit => {
    const interior = interiors.find((s) => s.id === loc.id)!;
    return {
      at: loc.door,
      to: { scene: loc.id, ...interior.spawn },
      label: `ENTER ${loc.name}`,
      hint: loc.hint,
    };
  }),
  interactables: [],
};

export const scenes: Record<string, Scene> = Object.fromEntries(
  [worldScene, ...interiors].map((s) => [s.id, s])
);

export function getScene(id: string): Scene {
  return scenes[id] ?? worldScene;
}

export function isWalkableIn(scene: Scene, x: number, y: number): boolean {
  if (y < 0 || y >= scene.rows.length || x < 0 || x >= scene.rows[0].length) return false;
  const def = scene.legend[scene.rows[y][x]];
  if (!def?.walkable) return false;
  if (scene.id === 'world' && insideBuilding(x, y)) return false;
  return !scene.interactables.some((i) => i.at.x === x && i.at.y === y);
}

export function exitAt(scene: Scene, x: number, y: number): SceneExit | null {
  return scene.exits.find((e) => e.at.x === x && e.at.y === y) ?? null;
}

/** The interactable on the tile directly ahead of (x, y) facing dir. */
export function interactableAhead(
  scene: Scene,
  x: number,
  y: number,
  facing: 'up' | 'down' | 'left' | 'right'
): Interactable | null {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[facing];
  const tx = x + d[0];
  const ty = y + d[1];
  return scene.interactables.find((i) => i.at.x === tx && i.at.y === ty) ?? null;
}
