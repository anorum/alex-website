// Original pixel-art sprites for every combatant, rendered as SVG rect
// grids. No copyrighted assets. Bosses are 16 wide, mobs 12 wide.

import { gridCols, pixelRects } from '../overworld/pixels';
import { interiorSprites } from '../overworld/interiorSprites';

interface SpriteDef {
  pixels: string[];
  palette: Record<string, string>;
}

const O = '#10122e';

const enemySprites: Record<string, SpriteDef> = {
  titan: {
    pixels: [
      '....OOOOOOOO....',
      '...OSSSSSSSSO...',
      '..OSDDDDDDDDSO..',
      '..OSDRDDDDRDSO..',
      '..OSDDDDDDDDSO..',
      '..OSSGSSSSGSSO..',
      '..OSDDDDDDDDSO..',
      '..OSSYSSSSYSSO..',
      '..OSDDDDDDDDSO..',
      '..OSSGSSGSSGSO..',
      '..OSDDDDDDDDSO..',
      '...OSSSSSSSSO...',
      '..OSSO....OSSO..',
      '..OSO......OSO..',
      '..OO........OO..',
    ],
    palette: { O, S: '#8a93a6', D: '#454e60', R: '#ff4444', G: '#39ff6a', Y: '#ffd23f' },
  },
  hydra: {
    pixels: [
      '.OO.....OO.....OO.',
      'ONNO...ONNO...ONNO',
      'ONRNO..ONRNO..ONRNO',
      '.ONNO...ONNO...ONNO',
      '..ONN...ONN...ONN.',
      '...ONN..ONN..ONN..',
      '....ONNONNONNN....',
      '.....ONNNNNNO.....',
      '....ONNNNNNNNO....',
      '...ONNNNNNNNNNO...',
      '...ONNDDNNDDNNO...',
      '....ONNNNNNNNO....',
      '.....OONNNNOO.....',
      '.......OOOO.......',
    ],
    palette: { O, N: '#e8c84a', R: '#ff4444', D: '#9a7d1e' },
  },
  monolith: {
    pixels: [
      '....OOOOOOOO....',
      '...ODDDDDDDDO...',
      '...ODDCDDDDDO...',
      '...ODDCDDDDDO...',
      '...ODCCDDDCDO...',
      '...ODDCDDDCDO...',
      '...ODDCDDCCDO...',
      '...ODDDCDCDDO...',
      '...ODDDCCDDDO...',
      '...ODDDDCDDDO...',
      '...ODDDDCDDDO...',
      '...ODDDDDDDDO...',
      '..ODDDDDDDDDDO..',
      '.OODDDDDDDDDDOO.',
    ],
    palette: { O: '#05060f', D: '#3a3f4a', C: '#ff7a3c' },
  },
  agent: {
    pixels: [
      '....OOOOOOOO....',
      '..OOPPPPPPPPOO..',
      '.OPPPPPPPPPPPPO.',
      '.OPCCPPPPPPCCPO.',
      '.OPCCPPPPPPCCPO.',
      '.OPPPPPPPPPPPPO.',
      '.OPPPCCCCCCPPPO.',
      '..OPPPPPPPPPPO..',
      '...OPP.OO.PPO...',
      '..OPP..PP..PPO..',
      '.OP..OPPPPO..PO.',
      '....OP....PO....',
    ],
    palette: { O, P: '#a06bff', C: '#42f5e3' },
  },
  flaky: {
    pixels: [
      '....OOOO....',
      '..OOYYYYOO..',
      '.OYYYYYYYYO.',
      '.OYYOYYOYYO.',
      '.OYYYYYYYYO.',
      '..OYYOOYYO..',
      '...OYYYYO...',
      '..OYYOOYYO..',
      '.OYYO..OYYO.',
      '.OYO....OYO.',
      '..O......O..',
    ],
    palette: { O, Y: '#ffd23f' },
  },
  nullptr: {
    pixels: [
      '....OOOO....',
      '..OODDDDOO..',
      '.ODDDDDDDDO.',
      '.ODWDDDDWDO.',
      '.ODDDDDDDDO.',
      '.ODDDWWDDDO.',
      '.ODDDDDDDDO.',
      '..ODDDDDDO..',
      '...ODDDDO...',
      '..OD.OO.DO..',
      '.OD......DO.',
      '.O........O.',
    ],
    palette: { O, D: '#1b1b2f', W: '#e8f6fa' },
  },
  cache: {
    pixels: [
      'OOOOOOOOOOOO',
      'OGGGGGGGGGGO',
      'OGWGGGGGGWGO',
      'OGGGGGGGGGGO',
      'OGGGGOOGGGGO',
      'OGGGOGGOGGGO',
      'OGGGGOOGGGGO',
      'OGGGGGGGGGGO',
      'OGCGGGGGGCGO',
      'OGGGGGGGGGGO',
      'OOOOOOOOOOOO',
    ],
    palette: { O, G: '#8a8f98', W: '#e8e4d8', C: '#c9a36a' },
  },
  offbyone: {
    pixels: [
      '.....OO.....',
      '....OYYO....',
      '...OYYYYO...',
      '..OYYOYYYO..',
      '..OYYYYYYO..',
      '...OYYYYO...',
      '....OYYO....',
      '....OYYO....',
      '....OYYO....',
      '....OYYO....',
      '..OOYYYYOO..',
      '..OOOOOOOO..',
    ],
    palette: { O, Y: '#ff9d2f' },
  },
  lake: {
    pixels: [
      '....OOOO....',
      '..OOBBBBOO..',
      '.OBBBBBBBBO.',
      '.OBWBBBBWBO.',
      '.OBBBBBBBBO.',
      '.OBBBBBBBBO.',
      'OBBBOBBOBBBO',
      'OBBOBBBBOBBO',
      'OBOBBBBBBOBO',
      '.OOOOOOOOOO.',
    ],
    palette: { O, B: '#2f7d5a', W: '#e8f6fa' },
  },
  spaghetti: {
    pixels: [
      '..O.OO.O..O.',
      '.ONONNONOONO',
      'ONNONONNONNO',
      '.ONNNNONNNO.',
      '..ONONNONO..',
      '.ONNNNNNNNO.',
      'ONNONNNNONNO',
      '.ONNNONONNO.',
      '..ONNNNNNO..',
      '.ONONONONONO',
      '.O.O.O.O.O.O',
    ],
    palette: { O, N: '#e8b24a' },
  },
  merge: {
    pixels: [
      'OO........OO',
      'OROO....OOBO',
      '.OROO..OOBO.',
      '..OROOOOBO..',
      '...OROOBO...',
      '....OWWO....',
      '....OWWO....',
      '...OBOORO...',
      '..OBOO.OORO.',
      '.OBO....ORO.',
      'OBO......ORO',
      'OO........OO',
    ],
    palette: { O, R: '#ff6666', B: '#4cc3ff', W: '#e8f6fa' },
  },
  deadlink: {
    pixels: [
      '..OOO..OOO..',
      '.OGGGOOGGGO.',
      '.OG.OGGO.GO.',
      '.OG.O..O.GO.',
      '.OGGO..OGGO.',
      '..OOO..OOO..',
      '.....OO.....',
      '....OWWO....',
      '....OWWO....',
      '...OOWWOO...',
      '...OWWWWO...',
      '....OOOO....',
    ],
    palette: { O, G: '#8a8f98', W: '#c084fc' },
  },
  timeout: {
    pixels: [
      'OOOOOOOOOOOO',
      '.OSSSSSSSSO.',
      '..OSSSSSSO..',
      '...OSSSSO...',
      '....OSSO....',
      '.....OO.....',
      '....O..O....',
      '...O.SS.O...',
      '..O.SSSS.O..',
      '.O.SSSSSS.O.',
      '.OSSSSSSSSO.',
      'OOOOOOOOOOOO',
    ],
    palette: { O, S: '#e8c84a' },
  },
  cron: {
    pixels: [
      '....OOOO....',
      '..OOWWWWOO..',
      '.OWWWWWWWWO.',
      '.OWRWWWWRWO.',
      'OWWWWWOWWWWO',
      'OWWWWWOWWWWO',
      'OWWWOOOWWWWO',
      'OWWWWWWWWWWO',
      '.OWWRRRRWWO.',
      '.OWWWWWWWWO.',
      '..OOWWWWOO..',
      '....OOOO....',
    ],
    palette: { O, W: '#e8e4d8', R: '#ff4444' },
  },
  race: {
    pixels: [
      '.....OOO....',
      '....OYYO....',
      '...OYYO.....',
      '..OYYO..OOO.',
      '.OYYYYOOYYO.',
      '..OOYYYYYO..',
      '....OYYO....',
      '...OYYO.....',
      '..OYYO..OO..',
      '.OYYYYOOYYO.',
      '..OOOYYYYO..',
      '.....OOOO...',
    ],
    palette: { O, Y: '#4cc3ff' },
  },
  incident: {
    pixels: [
      '.....OO.....',
      '....ORRO....',
      '...ORRRRO...',
      '..ORRWWRRO..',
      '..ORRWWRRO..',
      '.ORRRRRRRRO.',
      '.ORRRRRRRRO.',
      'OOOOOOOOOOOO',
      'ODDDDDDDDDDO',
      'ODDWDDDDWDDO',
      'ODDDDDDDDDDO',
      'OOOOOOOOOOOO',
    ],
    palette: { O, R: '#ff4444', W: '#fff4c2', D: '#3a3f4a' },
  },
};

const alexBattle: SpriteDef = {
  pixels: [
    '.....OOOO.....',
    '....OHHHHO....',
    '...OHHHHHHO...',
    '...OHFFFFHO...',
    '...OFEFFEFO...',
    '....OFFFFO....',
    '.....OFFO.....',
    '....OGGGGO....',
    '...OGGGGGGO...',
    '..OFGGGGGGFO..',
    '..OFOGGGGOFO..',
    '....OBBBBO....',
    '....OBOOBO....',
    '....OB..BO....',
    '...OSS..SSO...',
  ],
  palette: { O, H: '#7a4f2b', F: '#e8b88a', E: '#1f2937', G: '#0d8a5f', B: '#2b3a55', S: '#4a3325' },
};

function Grid({ def, title, className }: { def: SpriteDef; title: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${gridCols(def.pixels)} ${def.pixels.length}`}
      className={className}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
    >
      {pixelRects(def.pixels, def.palette)}
    </svg>
  );
}

export function EnemySprite({ spriteId, name, className }: { spriteId: string; name: string; className?: string }) {
  return <Grid def={enemySprites[spriteId] ?? enemySprites.flaky} title={name} className={className} />;
}

export function PartySprite({ id, className }: { id: 'alex' | 'mara'; className?: string }) {
  const def = id === 'alex' ? alexBattle : interiorSprites.mara;
  return <Grid def={def} title={id === 'alex' ? 'Alex' : 'Mara'} className={className} />;
}
