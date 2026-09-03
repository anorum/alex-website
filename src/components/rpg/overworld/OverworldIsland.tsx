import { useEffect, useState, type ReactElement } from 'react';
import { getScene } from '../../../data/scenes';
import type { Direction } from '../../../data/overworld';
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
import BattleView from '../battle/BattleView';
import type { BattleAction } from '../battle/types';
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

function windowFor(id: string, props: Omit<WindowContentProps, 'initialTab'>): ReactElement | null {
  if (id.startsWith('materia:')) {
    return <MateriaList label={id.slice('materia:'.length)} {...props} />;
  }
  const [base, tab] = id.split(':');
  const Component = WINDOWS[base];
  return Component ? <Component {...props} initialTab={tab} /> : null;
}

/** Touch D-pad in battle: same routing as the keyboard. */
function battleActionForDir(state: OverworldState, dir: Direction): BattleAction | null {
  const b = state.battle;
  if (!b) return null;
  const back = dir === 'up' || dir === 'left';
  if (b.phase === 'target') return { type: 'TARGET_MOVE', delta: back ? -1 : 1 };
  if (b.phase === 'select') return { type: 'MENU_MOVE', delta: back ? -1 : 1 };
  return null;
}

function battleConfirm(state: OverworldState): BattleAction | null {
  const b = state.battle;
  if (!b) return null;
  if (b.phase === 'target') return { type: 'TARGET_CONFIRM' };
  if (b.phase === 'select') return { type: 'MENU_CONFIRM' };
  if (b.phase === 'victory' || b.phase === 'defeat' || b.phase === 'fled') return { type: 'RESULT_CONTINUE' };
  return null;
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
  // Initialized SSR-safe (pre-rendered at build time by client:visible), then
  // read from the browser after hydration. The game only mounts once ready, so
  // its rAF loop never runs during the server render.
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSpeed(Math.min(readParam('rpg-speed') ?? 1, 16));
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setReady(true);
  }, []);

  if (!ready) return <div className="ow-loading">LOADING WORLD...</div>;

  return <OverworldGame speed={speed} reducedMotion={reducedMotion} />;
}

interface OverworldGameProps {
  speed: number;
  reducedMotion: boolean;
}

function OverworldGame({ speed, reducedMotion }: OverworldGameProps) {
  const [state, dispatch] = useOverworld({ speed });
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
  const inBattle = state.mode === 'battle' && !!state.battle;
  const overlayOpen = state.mode === 'dialog' || state.mode === 'window' || inBattle;
  const swirling = !!state.pendingBattle && !!state.fade && !reducedMotion;

  let helpText = `ARROWS / WASD TO MOVE · ENTER TO INTERACT · E: ENCOUNTERS ${state.save.encounters ? 'ON' : 'OFF'}`;
  if (inBattle) helpText = 'ARROWS SELECT · ENTER CONFIRM · ESC BACK';
  else if (overlayOpen) helpText = 'ENTER TO CONTINUE · ESC TO CLOSE';

  return (
    <div className="ow" data-player-tile={`${state.x},${state.y}`} data-scene={state.scene}>
      <div
        className={`ow-frame${inBattle ? ' ow-in-battle' : ''}`}
        style={inBattle ? undefined : { aspectRatio: `${cols} / ${rows}`, width: `min(100%, calc(72vh * ${cols} / ${rows}))` }}
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

        {state.window && windowFor(state.window, { onClose: () => dispatch({ type: 'CLOSE_WINDOW' }), save: state.save, dispatch })}

        {inBattle && state.battle && (
          <BattleView state={state.battle} dispatch={(a) => dispatch({ type: 'BATTLE', action: a })} />
        )}

        <div
          className={`ow-fade${swirling ? ' ow-swirl' : ''}`}
          style={swirling ? ({ '--swirl': Math.min(state.fade!.t, 1) } as React.CSSProperties) : { opacity: fadeOpacity(state.fade) }}
          aria-hidden="true"
        />
      </div>

      <p className="ow-help" aria-hidden="true">{helpText}</p>

      <TouchControls
        onDown={(dir) => {
          if (inBattle) {
            const a = battleActionForDir(state, dir);
            if (a) dispatch({ type: 'BATTLE', action: a });
            return;
          }
          dispatch({ type: 'INPUT_DOWN', dir });
        }}
        onUp={(dir) => { if (!inBattle) dispatch({ type: 'INPUT_UP', dir }); }}
        onInteract={() => {
          if (inBattle) {
            const a = battleConfirm(state);
            if (a) dispatch({ type: 'BATTLE', action: a });
            return;
          }
          dispatch({ type: 'INTERACT' });
        }}
        onCancel={() => {
          if (inBattle) dispatch({ type: 'BATTLE', action: { type: 'MENU_CANCEL' } });
          else if (state.mode === 'window') dispatch({ type: 'CLOSE_WINDOW' });
          else if (state.mode === 'dialog') dispatch({ type: 'DIALOG_CANCEL' });
        }}
        showCancel={overlayOpen}
      />
    </div>
  );
}
