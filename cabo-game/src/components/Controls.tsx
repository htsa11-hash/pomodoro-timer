import { rankLabel } from '../game/deck'
import { getStageInstruction } from '../game/interaction'
import type { GameAction, GameState } from '../game/types'
import './Controls.css'

interface ControlsProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  myPlayerIndex?: number | null
}

const EFFECT_DESCRIPTIONS: Record<number, string> = {
  10: '10（ソタ）：自分のカードを1枚見ることができます。',
  11: '11（カバロ）：相手のカードを1枚見ることができます。',
  12: '12（レイ）：自分と相手のカードを1枚ずつ、中身を見ずに交換できます。',
}

export default function Controls({ state, dispatch, myPlayerIndex = null }: ControlsProps) {
  const instruction = getStageInstruction(state)
  const activePlayer = state.players[state.currentPlayerIndex]
  const isMyTurn = myPlayerIndex === null || myPlayerIndex === state.currentPlayerIndex
  const canOpenMatch =
    state.discard.length > 0 &&
    !state.overlay &&
    !state.matchAttempt &&
    state.stage !== 'setup' &&
    state.stage !== 'initial-peek' &&
    state.stage !== 'round-end' &&
    state.stage !== 'turn-done'

  return (
    <div className="controls">
      {state.stage === 'turn-start' && (
        <div className="controls__row">
          <p className="controls__hint">{activePlayer.name} さんのターンです。カードを引いています…</p>
        </div>
      )}

      {state.stage === 'drawn' && (
        <div className="controls__row">
          <p className="controls__hint">{instruction}</p>
          {isMyTurn && (
            <>
              <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: 'DISCARD_DRAWN' })}>
                そのまま捨てる
              </button>
              <button
                type="button"
                className="btn btn--cabo"
                disabled={state.caboDeclaredBy !== null}
                onClick={() => dispatch({ type: 'DECLARE_CABO' })}
              >
                Cabo 宣言
              </button>
            </>
          )}
        </div>
      )}

      {state.stage === 'effect-choice' && state.pendingEffectCard && (
        <div className="controls__row">
          <p className="controls__hint">
            捨てたカードは {rankLabel(state.pendingEffectCard.rank)} です。
            <br />
            {EFFECT_DESCRIPTIONS[state.pendingEffectCard.rank]}
          </p>
          {isMyTurn && (
            <>
              <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'USE_EFFECT' })}>
                効果を使う
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: 'SKIP_EFFECT' })}>
                使わない
              </button>
            </>
          )}
        </div>
      )}

      {(state.stage === 'effect-10-select' ||
        state.stage === 'effect-11-select' ||
        state.stage === 'effect-12-select-own' ||
        state.stage === 'effect-12-select-target') && (
        <div className="controls__row">
          <p className="controls__hint">{isMyTurn ? instruction : `${activePlayer.name} さんの操作をお待ちください。`}</p>
        </div>
      )}

      {state.stage === 'turn-done' && (
        <div className="controls__row">
          <p className="controls__hint">カードを捨てました。マッチを試みるか、ターンを終了してください。</p>
          {isMyTurn && (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'END_TURN' })}>
              ターン終了
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'OPEN_MATCH_ATTEMPT' })}>
            捨て札と同じ数字に挑戦する
          </button>
        </div>
      )}

      {canOpenMatch && (
        <div className="controls__row controls__row--secondary">
          <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'OPEN_MATCH_ATTEMPT' })}>
            捨て札と同じ数字に挑戦する
          </button>
        </div>
      )}
    </div>
  )
}
