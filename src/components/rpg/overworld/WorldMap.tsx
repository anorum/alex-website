// Terrain + buildings for the overworld, rendered as SVG rects in tile space.
// Same string-grid pixel-art technique as the battle sprites - no image assets.

import { memo } from 'react';
import { gridCols, pixelRects } from './pixels';
import {
  worldRows,
  worldCols,
  worldLocations,
  type BuildingKind,
} from '../../../data/overworld';

const TERRAIN_FILL: Record<string, [string, string]> = {
  // [even, odd] checker shades
  g: ['#3f7d3a', '#468a40'],
  s: ['#d8c078', '#cfb76e'],
  w: ['#1e4e9c', '#1e4e9c'],
  t: ['#3f7d3a', '#468a40'], // grass under the tree glyph
  m: ['#7d7a72', '#736f68'],
};

/** Renders a string grid into a w x h tile box at tile (x, y) */
function Glyph({
  pixels,
  palette,
  x,
  y,
  w,
  h,
}: {
  pixels: string[];
  palette: Record<string, string>;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${gridCols(pixels)} ${pixels.length}`}>
      {pixelRects(pixels, palette)}
    </svg>
  );
}

const treePixels = ['..LL..', '.LLLL.', 'LLLLLL', '.LLLL.', '..TT..', '..TT..'];
const treePalette = { L: '#1e4d1e', T: '#6b4226' };

const mountainCapPixels = ['...CC...', '..CCCC..', '.C.CC.C.'];
const mountainCapPalette = { C: '#a5a29a' };

const buildingArt: Record<BuildingKind, { pixels: string[]; palette: Record<string, string> }> = {
  house: {
    pixels: [
      '..RRRR..',
      '.RRRRRR.',
      'RRRRRRRR',
      'WWWWWWWW',
      'WYYWWYYW',
      'WWWDDWWW',
      'WWWDDWWW',
      'WWWDDWWW',
    ],
    palette: { R: '#b33a3a', W: '#e8dcc0', Y: '#7ec8ff', D: '#5b3a24' },
  },
  hall: {
    pixels: [
      '...F....',
      '.BBBBBB.',
      'BBBBBBBB',
      'WWWWWWWW',
      'WYYWWYYW',
      'WWWDDWWW',
      'WWWDDWWW',
      'WWWDDWWW',
    ],
    palette: { B: '#3a5bb3', F: '#ffd23f', W: '#e8dcc0', Y: '#7ec8ff', D: '#5b3a24' },
  },
  tower: {
    pixels: [
      '..PPPP..',
      '.PPPPPP.',
      '.PPYYPP.',
      '.PPPPPP.',
      '.PPPPPP.',
      '.PPYYPP.',
      '..PDDP..',
      '..PDDP..',
    ],
    palette: { P: '#7a4fb3', Y: '#ffd97e', D: '#3a2359' },
  },
  dojo: {
    pixels: [
      '.GGGGGG.',
      'GGGGGGGG',
      'WWWWWWWW',
      'WRWWWWRW',
      'WWWWWWWW',
      'WWWDDWWW',
      'WWWDDWWW',
      'WWWDDWWW',
    ],
    palette: { G: '#2e7d4f', W: '#e8dcc0', R: '#b33a3a', D: '#5b3a24' },
  },
  shop: {
    pixels: [
      '.YYYYYY.',
      'YWYWYWYW',
      'WWWWWWWW',
      'WYYWWYYW',
      'WWWWWWWW',
      'WWWDDWWW',
      'WWWDDWWW',
      'WWWDDWWW',
    ],
    palette: { Y: '#d9a53a', W: '#e8dcc0', D: '#5b3a24' },
  },
  arena: {
    pixels: [
      'S.S..S.S',
      'SSSSSSSS',
      'SSSSSSSS',
      'SDDSSDDS',
      'SSSSSSSS',
      'SSSDDSSS',
      'SSDDDDSS',
      'SSDDDDSS',
    ],
    palette: { S: '#8a8f98', D: '#2b2f38' },
  },
  camp: {
    pixels: [
      '........',
      '...TT...',
      '..TTTT..',
      '.TTTTTT.',
      'TTTTTTTT',
      'TTTDDTTT',
      'TTTDDTTT',
      'F......F',
    ],
    palette: { T: '#cc7a3a', D: '#7a4520', F: '#ffd23f' },
  },
  harbor: {
    pixels: [
      '.M......',
      '.MM.....',
      '.M..HH..',
      'HHHHHH..',
      '.HHHH...',
      'DDDDDDDD',
      'DDDDDDDD',
      'D.D..D.D',
    ],
    palette: { M: '#d8d3c0', H: '#7a4a2b', D: '#9a6b3f' },
  },
};

interface WorldTerrainProps {
  /** 0 | 1 - flips the water shimmer checker */
  shimmer: number;
}

/** Static terrain + buildings + door markers. Memoized on the shimmer frame only. */
export const WorldTerrain = memo(function WorldTerrain({ shimmer }: WorldTerrainProps) {
  const tiles = [];
  const glyphs = [];

  for (let y = 0; y < worldRows.length; y++) {
    for (let x = 0; x < worldCols; x++) {
      const ch = worldRows[y][x];
      const fills = TERRAIN_FILL[ch];
      if (!fills) continue;
      let fill = fills[(x + y) % 2];
      if (ch === 'w') {
        fill = (x + y + shimmer) % 2 === 0 ? '#1e4e9c' : '#2a62b8';
      }
      tiles.push(<rect key={`t${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={fill} />);
      if (ch === 't') {
        glyphs.push(
          <Glyph key={`g${x}-${y}`} pixels={treePixels} palette={treePalette} x={x} y={y} w={1} h={1} />
        );
      } else if (ch === 'm' && y > 0 && worldRows[y - 1][x] !== 'm') {
        glyphs.push(
          <Glyph
            key={`g${x}-${y}`}
            pixels={mountainCapPixels}
            palette={mountainCapPalette}
            x={x}
            y={y}
            w={1}
            h={0.375}
          />
        );
      }
    }
  }

  const doors = worldLocations.map((loc) => (
    <rect
      key={`d${loc.id}`}
      x={loc.door.x + 0.15}
      y={loc.door.y + 0.15}
      width="0.72"
      height="0.72"
      fill="none"
      stroke="#ffd23f"
      strokeWidth="0.08"
      strokeDasharray="0.2 0.14"
      opacity="0.85"
    />
  ));

  const buildings = worldLocations.map((loc) => (
    <Glyph
      key={`b${loc.id}`}
      pixels={buildingArt[loc.kind].pixels}
      palette={buildingArt[loc.kind].palette}
      x={loc.at.x}
      y={loc.at.y}
      w={2}
      h={2}
    />
  ));

  return (
    <g>
      {tiles}
      {glyphs}
      {doors}
      {buildings}
    </g>
  );
});
