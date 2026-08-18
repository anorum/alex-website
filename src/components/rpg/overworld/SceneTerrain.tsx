// Interior scene renderer: floors, walls, exit mats, and interactable
// sprites, as SVG rects in tile space. Memoized per scene.

import { memo } from 'react';
import type { Scene } from '../../../data/scenes';
import { gridCols, pixelRects } from './pixels';
import { interiorSprites } from './npcSprites';

const DEFAULT_PALETTE = {
  wall: '#6b4a32',
  wallTop: '#4c3322',
  floorA: '#a97e55',
  floorB: '#9d744d',
  rug: '#7d3b3b',
};

function Glyph({
  spriteId,
  x,
  y,
}: {
  spriteId: string;
  x: number;
  y: number;
}) {
  const def = interiorSprites[spriteId];
  if (!def) return null;
  return (
    <svg x={x} y={y} width={1} height={1} viewBox={`0 0 ${gridCols(def.pixels)} ${def.pixels.length}`}>
      {pixelRects(def.pixels, def.palette)}
    </svg>
  );
}

export const SceneTerrain = memo(function SceneTerrain({ scene }: { scene: Scene }) {
  const palette = scene.palette ?? DEFAULT_PALETTE;
  const tiles = [];

  for (let y = 0; y < scene.rows.length; y++) {
    for (let x = 0; x < scene.rows[y].length; x++) {
      const ch = scene.rows[y][x];
      let fill: string;
      if (ch === '#') {
        // wall face where the room is below, wall top otherwise
        const below = scene.rows[y + 1]?.[x];
        fill = below && below !== '#' && below !== '_' ? palette.wall : palette.wallTop;
      } else if (ch === 'r') {
        fill = palette.rug;
      } else if (ch === '_') {
        fill = '#05060f';
      } else {
        fill = (x + y) % 2 === 0 ? palette.floorA : palette.floorB;
      }
      tiles.push(<rect key={`t${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={fill} />);
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
