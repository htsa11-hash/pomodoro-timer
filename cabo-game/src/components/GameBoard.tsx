import { useEffect } from 'react'
import { rankLabelKey } from '../game/deck'
import { getActingPlayerIndex } from '../game/interaction'
import { useTranslation } from '../i18n/I18nContext'
import type { CoinSession, GameAction, GameState } from '../game/types'
import Card from './Card'
import Controls from './Controls'
import MatchAttemptModal from './MatchAttemptModal'
import PlayerArea from './PlayerArea'
import RevealOverlay from './RevealOverlay'
import ScoreResult from './ScoreResult'
import './GameBoard.css'

interface GameBoardProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  coinSession: CoinSession
  myPlayerIndex?: number | null
  canControlScore?: boolean
  onNextRound: (newBalances: number[]) => void
  onNewGame: () => void
}

export default function GameBoard({ state, dispatch, coinSession, myPlayerIndex = null, canControlScore = true, onNextRound, onNewGame }: GameBoardProps) {
  const { t, tMessage } = useTranslation()
  const topDiscard = state.discard[state.discard.length - 1]
  const activePlayer = state.players[state.currentPlayerIndex]
  const actingPlayerIndex = getActingPlayerIndex(state)
  const isMyAction = myPlayerIndex === null || actingPlayerIndex === myPlayerIndex

  useEffect(() => {
    if (state.stage === 'turn-start' && !state.overlay && isMyAction) {
      dispatch({ type: 'DRAW_CARD' })
    }
  }, [state.stage, state.overlay, isMyAction, dispatch])

  const handleCardClick = (playerIndex: number, cardIndex: number) => {
    if (!isMyAction) return
    dispatch({ type: 'SELECT_CARD', playerIndex, cardIndex })
  }

  return (
    <div className="game-board">
      <header className="game-board__status">
        <div className="game-board__piles">
          <div className="game-board__pile">
            <Card faceDown size="medium" />
            <span className="game-board__pile-label">{t('deckPile', { count: state.deck.length })}</span>
          </div>
          <div className="game-board__pile">
            {topDiscard ? (
              <Card card={topDiscard} size="medium" label={rankLabelKey(topDiscard.rank) ? t(rankLabelKey(topDiscard.rank) as 'rank10' | 'rank11' | 'rank12') : String(topDiscard.rank)} />
            ) : (
              <Card faceDown size="medium" />
            )}
            <span className="game-board__pile-label">{t('discardPile')}</span>
          </div>
        </div>

        <div className="game-board__turn-info">
          {state.stage === 'initial-peek' && state.initialPeek ? (
            <p>
              {t('peekingCards', { name: state.players[state.initialPeek.playerIndex].name, count: state.initialPeek.pickedIndices.length })}
            </p>
          ) : state.stage === 'round-end' ? (
            <p>{t('roundEnd')}</p>
          ) : (
            <p>
              {t('currentTurn', { name: activePlayer.name })}
              {state.caboDeclaredBy !== null && (
                <span className="game-board__cabo-note">
                  {t('caboNote', { name: state.players[state.caboDeclaredBy].name, turns: state.finalTurnsRemaining })}
                </span>
              )}
            </p>
          )}
        </div>
      </header>

      {state.stage === 'initial-peek' && state.initialPeek && (
        <div className="game-board__peek-banner">
          {isMyAction ? (
            <>
              <p>
                {t('peekInstruction', { name: state.players[state.initialPeek.playerIndex].name })}
              </p>
              {state.initialPeek.pickedIndices.length >= 2 && (
                <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'CONFIRM_PEEK_DONE' })}>
                  {t('peekConfirmDone')}
                </button>
              )}
            </>
          ) : (
            <p>{t('peekWaiting', { name: state.players[state.initialPeek.playerIndex].name })}</p>
          )}
        </div>
      )}

      {myPlayerIndex !== null && isMyAction && state.stage !== 'initial-peek' && state.stage !== 'round-end' && (
        <div className="game-board__turn-banner">{t('yourTurnBanner')}</div>
      )}

      <div className="game-board__players">
        {state.players.map((_, index) => (
          <PlayerArea key={index} state={state} playerIndex={index} myPlayerIndex={myPlayerIndex} onCardClick={handleCardClick} />
        ))}
      </div>

      {state.stage === 'round-end' ? (
        <ScoreResult
          state={state}
          coinSession={coinSession}
          canControl={canControlScore}
          onNextRound={onNextRound}
          onNewGame={onNewGame}
        />
      ) : (
        <Controls state={state} dispatch={dispatch} myPlayerIndex={myPlayerIndex} />
      )}

      <section className="game-board__log">
        <h3>{t('gameLog')}</h3>
        <ul>
          {state.log
            .slice(-6)
            .reverse()
            .map((entry, i) => (
              <li key={i}>{tMessage(entry)}</li>
            ))}
        </ul>
      </section>

      {state.overlay && (myPlayerIndex === null || state.overlay.viewerIndex === null || state.overlay.viewerIndex === myPlayerIndex) && (
        <RevealOverlay overlay={state.overlay} players={state.players} onDismiss={() => dispatch({ type: 'DISMISS_OVERLAY' })} />
      )}

      {state.matchAttempt && (
        <MatchAttemptModal
          state={state}
          onSelectPlayer={(playerIndex) => dispatch({ type: 'MATCH_SELECT_PLAYER', playerIndex })}
          onSelectCard={(cardIndex) => dispatch({ type: 'MATCH_SELECT_CARD', cardIndex })}
          onCancel={() => dispatch({ type: 'CANCEL_MATCH_ATTEMPT' })}
        />
      )}
    </div>
  )
}
