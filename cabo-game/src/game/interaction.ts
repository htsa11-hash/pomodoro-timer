import type { GameState, Message } from './types'

export interface CardInteraction {
  clickable: boolean
  highlight: boolean
}

/**
 * Identifies which player is currently expected to act (tap a card / make a
 * choice). For online play, only that player's device should treat cards as
 * clickable.
 */
export function getActingPlayerIndex(state: GameState): number | null {
  if (state.stage === 'initial-peek') return state.initialPeek?.playerIndex ?? null
  return state.currentPlayerIndex
}

/**
 * Decides whether the card at [playerIndex, cardIndex] can be tapped right now
 * (and dispatched as a SELECT_CARD action), and whether it should be highlighted
 * to guide the active player.
 *
 * `myPlayerIndex` is the viewer's own player slot in online play, or `null` for
 * offline pass-and-play (where any device can act for any player).
 */
export function getCardInteraction(
  state: GameState,
  playerIndex: number,
  cardIndex: number,
  myPlayerIndex: number | null = null,
): CardInteraction {
  if (state.overlay || state.matchAttempt) return { clickable: false, highlight: false }

  const isOwnCard = playerIndex === state.currentPlayerIndex
  const isMyAction = myPlayerIndex === null || getActingPlayerIndex(state) === myPlayerIndex

  switch (state.stage) {
    case 'initial-peek': {
      const peek = state.initialPeek
      if (!peek || playerIndex !== peek.playerIndex) return { clickable: false, highlight: false }
      const alreadyPicked = peek.pickedIndices.includes(cardIndex)
      return {
        clickable: isMyAction && !alreadyPicked && peek.pickedIndices.length < 2,
        highlight: alreadyPicked,
      }
    }

    case 'drawn':
      return { clickable: isMyAction && isOwnCard, highlight: false }

    case 'effect-10-select':
      return { clickable: isMyAction && isOwnCard, highlight: false }

    case 'effect-11-select':
      return { clickable: isMyAction && !isOwnCard, highlight: false }

    case 'effect-12-select-own':
      return { clickable: isMyAction && isOwnCard, highlight: false }

    case 'effect-12-select-target': {
      if (isOwnCard) {
        return { clickable: false, highlight: state.pendingSelection?.ownIndex === cardIndex }
      }
      return { clickable: isMyAction, highlight: false }
    }

    default:
      return { clickable: false, highlight: false }
  }
}

/** A short instruction shown to guide the active player through the current stage. */
export function getStageInstruction(state: GameState): Message | null {
  const activePlayer = state.players[state.currentPlayerIndex]
  switch (state.stage) {
    case 'drawn':
      return { key: 'instrDrawnSelect' }
    case 'effect-10-select':
      return { key: 'instrEffect10' }
    case 'effect-11-select':
      return { key: 'instrEffect11', params: { name: activePlayer?.name ?? '' } }
    case 'effect-12-select-own':
      return { key: 'instrEffect12Own' }
    case 'effect-12-select-target':
      return { key: 'instrEffect12Target' }
    default:
      return null
  }
}
