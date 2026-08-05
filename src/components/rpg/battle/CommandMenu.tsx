import type { BattleAction, BattleState } from './types';
import { rootCommands } from './battleReducer';
import { spells, items } from '../../../data/battles';

interface CommandMenuProps {
  state: BattleState;
  dispatch: React.Dispatch<BattleAction>;
}

export default function CommandMenu({ state, dispatch }: CommandMenuProps) {
  const inCommand = state.phase === 'command';
  const { open, cursor } = state.menu;

  const pick = (index: number) => {
    if (!inCommand) return;
    dispatch({ type: 'MENU_SET_CURSOR', index });
    dispatch({ type: 'MENU_CONFIRM' });
  };

  return (
    <div className="rpgb-window rpgb-commands" data-testid="command-menu">
      {inCommand && open === 'materia' ? (
        <>
          {spells.map((spell, i) => (
            <button
              key={spell.id}
              type="button"
              className={`rpgb-cmd${cursor === i ? ' rpgb-focused' : ''}`}
              aria-disabled={state.player.mp < spell.mpCost}
              data-testid={`cmd-spell-${spell.id}`}
              onMouseEnter={() => dispatch({ type: 'MENU_SET_CURSOR', index: i })}
              onClick={() => pick(i)}
            >
              <span>{spell.name}</span>
              <span className="rpgb-cmd-cost">{spell.mpCost} MP</span>
            </button>
          ))}
          <button type="button" className="rpgb-cmd rpgb-cmd-back" onClick={() => dispatch({ type: 'MENU_CANCEL' })}>
            ◀ BACK
          </button>
        </>
      ) : inCommand && open === 'item' ? (
        <>
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`rpgb-cmd${cursor === i ? ' rpgb-focused' : ''}`}
              aria-disabled={state.player.itemUses[item.id] <= 0}
              data-testid={`cmd-item-${item.id}`}
              onMouseEnter={() => dispatch({ type: 'MENU_SET_CURSOR', index: i })}
              onClick={() => pick(i)}
            >
              <span>{item.name}</span>
              <span className="rpgb-cmd-cost">×{state.player.itemUses[item.id]}</span>
            </button>
          ))}
          <button type="button" className="rpgb-cmd rpgb-cmd-back" onClick={() => dispatch({ type: 'MENU_CANCEL' })}>
            ◀ BACK
          </button>
        </>
      ) : (
        <>
          {rootCommands.map((cmd, i) => {
            const limitLocked = cmd === 'LIMIT' && state.player.limit < 1;
            return (
              <button
                key={cmd}
                type="button"
                className={`rpgb-cmd${inCommand && cursor === i ? ' rpgb-focused' : ''}`}
                aria-disabled={!inCommand || limitLocked}
                data-testid={`cmd-${cmd.toLowerCase()}`}
                onMouseEnter={() => inCommand && dispatch({ type: 'MENU_SET_CURSOR', index: i })}
                onClick={() => pick(i)}
              >
                <span>{cmd}</span>
                {limitLocked && <span className="rpgb-cmd-cost">CHARGING…</span>}
              </button>
            );
          })}
          {!inCommand && <div className="rpgb-waiting">ATB CHARGING…</div>}
        </>
      )}
    </div>
  );
}
