// The walkable hero, drawn per facing with two walk frames.
// String-grid pixel art, same technique as the battle sprites.

import type { Direction } from '../../../data/overworld';

const palette = {
  O: '#10122e', // outline
  H: '#7a4f2b', // hair
  F: '#e8b88a', // skin
  E: '#1f2937', // eyes
  G: '#0d8a5f', // shirt (site accent green)
  B: '#2b3a55', // pants
  S: '#4a3325', // shoes
};

const frames: Record<'down' | 'up' | 'left', [string[], string[]]> = {
  down: [
    [
      '..HHHH..',
      '.HFFFFH.',
      '.HFEEFH.',
      '..GGGG..',
      '.FGGGGF.',
      '..GGGG..',
      '..B..B..',
      '..S..S..',
    ],
    [
      '..HHHH..',
      '.HFFFFH.',
      '.HFEEFH.',
      '..GGGG..',
      '.FGGGGF.',
      '..GGGG..',
      '.B....B.',
      '.S....S.',
    ],
  ],
  up: [
    [
      '..HHHH..',
      '.HHHHHH.',
      '.HHHHHH.',
      '..GGGG..',
      '.FGGGGF.',
      '..GGGG..',
      '..B..B..',
      '..S..S..',
    ],
    [
      '..HHHH..',
      '.HHHHHH.',
      '.HHHHHH.',
      '..GGGG..',
      '.FGGGGF.',
      '..GGGG..',
      '.B....B.',
      '.S....S.',
    ],
  ],
  left: [
    [
      '..HHHH..',
      '.HHFFF..',
      '.HHEFF..',
      '..GGGG..',
      '..GGGGF.',
      '..GGGG..',
      '..B.B...',
      '..S.S...',
    ],
    [
      '..HHHH..',
      '.HHFFF..',
      '.HHEFF..',
      '..GGGG..',
      '..GGGGF.',
      '..GGGG..',
      '.B...B..',
      '.S...S..',
    ],
  ],
};

interface PlayerSpriteProps {
  /** render position in tile units */
  px: number;
  py: number;
  facing: Direction;
  stepFrame: 0 | 1;
}

export default function PlayerSprite({ px, py, facing, stepFrame }: PlayerSpriteProps) {
  const key = facing === 'right' ? 'left' : facing;
  const pixels = frames[key][stepFrame];
  const rects = [];
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const color = palette[pixels[y][x] as keyof typeof palette];
      if (color) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={color} />);
      }
    }
  }
  return (
    <svg x={px} y={py - 0.2} width={1} height={1.2} viewBox="0 0 8 8" aria-label="Alex">
      <g transform={facing === 'right' ? 'translate(8 0) scale(-1 1)' : undefined}>{rects}</g>
    </svg>
  );
}
