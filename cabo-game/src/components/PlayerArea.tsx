import { getCardInteraction } from '../game/interaction'
import { useTranslation } from '../i18n/I18nContext'
import type { GameState } from '../game/types'
import Card from './Card'
import './PlayerArea.css'

interface PlayerAreaProps {
  state: GameState
  playerIndex: number
  myPlayerIndex?: number | null
  onCardClick: (playerIndex: number, cardIndex: number) => void
}

export default function PlayerArea({ state, playerIndex, myPlayerIndex = null, onCardClick }: PlayerAreaProps) {
  const { t } = useTranslation()
  const player = state.players[playerIndex]
  const isCurrentTurn = state.stage !== 'setup' && state.stage !== 'initial-peek' && state.stage !== 'round-end' && playerIndex === state.currentPlayerIndex
  const isPeeking = state.stage === 'initial-peek' && state.initialPeek?.playerIndex === playerIndex
  const declaredCabo = state.caboDeclaredBy === playerIndex
  const isMe = myPlayerIndex === playerIndex

  return (
    <div className={`player-area ${isCurrentTurn || isPeeking ? 'player-area--active' : ''}`}>
      <div className="player-area__header">
        <span className="player-area__name">{player.name}</span>
        {isMe && <span className="player-area__badge player-area__badge--you">{t('you')}</span>}
        {(isCurrentTurn || isPeeking) && <span className="player-area__badge player-area__badge--turn">{t('yourTurnBadge')}</span>}
        {declaredCabo && <span className="player-area__badge player-area__badge--cabo">{t('caboBadge')}</span>}
        <span className="player-area__count">{player.hand.length} {t('cardsUnit')}</span>
      </div>
      <div className="player-area__hand">
        {player.hand.map((card, cardIndex) => {
          const { clickable, highlight } = getCardInteraction(state, playerIndex, cardIndex, myPlayerIndex)
          const peekedIndices = state.stage !== 'initial-peek' ? (state.peekHighlights[playerIndex] ?? []) : []
          const peeked = peekedIndices.includes(cardIndex)
          return (
            <Card
              key={card.id}
              faceDown
              size="medium"
              label={`${cardIndex + 1}`}
              highlight={highlight}
              peeked={peeked}
              onClick={clickable ? () => onCardClick(playerIndex, cardIndex) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
