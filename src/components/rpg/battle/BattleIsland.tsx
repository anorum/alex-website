import { useCallback, useEffect, useRef, useState } from 'react';
import { getBossById } from './battleReducer';
import EncounterSelect from './EncounterSelect';
import BattleScreen from './BattleScreen';
import { isMuted, setMuted, playConfirm } from '../../../utils/rpg-audio';

const WINS_KEY = 'rpg-battles-won';

function readParam(name: string): number | null {
  const v = new URLSearchParams(window.location.search).get(name);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

interface ActiveBattle {
  bossId: string;
  attempt: number;
  seed: number;
}

export default function BattleIsland() {
  // Initialized SSR-safe (this island is pre-rendered at build time by client:visible),
  // then synced from browser state after hydration.
  const [wins, setWins] = useState<string[]>([]);
  const [muted, setMutedUi] = useState(true);
  const [active, setActive] = useState(false);
  const [battle, setBattle] = useState<ActiveBattle | null>(null);
  const seedRef = useRef(0);
  const speedRef = useRef(1);

  useEffect(() => {
    try {
      setWins(JSON.parse(localStorage.getItem(WINS_KEY) || '[]'));
    } catch {
      setWins([]);
    }
    setMutedUi(isMuted());
    seedRef.current = readParam('rpg-seed') ?? (Date.now() >>> 0);
    speedRef.current = Math.min(readParam('rpg-speed') ?? 1, 16);

    const isSectionActive = () =>
      document.getElementById('rpg-battle')?.classList.contains('active') ?? false;
    setActive(isSectionActive());

    const onSectionChange = (e: Event) => {
      const detail = (e as CustomEvent<{ section?: string }>).detail;
      setActive(detail?.section === 'battle');
    };
    document.addEventListener('rpg:section-change', onSectionChange);
    return () => document.removeEventListener('rpg:section-change', onSectionChange);
  }, []);

  const handleWin = useCallback((bossId: string) => {
    setWins((prev) => {
      if (prev.includes(bossId)) return prev;
      const next = [...prev, bossId];
      try {
        localStorage.setItem(WINS_KEY, JSON.stringify(next));
      } catch {
        // private mode etc. - wins just don't persist
      }
      return next;
    });
  }, []);

  const startBattle = useCallback((bossId: string) => {
    seedRef.current = (seedRef.current + 1) >>> 0;
    setBattle({ bossId, attempt: 1, seed: seedRef.current });
  }, []);

  const toggleSound = useCallback(() => {
    setMutedUi((m) => {
      setMuted(!m);
      if (m) playConfirm(); // audible feedback when unmuting
      return !m;
    });
  }, []);

  const boss = battle ? getBossById(battle.bossId) : undefined;

  return (
    <div className="rpgb-island" data-testid="battle-island">
      {battle && boss ? (
        <BattleScreen
          key={`${battle.bossId}-${battle.attempt}`}
          boss={boss}
          seed={battle.seed + battle.attempt}
          speed={speedRef.current}
          active={active}
          muted={muted}
          onToggleSound={toggleSound}
          onWin={handleWin}
          onRetry={() => setBattle((b) => (b ? { ...b, attempt: b.attempt + 1 } : b))}
          onExit={() => setBattle(null)}
        />
      ) : (
        <EncounterSelect wins={wins} active={active && !battle} onPick={startBattle} />
      )}
    </div>
  );
}
