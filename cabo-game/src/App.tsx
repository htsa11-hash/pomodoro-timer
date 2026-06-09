import { useReducer, useState } from 'react'
import GameBoard from './components/GameBoard'
import SetupScreen from './components/SetupScreen'
import { createInitialState, gameReducer } from './game/reducer'
import type { CoinSession } from './game/types'
import './App.css'

export default function App() {
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

  return (
    <div className="app">
      <div className="app__container">
        {state.stage === 'setup' ? (
          coinSession ? (
            <SetupScreen
              onStart={(_, __, betAmount) => handleRematch(betAmount)}
              existingSession={coinSession}
              onNewGame={handleNewGame}
            />
          ) : (
            <SetupScreen onStart={handleStart} />
          )
        ) : (
          <GameBoard
            state={state}
            dispatch={dispatch}
            coinSession={coinSession ?? fallbackSession}
            onNextRound={handleNextRound}
            onNewGame={handleNewGame}
          />
        )}
      </div>
    </div>
  )
}
