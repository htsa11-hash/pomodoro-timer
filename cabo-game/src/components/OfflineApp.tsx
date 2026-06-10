import { useReducer, useState } from 'react'
import GameBoard from './GameBoard'
import SetupScreen from './SetupScreen'
import { createInitialState, gameReducer } from '../game/reducer'
import type { CoinSession } from '../game/types'

interface OfflineAppProps {
  onBack: () => void
}

export default function OfflineApp({ onBack }: OfflineAppProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [coinSession, setCoinSession] = useState<CoinSession | null>(null)

  function handleStart(names: string[], startingCoins: number, betAmount: number) {
    setCoinSession({ playerNames: names, balances: names.map(() => startingCoins), betAmount })
    dispatch({ type: 'START_GAME', names })
  }

  function handleRematch(betAmount: number) {
    if (!coinSession) return
    setCoinSession((prev) => (prev ? { ...prev, betAmount } : null))
    dispatch({ type: 'START_GAME', names: coinSession.playerNames })
  }

  function handleNextRound(newBalances: number[]) {
    setCoinSession((prev) => (prev ? { ...prev, balances: newBalances } : null))
    dispatch({ type: 'RESTART' })
  }

  function handleNewGame() {
    setCoinSession(null)
    dispatch({ type: 'RESTART' })
  }

  const fallbackSession: CoinSession = {
    playerNames: state.players.map((p) => p.name),
    balances: state.players.map(() => 0),
    betAmount: 0,
  }

  if (state.stage === 'setup') {
    return coinSession ? (
      <SetupScreen
        onStart={(_, __, betAmount) => handleRematch(betAmount)}
        existingSession={coinSession}
        onNewGame={handleNewGame}
      />
    ) : (
      <SetupScreen onStart={handleStart} onBack={onBack} />
    )
  }

  return (
    <GameBoard
      state={state}
      dispatch={dispatch}
      coinSession={coinSession ?? fallbackSession}
      onNextRound={handleNextRound}
      onNewGame={handleNewGame}
    />
  )
}
