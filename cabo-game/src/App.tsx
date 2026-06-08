import { useReducer } from 'react'
import GameBoard from './components/GameBoard'
import SetupScreen from './components/SetupScreen'
import { createInitialState, gameReducer } from './game/reducer'
import './App.css'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  return (
    <div className="app">
      <div className="app__container">
        {state.stage === 'setup' ? (
          <SetupScreen onStart={(names) => dispatch({ type: 'START_GAME', names })} />
        ) : (
          <GameBoard state={state} dispatch={dispatch} />
        )}
      </div>
    </div>
  )
}
