import { useState } from 'react'
import type { Overlay, PlayerState } from '../game/types'
import Card from './Card'
import './RevealOverlay.css'

interface RevealOverlayProps {
  overlay: Overlay
  players: PlayerState[]
  onDismiss: () => void
}

export default function RevealOverlay({ overlay, players, onDismiss }: RevealOverlayProps) {
  const needsGate = overlay.viewerIndex !== null
  const [revealed, setRevealed] = useState(!needsGate)

  if (needsGate && !revealed) {
    const viewer = players[overlay.viewerIndex as number]
    return (
      <div className="overlay-backdrop">
        <div className="overlay-card overlay-card--gate">
          <p className="overlay-card__gate-title">{viewer.name} さんの番です</p>
          <p className="overlay-card__gate-text">
            画面を他のプレイヤーに見られないように手元に持ってから、タップしてカードを確認してください。
          </p>
          <button type="button" className="btn btn--primary" onClick={() => setRevealed(true)}>
            タップして確認する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay-backdrop">
      <div className="overlay-card">
        <h3 className="overlay-card__heading">{overlay.heading}</h3>
        {overlay.description && <p className="overlay-card__description">{overlay.description}</p>}
        <div className="overlay-card__cards">
          {overlay.cards.map(({ card, caption }, i) => (
            <Card key={card.id ?? i} card={card} size="large" label={caption} />
          ))}
        </div>
        <button type="button" className="btn btn--primary" onClick={onDismiss}>
          {overlay.confirmLabel}
        </button>
      </div>
    </div>
  )
}
