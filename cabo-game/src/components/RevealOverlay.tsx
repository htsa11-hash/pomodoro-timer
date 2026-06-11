import { useState } from 'react'
import { useTranslation } from '../i18n/I18nContext'
import type { Overlay, PlayerState } from '../game/types'
import Card from './Card'
import './RevealOverlay.css'

interface RevealOverlayProps {
  overlay: Overlay
  players: PlayerState[]
  onDismiss: () => void
}

export default function RevealOverlay({ overlay, players, onDismiss }: RevealOverlayProps) {
  const { t, tMessage } = useTranslation()
  const needsGate = overlay.viewerIndex !== null
  const [revealed, setRevealed] = useState(!needsGate)

  if (needsGate && !revealed) {
    const viewer = players[overlay.viewerIndex as number]
    return (
      <div className="overlay-backdrop">
        <div className="overlay-card overlay-card--gate">
          <p className="overlay-card__gate-title">{t('overlayGateTitle', { name: viewer.name })}</p>
          <p className="overlay-card__gate-text">
            {t('overlayGateText')}
          </p>
          <button type="button" className="btn btn--primary" onClick={() => setRevealed(true)}>
            {t('tapToConfirm')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay-backdrop">
      <div className="overlay-card">
        <h3 className="overlay-card__heading">{tMessage(overlay.heading)}</h3>
        {overlay.description && <p className="overlay-card__description">{tMessage(overlay.description)}</p>}
        <div className="overlay-card__cards">
          {overlay.cards.map(({ card, caption }, i) => (
            <Card key={card.id ?? i} card={card} size="large" label={caption ? tMessage(caption) : undefined} />
          ))}
        </div>
        <button type="button" className="btn btn--primary" onClick={onDismiss}>
          {tMessage(overlay.confirmLabel)}
        </button>
      </div>
    </div>
  )
}
