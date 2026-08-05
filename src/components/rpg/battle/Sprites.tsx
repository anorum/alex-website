// Original pixel-art sprites rendered as SVG rect grids. No copyrighted assets.

interface PixelGridProps {
  pixels: string[];
  palette: Record<string, string>;
  className?: string;
  title: string;
}

function PixelGrid({ pixels, palette, className, title }: PixelGridProps) {
  const rows = pixels.length;
  const cols = Math.max(...pixels.map((r) => r.length));
  const rects = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const color = palette[pixels[y][x]];
      if (color) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={color} />);
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
    >
      {rects}
    </svg>
  );
}

const titanPixels = [
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
];

const hydraPixels = [
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
];

const monolithPixels = [
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
];

const agentPixels = [
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
];

const alexPixels = [
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
];

const outline = '#10122e';

const spriteDefs = {
  titan: {
    pixels: titanPixels,
    palette: { O: outline, S: '#8a93a6', D: '#454e60', R: '#ff4444', G: '#39ff6a', Y: '#ffd23f' },
  },
  hydra: {
    pixels: hydraPixels,
    palette: { O: outline, N: '#e8c84a', R: '#ff4444', D: '#9a7d1e' },
  },
  monolith: {
    pixels: monolithPixels,
    palette: { O: '#05060f', D: '#3a3f4a', C: '#ff7a3c' },
  },
  agent: {
    pixels: agentPixels,
    palette: { O: outline, P: '#a06bff', C: '#42f5e3' },
  },
} as const;

export type SpriteId = keyof typeof spriteDefs;

export function BossSprite({ spriteId, name, className }: { spriteId: SpriteId; name: string; className?: string }) {
  const def = spriteDefs[spriteId];
  return <PixelGrid pixels={[...def.pixels]} palette={def.palette} className={className} title={name} />;
}

export function AlexSprite({ className }: { className?: string }) {
  return (
    <PixelGrid
      pixels={alexPixels}
      palette={{ O: outline, H: '#7a4f2b', F: '#e8b88a', E: '#1f2937', G: '#0d8a5f', B: '#2b3a55', S: '#4a3325' }}
      className={className}
      title="Alex"
    />
  );
}
