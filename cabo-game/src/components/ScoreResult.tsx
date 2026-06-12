import { rankLabelKey, SUIT_INFO } from '../game/deck'
import { totalScore } from '../game/reducer'
import { useTranslation } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/translations'
import type { CoinSession, GameState } from '../game/types'
import './ScoreResult.css'

interface ScoreResultProps {
  state: GameState
  coinSession: CoinSession
  canControl?: boolean
  onNextRound: (newBalances: number[]) => void
  onNewGame: () => void
}

function computeCoinTransfers(
  ranked: { player: { id: number }; total: number }[],
  coinSession: CoinSession,
): { coinChanges: number[]; newBalances: number[] } {
  const lowest = ranked[0]?.total
  const winnerIds = ranked.filter((e) => e.total === lowest).map((e) => e.player.id)

  const payments = coinSession.balances.map((bal) => Math.min(coinSession.betAmount, Math.max(0, bal)))
  const totalPot = payments.reduce((sum, p) => sum + p, 0)
  const winnerShare = Math.floor(totalPot / winnerIds.length)

  const coinChanges = payments.map((payment, idx) =>
    winnerIds.includes(idx) ? winnerShare - payment : -payment,
  )
  const newBalances = coinSession.balances.map((bal, idx) => bal + coinChanges[idx])

  return { coinChanges, newBalances }
}

export default function ScoreResult({ state, coinSession, canControl = true, onNextRound, onNewGame }: ScoreResultProps) {
  const { t } = useTranslation()
  const rankLabel = (rank: number) => {
    const key = rankLabelKey(rank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12)
    return key ? t(key as TranslationKey) : String(rank)
  }
  const formatCoins = (amount: number) => {
    const unit = t('coinUnit')
    return unit ? `${amount} ${unit}` : String(amount)
  }
  const ranked = state.players
    .map((player) => ({ player, total: totalScore(player) }))
    .sort((a, b) => a.total - b.total)

  const lowest = ranked[0]?.total
  const winners = ranked.filter((entry) => entry.total === lowest).map((entry) => entry.player.name)

  const { coinChanges, newBalances } = computeCoinTransfers(ranked, coinSession)
  const hasBet = coinSession.betAmount > 0

  return (
    <div className="score-result">
      <h2 className="score-result__title">{t('roundEndTitle')}</h2>
      <p className="score-result__winner">
        {winners.length > 1 ? t('drawResult', { names: winners.join(' / ') }) : t('winnerResult', { name: winners[0] })}
        {t('pointsTotal', { points: lowest })}
      </p>

      {hasBet && (
        <div className="score-result__coin-summary">
          <span className="score-result__coin-pot">{t('pot', { amount: formatCoins(coinSession.betAmount * state.players.length) })}</span>
        </div>
      )}

      <div className="score-result__list">
        {ranked.map(({ player, total }, rank) => {
          const change = coinChanges[player.id]
          const newBal = newBalances[player.id]
          return (
            <div key={player.id} className={`score-result__row ${rank === 0 ? 'score-result__row--winner' : ''}`}>
              <div className="score-result__row-header">
                <span className="score-result__rank">{t('rankLabel', { rank: rank + 1 })}</span>
                <span className="score-result__name">{player.name}</span>
                <span className="score-result__total">{total} {t('pointsUnit')}</span>
              </div>
              <div className="score-result__cards">
                {player.hand.map((card) => (
                  <div key={card.id} className="score-result__card" style={{ borderColor: SUIT_INFO[card.suit].color }}>
                    <span className="score-result__card-rank" style={{ color: SUIT_INFO[card.suit].color }}>
                      {SUIT_INFO[card.suit].symbol} {rankLabel(card.rank)}
                    </span>
                  </div>
                ))}
              </div>
              {hasBet && (
                <div className="score-result__coin-row">
                  <span className={`score-result__coin-change ${change >= 0 ? 'score-result__coin-change--positive' : 'score-result__coin-change--negative'}`}>
                    {change >= 0 ? formatCoins(change).replace(/^/, '+') : formatCoins(change)}
                  </span>
                  <span className="score-result__coin-balance">{formatCoins(newBal)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canControl ? (
        <div className="score-result__actions">
          <button type="button" className="btn btn--primary" onClick={() => onNextRound(newBalances)}>
            {t('nextRound')}
          </button>
          <button type="button" className="btn btn--secondary" onClick={onNewGame}>
            {t('newGame')}
          </button>
        </div>
      ) : (
        <p className="score-result__waiting">{t('waitingForHostAction')}</p>
      )}
    </div>
  )
}
