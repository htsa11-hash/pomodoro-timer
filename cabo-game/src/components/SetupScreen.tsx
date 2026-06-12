import { useState } from 'react'
import { useTranslation } from '../i18n/I18nContext'
import type { CoinSession } from '../game/types'
import './SetupScreen.css'

interface SetupScreenProps {
  onStart: (names: string[], startingCoins: number, betAmount: number) => void
  existingSession?: CoinSession
  onNewGame?: () => void
  onBack?: () => void
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const DEFAULT_STARTING_COINS = 1000
const DEFAULT_BET = 100

export default function SetupScreen({ onStart, existingSession, onNewGame, onBack }: SetupScreenProps) {
  const { t } = useTranslation()
  const defaultPlayerName = (n: number) => `${t('player')}${n}`
  const [count, setCount] = useState(existingSession ? existingSession.playerNames.length : 4)
  const [names, setNames] = useState<string[]>(
    existingSession
      ? [...existingSession.playerNames, ...Array.from({ length: MAX_PLAYERS - existingSession.playerNames.length }, (_, i) => defaultPlayerName(existingSession.playerNames.length + i + 1))]
      : Array.from({ length: MAX_PLAYERS }, (_, i) => defaultPlayerName(i + 1)),
  )
  const [startingCoins, setStartingCoins] = useState(DEFAULT_STARTING_COINS)
  const [betAmount, setBetAmount] = useState(existingSession ? existingSession.betAmount : DEFAULT_BET)

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  const handleStart = () => {
    const finalNames = names.slice(0, count).map((name, i) => name.trim() || defaultPlayerName(i + 1))
    onStart(finalNames, startingCoins, Math.max(0, betAmount))
  }

  const minBalance = existingSession ? Math.min(...existingSession.balances) : Infinity
  const maxBet = existingSession ? Math.max(0, minBalance) : Infinity
  const betValid = betAmount >= 0 && (existingSession ? betAmount <= maxBet : true)

  if (existingSession) {
    return (
      <div className="setup">
        <h1 className="setup__title">{t('nextRoundTitle')}</h1>
        <p className="setup__lead">{t('nextRoundLead')}</p>

        <div className="setup__coin-table">
          <div className="setup__coin-header">
            <span>{t('player')}</span>
            <span>{t('coinBalance')}</span>
          </div>
          {existingSession.playerNames.map((name, i) => (
            <div key={i} className={`setup__coin-row ${existingSession.balances[i] <= 0 ? 'setup__coin-row--broke' : ''}`}>
              <span className="setup__coin-name">{name}</span>
              <span className="setup__coin-balance">{existingSession.balances[i].toLocaleString()} {t('coinUnit')}</span>
              {existingSession.balances[i] <= 0 && <span className="setup__coin-tag">{t('outOfCoins')}</span>}
            </div>
          ))}
        </div>

        <div className="setup__field">
          <label htmlFor="bet-amount">{t('betPerRound')}</label>
          <div className="setup__bet-row">
            <input
              id="bet-amount"
              type="number"
              value={betAmount}
              min={0}
              max={maxBet}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="setup__bet-input"
            />
            <span className="setup__bet-unit">{t('coinUnit')}</span>
          </div>
          {!betValid && (
            <p className="setup__bet-warn">{t('betWarnInsufficientCoins', { max: maxBet })}</p>
          )}
        </div>

        <button type="button" className="setup__start-btn" onClick={handleStart} disabled={!betValid}>
          {t('startGame')}
        </button>
        <button type="button" className="setup__secondary-btn" onClick={onNewGame}>
          {t('startNewGame')}
        </button>
      </div>
    )
  }

  return (
    <div className="setup">
      <h1 className="setup__title">{t('appTitle')}</h1>
      <p className="setup__lead">
        {t('setupLead').split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </p>

      <div className="setup__field">
        <label htmlFor="player-count">{t('playerCount')}</label>
        <div className="setup__count-buttons">
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((n) => (
            <button
              key={n}
              type="button"
              className={`setup__count-btn ${count === n ? 'setup__count-btn--active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}{t('playerCountUnit')}
            </button>
          ))}
        </div>
      </div>

      <div className="setup__field">
        <label>{t('playerNames')}</label>
        <div className="setup__names">
          {names.slice(0, count).map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              maxLength={12}
              placeholder={defaultPlayerName(i + 1)}
              onChange={(e) => updateName(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      <div className="setup__field">
        <label htmlFor="starting-coins">{t('startingCoinsPerPlayer')}</label>
        <div className="setup__bet-row">
          <input
            id="starting-coins"
            type="number"
            value={startingCoins}
            min={0}
            step={100}
            onChange={(e) => setStartingCoins(Number(e.target.value))}
            className="setup__bet-input"
          />
          <span className="setup__bet-unit">{t('coinUnit')}</span>
        </div>
      </div>

      <div className="setup__field">
        <label htmlFor="bet-amount">{t('betPerRound')}</label>
        <div className="setup__bet-row">
          <input
            id="bet-amount"
            type="number"
            value={betAmount}
            min={0}
            step={10}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="setup__bet-input"
          />
          <span className="setup__bet-unit">{t('coinUnit')}</span>
        </div>
        {betAmount > startingCoins && (
          <p className="setup__bet-warn">{t('betWarnExceedsStarting')}</p>
        )}
      </div>

      <button type="button" className="setup__start-btn" onClick={handleStart}>
        {t('startGame')}
      </button>

      <details className="setup__rules">
        <summary>{t('howToPlay')}</summary>
        <ul>
          <li>{t('rule1')}</li>
          <li>{t('rule2')}</li>
          <li>{t('rule3')}</li>
          <li>{t('rule4')}</li>
          <li>{t('rule5')}</li>
          <li>{t('rule6')}</li>
          <li>{t('rule7')}</li>
        </ul>
      </details>

      {onBack && (
        <button type="button" className="setup__secondary-btn" onClick={onBack}>
          {t('back')}
        </button>
      )}
    </div>
  )
}
