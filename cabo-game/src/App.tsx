import { useState } from 'react'
import LanguageSwitcher from './components/LanguageSwitcher'
import ModeSelectScreen from './components/ModeSelectScreen'
import OfflineApp from './components/OfflineApp'
import OnlineApp from './components/OnlineApp'
import { I18nProvider } from './i18n/I18nContext'
import './App.css'

type Mode = 'offline' | 'online' | null

function AppContent() {
  const [mode, setMode] = useState<Mode>(null)

  return (
    <div className="app">
      <div className="app__container">
        <LanguageSwitcher />
        {mode === null && <ModeSelectScreen onSelectOffline={() => setMode('offline')} onSelectOnline={() => setMode('online')} />}
        {mode === 'offline' && <OfflineApp onBack={() => setMode(null)} />}
        {mode === 'online' && <OnlineApp onBack={() => setMode(null)} />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}
