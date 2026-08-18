import { useEffect, useState, type ReactElement } from 'react';
import { getScene } from '../../../data/scenes';
import { getScript, type DialogStep } from '../../../data/dialogs';
import { CHAR_MS, lineRevealed, type OverworldState } from './overworldReducer';
import { useOverworld } from './useOverworld';
import { WorldTerrain } from './WorldMap';
import { SceneTerrain } from './SceneTerrain';
import PlayerSprite from './PlayerSprite';
import LocationPrompt from './LocationPrompt';
import TouchControls from './TouchControls';
import DialogBox from '../ui/DialogBox';
import type { WindowContentProps } from '../ui/Window';
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

const WINDOWS: Record<string, React.ComponentType<WindowContentProps>> = {
  status: StatusSheet,
  quests: QuestLog,
  abilities: AbilityList,
  shop: ShopWindow,
  crafts: CraftsWindow,
  'travel-map': TravelMapWindow,
};

function windowFor(id: string, onClose: () => void): ReactElement | null {
  if (id.startsWith('materia:')) {
    return <MateriaList label={id.slice('materia:'.length)} onClose={onClose} />;
  }
  const Component = WINDOWS[id];
  return Component ? <Component onClose={onClose} /> : null;
}

/** Fade covers the screen at the swap point: 0 -> 1 fading out, 1 -> 0 fading in. */
function fadeOpacity(fade: OverworldState['fade']): number {
  if (!fade) return 0;
  const t = Math.min(fade.t, 1);
  return fade.phase === 'out' ? t : 1 - t;
}

/** Characters of the current dialog line to show, after the typewriter. */
function revealedChars(
  state: OverworldState,
  step: DialogStep | null,
  reducedMotion: boolean
): number {
  if (!state.dialog || step?.kind !== 'line') return 0;
  if (reducedMotion || state.dialog.revealAll || lineRevealed(state)) return step.text.length;
  return Math.floor((state.clock - state.dialog.openedAt) / CHAR_MS);
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

    setActive(document.getElementById('rpg-overworld')?.classList.contains('active') ?? false);

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

interface OverworldGameProps {
  speed: number;
  active: boolean;
  reducedMotion: boolean;
}

function OverworldGame({ speed, active, reducedMotion }: OverworldGameProps) {
  const [state, dispatch] = useOverworld({ speed, active });
  const scene = getScene(state.scene);
  const cols = scene.rows[0].length;
  const rows = scene.rows.length;

  // Interpolated render position in tile units.
  // Reduced motion: steps keep their normal timing but snap tile to tile.
  const stepT = reducedMotion || !state.stepping ? 1 : Math.min(state.progress, 1);
  const px = state.fromX + (state.x - state.fromX) * stepT;
  const py = state.fromY + (state.y - state.fromY) * stepT;

  // Water shimmer flips about twice a second (paused under reduced motion)
  const shimmer = reducedMotion ? 0 : Math.floor(state.clock / 600) % 2;

  const dialogStep = state.dialog ? getScript(state.dialog.scriptId)[state.dialog.step] : null;
  const revealed = revealedChars(state, dialogStep, reducedMotion);
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

        <div className="ow-fade" style={{ opacity: fadeOpacity(state.fade) }} aria-hidden="true" />
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
