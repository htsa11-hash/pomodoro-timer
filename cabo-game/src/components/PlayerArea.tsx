import { getCardInteraction } from '../game/interaction'
import type { GameState } from '../game/types'
import Card from './Card'
import './PlayerArea.css'

interface PlayerAreaProps {
  state: GameState
  playerIndex: number
  onCardClick: (playerIndex: number, cardIndex: number) => void
}

export default function PlayerArea({ state, playerIndex, onCardClick }: PlayerAreaProps) {
  const player = state.players[playerIndex]
  const isCurrentTurn = state.stage !== 'setup' && state.stage !== 'initial-peek' && state.stage !== 'round-end' && playerIndex === state.currentPlayerIndex
  const isPeeking = state.stage === 'initial-peek' && state.initialPeek?.playerIndex === playerIndex
  const declaredCabo = state.caboDeclaredBy === playerIndex

  return (
    <div className={`player-area ${isCurrentTurn || isPeeking ? 'player-area--active' : ''}`}>
      <div className="player-area__header">
        <span className="player-area__name">{player.name}</span>
        {(isCurrentTurn || isPeeking) && <span className="player-area__badge player-area__badge--turn">手番</span>}
        {declaredCabo && <span className="player-area__badge player-area__badge--cabo">Cabo!</span>}
        <span className="player-area__count">{player.hand.length} 枚</span>
      </div>
      <div className="player-area__hand">
        {player.hand.map((card, cardIndex) => {
          const { clickable, highlight } = getCardInteraction(state, playerIndex, cardIndex)
          return (
            <Card
              key={card.id}
              faceDown
              size="medium"
              label={`${cardIndex + 1}`}
              highlight={highlight}
              onClick={clickable ? () => onCardClick(playerIndex, cardIndex) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
