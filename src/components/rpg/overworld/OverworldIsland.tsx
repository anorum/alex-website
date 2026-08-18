import { useEffect, useState } from 'react';
import { getScene } from '../../../data/scenes';
import { getScript } from '../../../data/dialogs';
import { CHAR_MS, lineRevealed } from './overworldReducer';
import { useOverworld } from './useOverworld';
import { WorldTerrain } from './WorldMap';
import { SceneTerrain } from './SceneTerrain';
import PlayerSprite from './PlayerSprite';
import LocationPrompt from './LocationPrompt';
import TouchControls from './TouchControls';
import DialogBox from '../ui/DialogBox';
import StatusSheet from '../windows/StatusSheet';
import QuestLog from '../windows/QuestLog';
import AbilityList from '../windows/AbilityList';
import MateriaList from '../windows/MateriaList';
import ShopWindow from '../windows/ShopWindow';
import CraftsWindow from '../windows/CraftsWindow';
import TravelMapWindow from '../windows/TravelMapWindow';
import './overworld.css';

function readParam(name: string): number | null {
  const v = new URLSearchParams(window.location.search).get(name);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const WINDOWS: Record<string, React.ComponentType<{ onClose: () => void }>> = {
  status: StatusSheet,
  quests: QuestLog,
  abilities: AbilityList,
  shop: ShopWindow,
  crafts: CraftsWindow,
  'travel-map': TravelMapWindow,
};

function windowFor(id: string, onClose: () => void) {
  if (id.startsWith('materia:')) {
    return <MateriaList label={id.slice('materia:'.length)} onClose={onClose} />;
  }
  const Component = WINDOWS[id];
  return Component ? <Component onClose={onClose} /> : null;
}

export default function OverworldIsland() {
  // Initialized SSR-safe (pre-rendered at build time by client:visible),
  // then synced from browser state after hydration.
  const [active, setActive] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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

  return <OverworldGame speed={speed} active={active} reducedMotion={reducedMotion} />;
}

function OverworldGame({
  speed,
  active,
  reducedMotion,
}: {
  speed: number;
  active: boolean;
  reducedMotion: boolean;
}) {
  const [state, dispatch] = useOverworld({ speed, active });
  const scene = getScene(state.scene);
  const cols = scene.rows[0].length;
  const rows = scene.rows.length;

  // Interpolated render position in tile units.
  // Reduced motion: steps keep their normal timing but snap tile to tile.
  const t = reducedMotion ? 1 : state.stepping ? state.progress : 1;
  const px = state.fromX + (state.x - state.fromX) * Math.min(t, 1);
  const py = state.fromY + (state.y - state.fromY) * Math.min(t, 1);

  // Water shimmer flips about twice a second (paused under reduced motion)
  const shimmer = reducedMotion ? 0 : Math.floor(state.clock / 600) % 2;

  // Fade overlay opacity
  const fadeOpacity = state.fade
    ? state.fade.phase === 'out'
      ? Math.min(state.fade.t, 1)
      : 1 - Math.min(state.fade.t, 1)
    : 0;

  // Dialog step + typewriter reveal
  const dialogStep = state.dialog ? getScript(state.dialog.scriptId)[state.dialog.step] : null;
  let revealed = 0;
  if (state.dialog && dialogStep?.kind === 'line') {
    revealed =
      reducedMotion || state.dialog.revealAll || lineRevealed(state)
        ? dialogStep.text.length
        : Math.floor((state.clock - state.dialog.openedAt) / CHAR_MS);
  }

  const overlayOpen = state.mode === 'dialog' || state.mode === 'window';

  return (
    <div className="ow" data-player-tile={`${state.x},${state.y}`} data-scene={state.scene}>
      <div
        className="ow-frame"
        style={{ aspectRatio: `${cols} / ${rows}`, width: `min(100%, calc(72vh * ${cols} / ${rows}))` }}
      >
        {state.scene !== 'world' && <div className="ow-scene-name">{scene.name}</div>}
        <svg
          className="ow-svg"
          viewBox={`0 0 ${cols} ${rows}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label={`${scene.name}. Use arrow keys to walk; Enter to interact.`}
        >
          {state.scene === 'world' ? (
            <WorldTerrain shimmer={shimmer} />
          ) : (
            <SceneTerrain scene={scene} />
          )}
          <PlayerSprite px={px} py={py} facing={state.facing} stepFrame={state.stepping ? state.stepFrame : 0} />
        </svg>

        {!overlayOpen && !state.fade && (
          <LocationPrompt prompt={state.stepping ? null : state.prompt} onEnter={() => dispatch({ type: 'INTERACT' })} />
        )}

        {state.mode === 'dialog' && dialogStep && (
          <DialogBox
            step={dialogStep}
            revealed={revealed}
            choiceIndex={state.dialog?.choiceIndex ?? 0}
            onAdvance={() => dispatch({ type: 'INTERACT' })}
            onChoose={(i) => {
              const current = state.dialog?.choiceIndex ?? 0;
              if (i !== current) dispatch({ type: 'DIALOG_NAV', delta: i - current });
              dispatch({ type: 'INTERACT' });
            }}
          />
        )}

        {state.window && windowFor(state.window, () => dispatch({ type: 'CLOSE_WINDOW' }))}

        <div className="ow-fade" style={{ opacity: fadeOpacity }} aria-hidden="true" />
      </div>

      <p className="ow-help" aria-hidden="true">
        {overlayOpen
          ? 'ENTER TO CONTINUE · ESC TO CLOSE'
          : 'ARROWS / WASD TO MOVE · ENTER TO INTERACT · MENU FOR QUICK TRAVEL'}
      </p>

      <TouchControls
        onDown={(dir) => dispatch({ type: 'INPUT_DOWN', dir })}
        onUp={(dir) => dispatch({ type: 'INPUT_UP', dir })}
        onInteract={() => dispatch({ type: 'INTERACT' })}
        onCancel={() => {
          if (state.mode === 'window') dispatch({ type: 'CLOSE_WINDOW' });
          else if (state.mode === 'dialog') dispatch({ type: 'DIALOG_CANCEL' });
        }}
        showCancel={overlayOpen}
      />
    </div>
  );
}
