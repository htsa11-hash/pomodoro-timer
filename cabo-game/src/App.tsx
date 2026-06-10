import { useState } from 'react'
import ModeSelectScreen from './components/ModeSelectScreen'
import OfflineApp from './components/OfflineApp'
import OnlineApp from './components/OnlineApp'
import './App.css'

type Mode = 'offline' | 'online' | null

export default function App() {
  const [mode, setMode] = useState<Mode>(null)

  return (
    <div className="app">
      <div className="app__container">
        {mode === null && <ModeSelectScreen onSelectOffline={() => setMode('offline')} onSelectOnline={() => setMode('online')} />}
        {mode === 'offline' && <OfflineApp onBack={() => setMode(null)} />}
        {mode === 'online' && <OnlineApp onBack={() => setMode(null)} />}
      </div>
    </div>
  )
}
