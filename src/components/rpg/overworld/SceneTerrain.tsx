// Interior scene renderer: floors, walls, exit mats, and interactable
// sprites, as SVG rects in tile space. Memoized per scene.

import { memo, type ReactElement } from 'react';
import { woodPalette, type Scene, type ScenePalette } from '../../../data/scenes';
import { gridCols, pixelRects } from './pixels';
import { interiorSprites } from './interiorSprites';

/** Void outside the room, painted flat black. */
const VOID_FILL = '#05060f';

interface GlyphProps {
  spriteId: string;
  x: number;
  y: number;
}

function Glyph({ spriteId, x, y }: GlyphProps): ReactElement | null {
  const def = interiorSprites[spriteId];
  if (!def) return null;
  return (
    <svg x={x} y={y} width={1} height={1} viewBox={`0 0 ${gridCols(def.pixels)} ${def.pixels.length}`}>
      {pixelRects(def.pixels, def.palette)}
    </svg>
  );
}

function tileFill(scene: Scene, palette: ScenePalette, x: number, y: number): string {
  switch (scene.rows[y][x]) {
    case '#': {
      // wall face where the room is below, wall top otherwise
      const below = scene.rows[y + 1]?.[x];
      return below && below !== '#' && below !== '_' ? palette.wall : palette.wallTop;
    }
    case 'r':
      return palette.rug;
    case '_':
      return VOID_FILL;
    default:
      return (x + y) % 2 === 0 ? palette.floorA : palette.floorB;
  }
}

export const SceneTerrain = memo(function SceneTerrain({ scene }: { scene: Scene }) {
  const palette = scene.palette ?? woodPalette;
  const tiles: ReactElement[] = [];

  for (let y = 0; y < scene.rows.length; y++) {
    for (let x = 0; x < scene.rows[y].length; x++) {
      tiles.push(
        <rect
          key={`t${x}-${y}`}
          x={x}
          y={y}
          width="1.02"
          height="1.02"
          fill={tileFill(scene, palette, x, y)}
        />
      );
    }
  }

  const mats = scene.exits.map((e) => (
    <rect
      key={`m${e.at.x}-${e.at.y}`}
      x={e.at.x + 0.15}
      y={e.at.y + 0.15}
      width="0.72"
      height="0.72"
      fill="none"
      stroke="#ffd23f"
      strokeWidth="0.08"
      strokeDasharray="0.2 0.14"
      opacity="0.85"
    />
  ));

  const sprites = scene.interactables.map((i) => (
    <Glyph key={`s${i.id}`} spriteId={i.sprite} x={i.at.x} y={i.at.y} />
  ));

  return (
    <g>
      {tiles}
      {mats}
      {sprites}
    </g>
  );
});
