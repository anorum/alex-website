import type { Boss } from '../../../data/battles';
import { useBattle } from './useBattle';
import StatusPanel from './StatusPanel';
import CommandMenu from './CommandMenu';
import { BossSprite, AlexSprite } from './Sprites';
import { VictoryPanel, DefeatPanel } from './ResultPanels';

interface BattleScreenProps {
  boss: Boss;
  seed: number;
  speed: number;
  active: boolean;
  muted: boolean;
  onToggleSound: () => void;
  onWin: (bossId: string) => void;
  onRetry: () => void;
  onExit: () => void;
}

export default function BattleScreen({
  boss,
  seed,
  speed,
  active,
  muted,
  onToggleSound,
  onWin,
  onRetry,
  onExit,
}: BattleScreenProps) {
  const [state, dispatch] = useBattle({ boss, seed, speed, active });

  const shaking = state.clock < state.shakeUntil;
  const flashing = state.clock < state.enemyFlashUntil;
  const enemyDead = state.enemy.hp <= 0;

  if (state.phase === 'victory') {
    return <VictoryPanel boss={boss} onWin={onWin} onExit={onExit} />;
  }
  if (state.phase === 'defeat') {
    return <DefeatPanel onRetry={onRetry} onExit={onExit} />;
  }

  return (
    <div data-testid="battle-screen">
      <div className={`rpgb-arena${shaking ? ' rpgb-shaking' : ''}`}>
        <div className={`rpgb-enemy${flashing ? ' rpgb-flashing' : ''}${enemyDead ? ' rpgb-dead' : ''}`}>
          <BossSprite spriteId={boss.spriteId} name={boss.name} />
        </div>
        <div className="rpgb-player">
          <AlexSprite />
        </div>
        {state.floaters.map((f) => (
          <div
            key={f.id}
            className={`rpgb-floater rpgb-floater-${f.target}${f.kind !== 'damage' ? ` rpgb-${f.kind}` : ''}`}
            style={{ marginLeft: `${((f.id % 5) - 2) * 9}px` }}
          >
            {f.text}
          </div>
        ))}
        <span className="sr-only" data-testid="enemy-hp">{state.enemy.hp}</span>
      </div>

      <div className="rpgb-window rpgb-message" aria-live="polite" data-testid="battle-message">
        {state.message || `${boss.name} — ${boss.era}`}
      </div>

      <div className="rpgb-bottom">
        <StatusPanel player={state.player} />
        <CommandMenu state={state} dispatch={dispatch} />
      </div>

      <div className="rpgb-hud-row">
        <span className="rpgb-keyhint">↑↓ SELECT · ENTER CONFIRM · ESC BACK</span>
        <span style={{ display: 'flex', gap: '0.4rem' }}>
          <button type="button" className="rpgb-sound-toggle" data-testid="sound-toggle" onClick={onToggleSound}>
            {muted ? '🔇 SOUND OFF' : '🔊 SOUND ON'}
          </button>
          <button type="button" className="rpgb-flee" data-testid="flee-button" onClick={onExit}>
            RUN AWAY
          </button>
        </span>
      </div>
    </div>
  );
}
