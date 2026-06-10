import { useState } from 'react'
import type { RoomDoc } from '../online/types'
import './RoomLobby.css'

interface RoomLobbyProps {
  code: string
  room: RoomDoc
  myUid: string
  isHost: boolean
  onStart: (startingCoins: number, betAmount: number) => void
  onLeave: () => void
}

const DEFAULT_STARTING_COINS = 1000
const DEFAULT_BET = 100
const MIN_PLAYERS = 2

export default function RoomLobby({ code, room, myUid, isHost, onStart, onLeave }: RoomLobbyProps) {
  const [startingCoins, setStartingCoins] = useState(DEFAULT_STARTING_COINS)
  const [betAmount, setBetAmount] = useState(DEFAULT_BET)

  const players = room.playerSlots.filter((s): s is NonNullable<typeof s> => s !== null)
  const canStart = players.length >= MIN_PLAYERS

  return (
    <div className="room-lobby">
      <h1 className="room-lobby__title">🃏 ルーム待機中</h1>

      <div className="room-lobby__code">
        <span className="room-lobby__code-label">ルームコード</span>
        <span className="room-lobby__code-value">{code}</span>
      </div>
      <p className="room-lobby__hint">このコードを他のプレイヤーに共有してください。</p>

      <div className="room-lobby__players">
        {players.map((player) => (
          <div key={player.uid} className="room-lobby__player">
            <span>{player.name}</span>
            <span className="room-lobby__player-tags">
              {player.uid === room.hostUid && <span className="room-lobby__tag">ホスト</span>}
              {player.uid === myUid && <span className="room-lobby__tag room-lobby__tag--you">あなた</span>}
            </span>
          </div>
        ))}
        {Array.from({ length: Math.max(0, MIN_PLAYERS - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="room-lobby__player room-lobby__player--empty">
            <span>プレイヤーを待っています…</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <div className="room-lobby__setup">
          <div className="room-lobby__field">
            <label htmlFor="starting-coins">初期コイン（1人あたり）</label>
            <input
              id="starting-coins"
              type="number"
              value={startingCoins}
              min={0}
              step={100}
              onChange={(e) => setStartingCoins(Number(e.target.value))}
            />
          </div>
          <div className="room-lobby__field">
            <label htmlFor="bet-amount">ベット額（1ラウンドあたり）</label>
            <input
              id="bet-amount"
              type="number"
              value={betAmount}
              min={0}
              step={10}
              onChange={(e) => setBetAmount(Number(e.target.value))}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canStart}
            onClick={() => onStart(startingCoins, Math.max(0, betAmount))}
          >
            ゲーム開始
          </button>
          {!canStart && <p className="room-lobby__hint">2人以上集まると開始できます。</p>}
        </div>
      ) : (
        <p className="room-lobby__waiting">ホストがゲームを開始するのを待っています…</p>
      )}

      <button type="button" className="btn btn--ghost" onClick={onLeave}>
        ルームを退出する
      </button>
    </div>
  )
}
