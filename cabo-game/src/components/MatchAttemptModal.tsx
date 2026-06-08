import type { GameState } from '../game/types'
import './MatchAttemptModal.css'

interface MatchAttemptModalProps {
  state: GameState
  onSelectPlayer: (playerIndex: number) => void
  onSelectCard: (cardIndex: number) => void
  onCancel: () => void
}

export default function MatchAttemptModal({ state, onSelectPlayer, onSelectCard, onCancel }: MatchAttemptModalProps) {
  const attempt = state.matchAttempt
  if (!attempt) return null

  const top = state.discard[state.discard.length - 1]

  return (
    <div className="overlay-backdrop">
      <div className="match-modal">
        <h3 className="match-modal__heading">捨て札と同じ数字に挑戦</h3>
        <p className="match-modal__description">
          捨て札の一番上は <strong>{top ? top.rank : '—'}</strong> です。同じ数字を持っていると思うプレイヤーを選んでください。
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
                {player.name}（{player.hand.length} 枚）
              </button>
            ))}
          </div>
        )}

        {attempt.step === 'choose-card' && attempt.playerIndex !== null && (
          <div className="match-modal__list">
            <p className="match-modal__sub">
              {state.players[attempt.playerIndex].name} のどのカードを公開して捨てますか？
            </p>
            <div className="match-modal__cards">
              {state.players[attempt.playerIndex].hand.map((_, cardIndex) => (
                <button key={cardIndex} type="button" className="btn btn--secondary" onClick={() => onSelectCard(cardIndex)}>
                  位置 {cardIndex + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </div>
  )
}
