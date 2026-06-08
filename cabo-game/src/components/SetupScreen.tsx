import { useState } from 'react'
import './SetupScreen.css'

interface SetupScreenProps {
  onStart: (names: string[]) => void
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [count, setCount] = useState(4)
  const [names, setNames] = useState<string[]>(
    Array.from({ length: MAX_PLAYERS }, (_, i) => `プレイヤー${i + 1}`),
  )

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  const handleStart = () => {
    const finalNames = names.slice(0, count).map((name, i) => name.trim() || `プレイヤー${i + 1}`)
    onStart(finalNames)
  }

  return (
    <div className="setup">
      <h1 className="setup__title">🃏 Cabo（カボ）</h1>
      <p className="setup__lead">
        スペイントランプ40枚を使った、手札の合計点をできるだけ少なくするカードゲームです。
        <br />
        1台の端末を回して遊ぶ「ローカルマルチプレイ」に対応しています。
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
        </ul>
      </details>
    </div>
  )
}
