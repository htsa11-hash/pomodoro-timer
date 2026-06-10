import GameBoard from './GameBoard'
import OnlineHomeScreen from './OnlineHomeScreen'
import RoomLobby from './RoomLobby'
import { useRoom } from '../online/useRoom'

interface OnlineAppProps {
  onBack: () => void
}

export default function OnlineApp({ onBack }: OnlineAppProps) {
  const room = useRoom()

  if (!room.uid) {
    if (room.error) {
      return (
        <div className="online-home">
          <p className="online-home__error">
            オンライン機能の初期化に失敗しました。Firebaseの設定（.env）を確認してください。
            <br />
            {room.error}
          </p>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            戻る
          </button>
        </div>
      )
    }
    return <p>接続中…</p>
  }

  if (!room.code || !room.room) {
    return (
      <OnlineHomeScreen
        busy={room.busy}
        error={room.error}
        onCreate={room.createRoom}
        onJoin={room.joinRoom}
        onBack={onBack}
      />
    )
  }

  if (room.room.status === 'lobby') {
    return (
      <RoomLobby
        code={room.code}
        room={room.room}
        myUid={room.uid}
        isHost={room.isHost}
        onStart={room.startGame}
        onLeave={room.leaveRoom}
      />
    )
  }

  if (!room.room.gameState || !room.room.coinSession) {
    return <p>ゲームを準備しています…</p>
  }

  return (
    <GameBoard
      state={room.room.gameState}
      dispatch={room.dispatch}
      coinSession={room.room.coinSession}
      myPlayerIndex={room.myPlayerIndex}
      canControlScore={room.isHost}
      onNextRound={room.nextRound}
      onNewGame={room.newGame}
    />
  )
}
