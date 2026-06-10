import { rankLabel, SUIT_INFO } from '../game/deck'
import { totalScore } from '../game/reducer'
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
  const ranked = state.players
    .map((player) => ({ player, total: totalScore(player) }))
    .sort((a, b) => a.total - b.total)

  const lowest = ranked[0]?.total
  const winners = ranked.filter((entry) => entry.total === lowest).map((entry) => entry.player.name)

  const { coinChanges, newBalances } = computeCoinTransfers(ranked, coinSession)
  const hasBet = coinSession.betAmount > 0

  return (
    <div className="score-result">
      <h2 className="score-result__title">ラウンド終了！結果発表</h2>
      <p className="score-result__winner">
        {winners.length > 1 ? `引き分け：${winners.join(' と ')}` : `優勝：${winners[0]} さん！`}（合計 {lowest} 点）
      </p>

      {hasBet && (
        <div className="score-result__coin-summary">
          <span className="score-result__coin-pot">ポット：{coinSession.betAmount * state.players.length} 枚</span>
        </div>
      )}

      <div className="score-result__list">
        {ranked.map(({ player, total }, rank) => {
          const change = coinChanges[player.id]
          const newBal = newBalances[player.id]
          return (
            <div key={player.id} className={`score-result__row ${rank === 0 ? 'score-result__row--winner' : ''}`}>
              <div className="score-result__row-header">
                <span className="score-result__rank">{rank + 1}位</span>
                <span className="score-result__name">{player.name}</span>
                <span className="score-result__total">{total} 点</span>
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
                    {change >= 0 ? `+${change}` : `${change}`} 枚
                  </span>
                  <span className="score-result__coin-balance">{newBal} 枚</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canControl ? (
        <div className="score-result__actions">
          <button type="button" className="btn btn--primary" onClick={() => onNextRound(newBalances)}>
            次のラウンドへ
          </button>
          <button type="button" className="btn btn--secondary" onClick={onNewGame}>
            新しいゲーム
          </button>
        </div>
      ) : (
        <p className="score-result__waiting">ホストが次のアクションを選択しています…</p>
      )}
    </div>
  )
}
