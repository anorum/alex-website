// Interior NPC and object sprites as 8x8 string grids, rendered with the
// shared pixelRects helper. No image assets.

export interface SpriteDef {
  pixels: string[];
  palette: Record<string, string>;
}

const outline = '#10122e';

export const interiorSprites: Record<string, SpriteDef> = {
  // A curly labradoodle, seated, facing the room
  mara: {
    pixels: [
      '.CC..CC.',
      'CCCCCCCC',
      'CCECCECC',
      'CCCNNCCC',
      '.CCCCCC.',
      '.CCCCCC.',
      'CCC..CCC',
      'CC....CC',
    ],
    palette: { C: '#c9a36a', E: outline, N: '#4a3325' },
  },

  // Wall mirror with a glint
  mirror: {
    pixels: [
      '.OOOOOO.',
      'OGGGGGGO',
      'OGWGGGGO',
      'OGGWGGGO',
      'OGGGGGGO',
      'OGGGGGGO',
      '.OOOOOO.',
      '...OO...',
    ],
    palette: { O: '#6b5b3f', G: '#9ecfdf', W: '#e8f6fa' },
  },

  // Desk with sheet music and a small screen
  desk: {
    pixels: [
      '........',
      '.SS..MM.',
      '.SS..MM.',
      'DDDDDDDD',
      'DDDDDDDD',
      '.D....D.',
      '.D....D.',
      '.D....D.',
    ],
    palette: { D: '#7a5233', S: '#e8e4d8', M: '#3a5bb3' },
  },
};
