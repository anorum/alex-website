import { useEffect, useRef, useState } from 'react';
import { worldCols, worldRows } from '../../../data/overworld';
import { useOverworld } from './useOverworld';
import { WorldTerrain } from './WorldMap';
import PlayerSprite from './PlayerSprite';
import LocationPrompt from './LocationPrompt';
import TouchControls from './TouchControls';
import './overworld.css';

function readParam(name: string): number | null {
  const v = new URLSearchParams(window.location.search).get(name);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function OverworldIsland() {
  // Initialized SSR-safe (pre-rendered at build time by client:visible),
  // then synced from browser state after hydration.
  const [active, setActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const seedRef = useRef(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedRef.current = readParam('rpg-seed') ?? (Date.now() >>> 0);
    setSpeed(Math.min(readParam('rpg-speed') ?? 1, 16));
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setReady(true);

    const isSectionActive = () =>
      document.getElementById('rpg-overworld')?.classList.contains('active') ?? false;
    setActive(isSectionActive());

    const onSectionChange = (e: Event) => {
      const detail = (e as CustomEvent<{ section?: string }>).detail;
      setActive(detail?.section === 'overworld');
    };
    document.addEventListener('rpg:section-change', onSectionChange);
    return () => document.removeEventListener('rpg:section-change', onSectionChange);
  }, []);

  if (!ready) return <div className="ow-loading">LOADING WORLD...</div>;

  return (
    <OverworldGame
      seed={seedRef.current}
      speed={speed}
      active={active}
      reducedMotion={reducedMotion}
    />
  );
}

function OverworldGame({
  seed,
  speed,
  active,
  reducedMotion,
}: {
  seed: number;
  speed: number;
  active: boolean;
  reducedMotion: boolean;
}) {
  const [state, dispatch] = useOverworld({ seed, speed, active });

  // Interpolated render position in tile units.
  // Reduced motion: steps keep their normal timing but snap tile to tile.
  const t = reducedMotion ? 1 : state.stepping ? state.progress : 1;
  const px = state.fromX + (state.x - state.fromX) * Math.min(t, 1);
  const py = state.fromY + (state.y - state.fromY) * Math.min(t, 1);

  // Water shimmer flips about twice a second (paused under reduced motion)
  const shimmer = reducedMotion ? 0 : Math.floor(state.clock / 600) % 2;

  return (
    <div className="ow" data-player-tile={`${state.x},${state.y}`}>
      <div className="ow-frame">
        <svg
          className="ow-svg"
          viewBox={`0 0 ${worldCols} ${worldRows.length}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label="Overworld map. Use arrow keys to walk between locations."
        >
          <WorldTerrain shimmer={shimmer} />
          <PlayerSprite px={px} py={py} facing={state.facing} stepFrame={state.stepping ? state.stepFrame : 0} />
        </svg>
        <LocationPrompt doorId={state.stepping ? null : state.atDoor} onEnter={() => dispatch({ type: 'INTERACT' })} />
      </div>

      <p className="ow-help" aria-hidden="true">
        ARROWS / WASD TO MOVE · ENTER TO ENTER · MENU FOR QUICK TRAVEL
      </p>

      <TouchControls
        onDown={(dir) => dispatch({ type: 'INPUT_DOWN', dir })}
        onUp={(dir) => dispatch({ type: 'INPUT_UP', dir })}
        onInteract={() => dispatch({ type: 'INTERACT' })}
      />
    </div>
  );
}
