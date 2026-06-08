export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos'

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12

export interface CardData {
  id: string
  suit: Suit
  rank: Rank
}

export interface PlayerState {
  id: number
  name: string
  hand: CardData[]
}

export type Stage =
  | 'setup'
  | 'initial-peek'
  | 'turn-start'
  | 'drawn'
  | 'effect-choice'
  | 'effect-10-select'
  | 'effect-11-select'
  | 'effect-12-select-own'
  | 'effect-12-select-target'
  | 'round-end'

export interface OverlayCard {
  card: CardData
  caption?: string
}

export interface Overlay {
  /** The player who is allowed to look at this overlay. null = visible to everyone (public reveal). */
  viewerIndex: number | null
  heading: string
  description?: string
  cards: OverlayCard[]
  confirmLabel: string
  /** What should happen once the overlay is dismissed. */
  then: 'advance-turn' | 'nothing'
}

export interface MatchAttemptState {
  step: 'choose-player' | 'choose-card'
  playerIndex: number | null
}

export interface InitialPeekState {
  playerIndex: number
  pickedIndices: number[]
}

export interface GameState {
  stage: Stage
  players: PlayerState[]
  deck: CardData[]
  discard: CardData[]
  currentPlayerIndex: number
  drawnCard: CardData | null
  pendingEffectCard: CardData | null
  pendingSelection: { ownIndex: number } | null
  caboDeclaredBy: number | null
  finalTurnsRemaining: number
  initialPeek: InitialPeekState | null
  overlay: Overlay | null
  matchAttempt: MatchAttemptState | null
  log: string[]
}

export type GameAction =
  | { type: 'START_GAME'; names: string[] }
  | { type: 'CONFIRM_PEEK_DONE' }
  | { type: 'DRAW_CARD' }
  | { type: 'DISCARD_DRAWN' }
  | { type: 'USE_EFFECT' }
  | { type: 'SKIP_EFFECT' }
  | { type: 'SELECT_CARD'; playerIndex: number; cardIndex: number }
  | { type: 'DECLARE_CABO' }
  | { type: 'DISMISS_OVERLAY' }
  | { type: 'OPEN_MATCH_ATTEMPT' }
  | { type: 'CANCEL_MATCH_ATTEMPT' }
  | { type: 'MATCH_SELECT_PLAYER'; playerIndex: number }
  | { type: 'MATCH_SELECT_CARD'; cardIndex: number }
  | { type: 'RESTART' }
