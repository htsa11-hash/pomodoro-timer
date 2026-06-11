import { SUIT_INFO } from '../game/deck'
import { useTranslation } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/translations'
import type { CardData } from '../game/types'
import './Card.css'

interface CardProps {
  card?: CardData
  faceDown?: boolean
  size?: 'small' | 'medium' | 'large'
  highlight?: boolean
  peeked?: boolean
  disabled?: boolean
  label?: string
  onClick?: () => void
}

export default function Card({ card, faceDown = false, size = 'medium', highlight = false, peeked = false, disabled = false, label, onClick }: CardProps) {
  const { t } = useTranslation()
  const classNames = [
    'card',
    `card--${size}`,
    faceDown || !card ? 'card--back' : 'card--front',
    highlight ? 'card--highlight' : '',
    peeked ? 'card--peeked' : '',
    onClick && !disabled ? 'card--clickable' : '',
    disabled ? 'card--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content =
    !faceDown && card ? (
      <div className="card__face" style={{ color: SUIT_INFO[card.suit].color }}>
        <span className="card__corner card__corner--top" aria-hidden="true">
          {card.rank}
          <span className="card__corner-suit">{SUIT_INFO[card.suit].symbol}</span>
        </span>
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{SUIT_INFO[card.suit].symbol}</span>
        <span className="card__corner card__corner--bottom" aria-hidden="true">
          {card.rank}
          <span className="card__corner-suit">{SUIT_INFO[card.suit].symbol}</span>
        </span>
      </div>
    ) : (
      <div className="card__back-pattern" aria-hidden="true" />
    )

  return (
    <div className="card-slot">
      <button
        type="button"
        className={classNames}
        onClick={onClick}
        disabled={!onClick || disabled}
        aria-label={label ?? (card ? `${card.rank} ${t(SUIT_INFO[card.suit].labelKey as TranslationKey)}` : t('cardAriaLabel'))}
      >
        {content}
      </button>
      {label && <span className="card-slot__label">{label}</span>}
    </div>
  )
}
