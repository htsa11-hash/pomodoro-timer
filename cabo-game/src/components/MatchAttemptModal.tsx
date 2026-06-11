import { rankLabelKey } from '../game/deck'
import { useTranslation } from '../i18n/I18nContext'
import type { GameState } from '../game/types'
import './MatchAttemptModal.css'

interface MatchAttemptModalProps {
  state: GameState
  onSelectPlayer: (playerIndex: number) => void
  onSelectCard: (cardIndex: number) => void
  onCancel: () => void
}

export default function MatchAttemptModal({ state, onSelectPlayer, onSelectCard, onCancel }: MatchAttemptModalProps) {
  const { t } = useTranslation()
  const attempt = state.matchAttempt
  if (!attempt) return null

  const top = state.discard[state.discard.length - 1]
  const topRankLabel = top ? (rankLabelKey(top.rank) ? t(rankLabelKey(top.rank) as 'rank10' | 'rank11' | 'rank12') : String(top.rank)) : '—'

  return (
    <div className="overlay-backdrop">
      <div className="match-modal">
        <h3 className="match-modal__heading">{t('matchAttemptTitle')}</h3>
        <p className="match-modal__description">
          {t('matchAttemptDescription', { rank: topRankLabel })}
        </p>

        {attempt.step === 'choose-player' && (
          <div className="match-modal__list">
            {state.players.map((player, index) => (
              <button
                key={player.id}
                type="button"
                className="btn btn--secondary"
                disabled={player.hand.length === 0}
                onClick={() => onSelectPlayer(index)}
              >
                {t('matchAttemptPlayerOption', { name: player.name, count: player.hand.length })}
              </button>
            ))}
          </div>
        )}

        {attempt.step === 'choose-card' && attempt.playerIndex !== null && (
          <div className="match-modal__list">
            <p className="match-modal__sub">
              {t('matchAttemptChooseCard', { name: state.players[attempt.playerIndex].name })}
            </p>
            <div className="match-modal__cards">
              {state.players[attempt.playerIndex].hand.map((_, cardIndex) => (
                <button key={cardIndex} type="button" className="btn btn--secondary" onClick={() => onSelectCard(cardIndex)}>
                  {t('positionLabel', { index: cardIndex + 1 })}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
