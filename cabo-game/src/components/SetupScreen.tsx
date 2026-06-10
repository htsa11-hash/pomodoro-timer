import { useState } from 'react'
import type { CoinSession } from '../game/types'
import './SetupScreen.css'

interface SetupScreenProps {
  onStart: (names: string[], startingCoins: number, betAmount: number) => void
  existingSession?: CoinSession
  onNewGame?: () => void
  onBack?: () => void
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const DEFAULT_STARTING_COINS = 1000
const DEFAULT_BET = 100

export default function SetupScreen({ onStart, existingSession, onNewGame, onBack }: SetupScreenProps) {
  const [count, setCount] = useState(existingSession ? existingSession.playerNames.length : 4)
  const [names, setNames] = useState<string[]>(
    existingSession
      ? [...existingSession.playerNames, ...Array.from({ length: MAX_PLAYERS - existingSession.playerNames.length }, (_, i) => `プレイヤー${existingSession.playerNames.length + i + 1}`)]
      : Array.from({ length: MAX_PLAYERS }, (_, i) => `プレイヤー${i + 1}`),
  )
  const [startingCoins, setStartingCoins] = useState(DEFAULT_STARTING_COINS)
  const [betAmount, setBetAmount] = useState(existingSession ? existingSession.betAmount : DEFAULT_BET)

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  const handleStart = () => {
    const finalNames = names.slice(0, count).map((name, i) => name.trim() || `プレイヤー${i + 1}`)
    onStart(finalNames, startingCoins, Math.max(0, betAmount))
  }

  const minBalance = existingSession ? Math.min(...existingSession.balances) : Infinity
  const maxBet = existingSession ? Math.max(0, minBalance) : Infinity
  const betValid = betAmount >= 0 && (existingSession ? betAmount <= maxBet : true)

  if (existingSession) {
    return (
      <div className="setup">
        <h1 className="setup__title">🃏 次のラウンド</h1>
        <p className="setup__lead">コインを賭けて次のラウンドを開始しましょう。</p>

        <div className="setup__coin-table">
          <div className="setup__coin-header">
            <span>プレイヤー</span>
            <span>コイン残高</span>
          </div>
          {existingSession.playerNames.map((name, i) => (
            <div key={i} className={`setup__coin-row ${existingSession.balances[i] <= 0 ? 'setup__coin-row--broke' : ''}`}>
              <span className="setup__coin-name">{name}</span>
              <span className="setup__coin-balance">{existingSession.balances[i].toLocaleString()} 枚</span>
              {existingSession.balances[i] <= 0 && <span className="setup__coin-tag">コイン切れ</span>}
            </div>
          ))}
        </div>

        <div className="setup__field">
          <label htmlFor="bet-amount">ベット額（1ラウンドあたり）</label>
          <div className="setup__bet-row">
            <input
              id="bet-amount"
              type="number"
              value={betAmount}
              min={0}
              max={maxBet}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="setup__bet-input"
            />
            <span className="setup__bet-unit">枚</span>
          </div>
          {!betValid && (
            <p className="setup__bet-warn">コインが足りないプレイヤーがいます（最大 {maxBet} 枚）</p>
          )}
        </div>

        <button type="button" className="setup__start-btn" onClick={handleStart} disabled={!betValid}>
          ゲーム開始
        </button>
        <button type="button" className="setup__secondary-btn" onClick={onNewGame}>
          新しいゲームを始める
        </button>
      </div>
    )
  }

  return (
    <div className="setup">
      <h1 className="setup__title">🃏 Cabo（カボ）</h1>
      <p className="setup__lead">
        スペイントランプ40枚を使った、手札の合計点をできるだけ少なくするカードゲームです。
        <br />
        コインを賭けて対戦！勝者が全員のベット分を獲得します。
      </p>

      <div className="setup__field">
        <label htmlFor="player-count">プレイ人数</label>
        <div className="setup__count-buttons">
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((n) => (
            <button
              key={n}
              type="button"
              className={`setup__count-btn ${count === n ? 'setup__count-btn--active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}人
            </button>
          ))}
        </div>
      </div>

      <div className="setup__field">
        <label>プレイヤー名</label>
        <div className="setup__names">
          {names.slice(0, count).map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              maxLength={12}
              placeholder={`プレイヤー${i + 1}`}
              onChange={(e) => updateName(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      <div className="setup__field">
        <label htmlFor="starting-coins">初期コイン（1人あたり）</label>
        <div className="setup__bet-row">
          <input
            id="starting-coins"
            type="number"
            value={startingCoins}
            min={0}
            step={100}
            onChange={(e) => setStartingCoins(Number(e.target.value))}
            className="setup__bet-input"
          />
          <span className="setup__bet-unit">枚</span>
        </div>
      </div>

      <div className="setup__field">
        <label htmlFor="bet-amount">ベット額（1ラウンドあたり）</label>
        <div className="setup__bet-row">
          <input
            id="bet-amount"
            type="number"
            value={betAmount}
            min={0}
            step={10}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="setup__bet-input"
          />
          <span className="setup__bet-unit">枚</span>
        </div>
        {betAmount > startingCoins && (
          <p className="setup__bet-warn">ベット額が初期コインを超えています</p>
        )}
      </div>

      <button type="button" className="setup__start-btn" onClick={handleStart}>
        ゲーム開始
      </button>

      <details className="setup__rules">
        <summary>遊び方をみる</summary>
        <ul>
          <li>各プレイヤーに4枚のカードが裏向きで配られ、最初に2枚だけ見ることができます。</li>
          <li>自分の番では山札から1枚引き、手札と交換するかそのまま捨てます。</li>
          <li>交換した場合、もとのカードは捨て札になります。</li>
          <li>10・11・12を捨てると特殊効果（カードを見る／交換する）を使えます。</li>
          <li>捨て札と同じ数字の手札があると思ったら公開して捨てるチャンスがあります（成功で手札が減り、失敗するとペナルティでカードが増えます）。</li>
          <li>「Cabo」を宣言すると、他のプレイヤーが1回ずつ行動した後にラウンドが終了し、手札の合計点が最も少ない人の勝ちです。</li>
          <li>勝者は全プレイヤーのベット分のコインを獲得します。引き分けの場合は山分けです。</li>
        </ul>
      </details>

      {onBack && (
        <button type="button" className="setup__secondary-btn" onClick={onBack}>
          戻る
        </button>
      )}
    </div>
  )
}
