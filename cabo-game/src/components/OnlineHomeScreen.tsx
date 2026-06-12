import { useState } from 'react'
import { useTranslation } from '../i18n/I18nContext'
import './OnlineHomeScreen.css'

interface OnlineHomeScreenProps {
  busy: boolean
  error: string | null
  onCreate: (name: string) => void
  onJoin: (code: string, name: string) => void
  onBack: () => void
}

export default function OnlineHomeScreen({ busy, error, onCreate, onJoin, onBack }: OnlineHomeScreenProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const trimmedName = name.trim()

  return (
    <div className="online-home">
      <h1 className="online-home__title">{t('onlineHomeTitle')}</h1>
      <p className="online-home__lead">{t('onlineHomeLead')}</p>

      <div className="online-home__field">
        <label htmlFor="online-name">{t('yourName')}</label>
        <input
          id="online-name"
          type="text"
          value={name}
          maxLength={12}
          placeholder={t('playerNamePlaceholder')}
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
          {t('createRoom')}
        </button>
      </div>

      <div className="online-home__divider">{t('or')}</div>

      <div className="online-home__section">
        <label htmlFor="join-code">{t('roomCode')}</label>
        <div className="online-home__join-row">
          <input
            id="join-code"
            type="text"
            value={joinCode}
            maxLength={4}
            placeholder={t('roomCodePlaceholder')}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="online-home__code-input"
          />
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy || !trimmedName || joinCode.trim().length === 0}
            onClick={() => onJoin(joinCode, trimmedName)}
          >
            {t('join')}
          </button>
        </div>
      </div>

      <button type="button" className="btn btn--ghost" onClick={onBack}>
        {t('back')}
      </button>
    </div>
  )
}
