import { useTranslation } from '../i18n/I18nContext'
import GameBoard from './GameBoard'
import OnlineHomeScreen from './OnlineHomeScreen'
import RoomLobby from './RoomLobby'
import { useRoom } from '../online/useRoom'

interface OnlineAppProps {
  onBack: () => void
}

export default function OnlineApp({ onBack }: OnlineAppProps) {
  const { t } = useTranslation()
  const room = useRoom()

  if (!room.uid) {
    if (room.error) {
      return (
        <div className="online-home">
          <p className="online-home__error">
            {t('onlineInitFailed')}
            <br />
            {room.error}
          </p>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            {t('back')}
          </button>
        </div>
      )
    }
    return <p>{t('connecting')}</p>
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
    return <p>{t('preparingGame')}</p>
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
