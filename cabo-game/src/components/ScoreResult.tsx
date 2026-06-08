import { rankLabel, SUIT_INFO } from '../game/deck'
import { totalScore } from '../game/reducer'
import type { GameAction, GameState } from '../game/types'
import './ScoreResult.css'

interface ScoreResultProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export default function ScoreResult({ state, dispatch }: ScoreResultProps) {
  const ranked = state.players
    .map((player) => ({ player, total: totalScore(player) }))
    .sort((a, b) => a.total - b.total)

  const lowest = ranked[0]?.total
  const winners = ranked.filter((entry) => entry.total === lowest).map((entry) => entry.player.name)

  return (
    <div className="score-result">
      <h2 className="score-result__title">ラウンド終了！結果発表</h2>
      <p className="score-result__winner">
        {winners.length > 1 ? `引き分け：${winners.join(' と ')}` : `優勝：${winners[0]} さん！`}（合計 {lowest} 点）
      </p>

      <div className="score-result__list">
        {ranked.map(({ player, total }, rank) => (
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
          </div>
        ))}
      </div>

      <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'RESTART' })}>
        最初からやり直す
      </button>
    </div>
  )
}
