import { rankParam } from '../game/deck'
import { getStageInstruction } from '../game/interaction'
import { useTranslation } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/translations'
import type { GameAction, GameState } from '../game/types'
import './Controls.css'

interface ControlsProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  myPlayerIndex?: number | null
}

const EFFECT_DESCRIPTION_KEYS: Record<number, TranslationKey> = {
  10: 'effect10Description',
  11: 'effect11Description',
  12: 'effect12Description',
}

export default function Controls({ state, dispatch, myPlayerIndex = null }: ControlsProps) {
  const { t, tMessage } = useTranslation()
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
          <p className="controls__hint">{t('yourTurnDrawing', { name: activePlayer.name })}</p>
        </div>
      )}

      {state.stage === 'drawn' && (
        <div className="controls__row">
          <p className="controls__hint">{instruction ? tMessage(instruction) : ''}</p>
          {isMyTurn && (
            <>
              <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: 'DISCARD_DRAWN' })}>
                {t('discardAsIs')}
              </button>
              <button
                type="button"
                className="btn btn--cabo"
                disabled={state.caboDeclaredBy !== null}
                onClick={() => dispatch({ type: 'DECLARE_CABO' })}
              >
                {t('declareCabo')}
              </button>
            </>
          )}
        </div>
      )}

      {state.stage === 'effect-choice' && state.pendingEffectCard && (
        <div className="controls__row">
          <p className="controls__hint">
            {t('discardedCardIs', { rank: rankParam(state.pendingEffectCard.rank) })}
            <br />
            {t(EFFECT_DESCRIPTION_KEYS[state.pendingEffectCard.rank])}
          </p>
          {isMyTurn && (
            <>
              <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'USE_EFFECT' })}>
                {t('useEffect')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: 'SKIP_EFFECT' })}>
                {t('skipEffect')}
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
          <p className="controls__hint">
            {isMyTurn && instruction ? tMessage(instruction) : t('waitingForPlayerAction', { name: activePlayer.name })}
          </p>
        </div>
      )}

      {state.stage === 'turn-done' && (
        <div className="controls__row">
          <p className="controls__hint">{t('discardedHint')}</p>
          {isMyTurn && (
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'END_TURN' })}>
              {t('endTurn')}
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'OPEN_MATCH_ATTEMPT' })}>
            {t('matchAttemptOpen')}
          </button>
        </div>
      )}

      {canOpenMatch && (
        <div className="controls__row controls__row--secondary">
          <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'OPEN_MATCH_ATTEMPT' })}>
            {t('matchAttemptOpen')}
          </button>
        </div>
      )}
    </div>
  )
}
