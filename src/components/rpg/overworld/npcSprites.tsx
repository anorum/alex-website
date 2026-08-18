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

  // Cork quest board with pinned notes
  board: {
    pixels: [
      'FFFFFFFF',
      'FNNFWWFF',
      'FNNFWWFF',
      'FFFFFFFF',
      'FWWFNNFF',
      'FWWFNNFF',
      'FFFFFFFF',
      '.F....F.',
    ],
    palette: { F: '#8a6b3f', N: '#e8e4d8', W: '#ffd23f' },
  },

  // Guild receptionist in blue
  receptionist: {
    pixels: [
      '..HHHH..',
      '.HFFFFH.',
      '.HFEEFH.',
      '..BBBB..',
      '.FBBBBF.',
      '..BBBB..',
      'DDDDDDDD',
      'DDDDDDDD',
    ],
    palette: { H: '#3a2b1e', F: '#e8b88a', E: '#1f2937', B: '#3a5bb3', D: '#7a5233' },
  },

  // Lectern with an open book
  lectern: {
    pixels: [
      '.WWWWWW.',
      'WWWSSWWW',
      'WWWWWWWW',
      '..DDDD..',
      '...DD...',
      '...DD...',
      '..DDDD..',
      '.DDDDDD.',
    ],
    palette: { W: '#e8e4d8', S: '#4a3a6b', D: '#5b4a6b' },
  },

  // Crystal orb on a pedestal
  orb: {
    pixels: [
      '...OO...',
      '..OGGO..',
      '.OGGWGO.',
      '.OGGGGO.',
      '..OGGO..',
      '..PPPP..',
      '...PP...',
      '..PPPP..',
    ],
    palette: { O: '#10122e', G: '#7ec8ff', W: '#e8f6fa', P: '#5b4a6b' },
  },

  // Materia shelves, one per skill category
  shelfGreen: shelf('#00ff88'),
  shelfBlue: shelf('#4cc3ff'),
  shelfPurple: shelf('#c084fc'),
  shelfYellow: shelf('#ffd23f'),

  // Dojo master with a headband
  sensei: {
    pixels: [
      '..RRRR..',
      '.HFFFFH.',
      '.HFEEFH.',
      '..WWWW..',
      '.FWWWWF.',
      '..WWWW..',
      '..W..W..',
      '..S..S..',
    ],
    palette: { R: '#b33a3a', H: '#8a8f98', F: '#e8b88a', E: '#1f2937', W: '#e8e4d8', S: '#4a3325' },
  },
};

function shelf(orb: string): SpriteDef {
  return {
    pixels: [
      'DDDDDDDD',
      'D.M..M.D',
      'DDDDDDDD',
      'D.M..M.D',
      'DDDDDDDD',
      'D.M..M.D',
      'DDDDDDDD',
      '.D....D.',
    ],
    palette: { D: '#6b4a32', M: orb },
  };
}
