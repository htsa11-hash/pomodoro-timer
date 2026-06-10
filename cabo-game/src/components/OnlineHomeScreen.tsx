import { useState } from 'react'
import './OnlineHomeScreen.css'

interface OnlineHomeScreenProps {
  busy: boolean
  error: string | null
  onCreate: (name: string) => void
  onJoin: (code: string, name: string) => void
  onBack: () => void
}

export default function OnlineHomeScreen({ busy, error, onCreate, onJoin, onBack }: OnlineHomeScreenProps) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const trimmedName = name.trim()

  return (
    <div className="online-home">
      <h1 className="online-home__title">🌐 オンライン対戦</h1>
      <p className="online-home__lead">同じルームコードを使って、別々の端末で対戦できます。</p>

      <div className="online-home__field">
        <label htmlFor="online-name">あなたの名前</label>
        <input
          id="online-name"
          type="text"
          value={name}
          maxLength={12}
          placeholder="プレイヤー名"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error && <p className="online-home__error">{error}</p>}

      <div className="online-home__section">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !trimmedName}
          onClick={() => onCreate(trimmedName)}
        >
          ルームを作成する
        </button>
      </div>

      <div className="online-home__divider">または</div>

      <div className="online-home__section">
        <label htmlFor="join-code">ルームコード</label>
        <div className="online-home__join-row">
          <input
            id="join-code"
            type="text"
            value={joinCode}
            maxLength={4}
            placeholder="例: A1B2"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="online-home__code-input"
          />
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy || !trimmedName || joinCode.trim().length === 0}
            onClick={() => onJoin(joinCode, trimmedName)}
          >
            参加する
          </button>
        </div>
      </div>

      <button type="button" className="btn btn--ghost" onClick={onBack}>
        戻る
      </button>
    </div>
  )
}
