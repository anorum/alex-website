// Interior NPC and object sprites as 8x8 string grids, rendered with the
// shared pixelRects helper. No image assets.

export interface SpriteDef {
  pixels: string[];
  palette: Record<string, string>;
}

const outline = '#10122e';

/** Materia shelving, one variant per skill category orb color. */
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

  // Shopkeeper in an apron
  shopkeeper: {
    pixels: [
      '..HHHH..',
      '.HFFFFH.',
      '.HFEEFH.',
      '..GGGG..',
      '.FGAAGF.',
      '..GAAG..',
      '..A..A..',
      '..S..S..',
    ],
    palette: { H: '#4a3325', F: '#e8b88a', E: '#1f2937', G: '#6b4a32', A: '#e8e4d8', S: '#4a3325' },
  },

  // Stacked crates
  crate: {
    pixels: [
      '.CCCCCC.',
      '.C....C.',
      '.C.CC.C.',
      '.CCCCCC.',
      'CCCCCCCC',
      'C......C',
      'C..CC..C',
      'CCCCCCCC',
    ],
    palette: { C: '#8a6b3f' },
  },

  // Campfire with flames
  campfire: {
    pixels: [
      '...Y....',
      '..YOY...',
      '.YOOOY..',
      '.OORROO.',
      '..ORRO..',
      'LLLLLLLL',
      '.L.LL.L.',
      '........',
    ],
    palette: { Y: '#ffd23f', O: '#ff9d2f', R: '#ff5722', L: '#6b4a32' },
  },

  // Sitting log with a book on it
  log: {
    pixels: [
      '........',
      '......BB',
      '......BB',
      'LLLLLLLL',
      'LLLLLLLL',
      '.L....L.',
      '........',
      '........',
    ],
    palette: { L: '#8a6b3f', B: '#3a5bb3' },
  },

  // Ship captain, coat and cap
  captain: {
    pixels: [
      '..CCCC..',
      '.CCCCCC.',
      '.HFEEFH.',
      '..BBBB..',
      '.FBBBBF.',
      '..BBBB..',
      '..B..B..',
      '..S..S..',
    ],
    palette: { C: '#2a3f5e', H: '#4a3325', F: '#e8b88a', E: '#1f2937', B: '#2a3f5e', S: '#10122e' },
  },

  // Armored arena gatekeeper
  gatekeeper: {
    pixels: [
      '..MMMM..',
      '.MMMMMM.',
      '.MFEEFM.',
      '..AAAA..',
      '.MAAAAM.',
      '..AAAA..',
      '..A..A..',
      '..M..M..',
    ],
    palette: { M: '#8a8f98', F: '#e8b88a', E: '#1f2937', A: '#5f646e' },
  },

  // Framed sea chart on the wall
  chart: {
    pixels: [
      'FFFFFFFF',
      'FWWWWWWF',
      'FWGG.WWF',
      'FW.GGWWF',
      'FWW.G.WF',
      'FWWWWWWF',
      'FFFFFFFF',
      '...FF...',
    ],
    palette: { F: '#8a6b3f', W: '#c8e0e8', G: '#3f7d3a' },
  },
};
