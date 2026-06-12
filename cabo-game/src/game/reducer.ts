import { createDeck, drawFromDeck, isSpecialRank, rankParam, shuffle } from './deck'
import type { GameAction, GameState, Message, PlayerState, Stage } from './types'

const HAND_SIZE = 4
const INITIAL_PEEK_COUNT = 2

export function createInitialState(): GameState {
  return {
    stage: 'setup',
    players: [],
    deck: [],
    discard: [],
    currentPlayerIndex: 0,
    drawnCard: null,
    pendingEffectCard: null,
    pendingSelection: null,
    caboDeclaredBy: null,
    finalTurnsRemaining: 0,
    initialPeek: null,
    overlay: null,
    matchAttempt: null,
    peekHighlights: {},
    log: [],
  }
}

function nextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length
}

function clonePlayers(players: PlayerState[]): PlayerState[] {
  return players.map((p) => ({ ...p, hand: [...p.hand] }))
}

/** Clears current player's peek highlights and in-flight card state, sets stage to turn-done. */
function readyForTurnDone(state: GameState): GameState {
  return { ...state, stage: 'turn-done', drawnCard: null, pendingEffectCard: null, pendingSelection: null }
}

/** Ends the current player's turn and figures out what happens next. */
function advanceTurn(state: GameState): GameState {
  const peekHighlights = { ...state.peekHighlights }
  delete peekHighlights[state.currentPlayerIndex]
  const cleared = { ...state, drawnCard: null, pendingEffectCard: null, pendingSelection: null, peekHighlights }

  if (cleared.caboDeclaredBy !== null) {
    const remaining = cleared.finalTurnsRemaining - 1
    if (remaining <= 0) {
      return {
        ...cleared,
        stage: 'round-end',
        finalTurnsRemaining: 0,
        log: [...cleared.log, msg('roundEndLog')],
      }
    }
    return {
      ...cleared,
      stage: 'turn-start',
      currentPlayerIndex: nextPlayerIndex(cleared),
      finalTurnsRemaining: remaining,
    }
  }

  return {
    ...cleared,
    stage: 'turn-start',
    currentPlayerIndex: nextPlayerIndex(cleared),
  }
}

/** Moves on to the next player without consuming a "final turn" — used right after a Cabo declaration. */
function moveToNextPlayer(state: GameState): GameState {
  return { ...state, stage: 'turn-start', currentPlayerIndex: nextPlayerIndex(state) }
}

function withLog(state: GameState, message: Message): GameState {
  return { ...state, log: [...state.log, message] }
}

function msg(key: string, params?: Record<string, string | number>): Message {
  return params ? { key, params } : { key }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESTART':
      return createInitialState()

    case 'START_GAME': {
      if (action.names.length < 2 || action.names.length > 6) return state

      let deck = shuffle(createDeck())
      const players: PlayerState[] = action.names.map((name, id) => ({ id, name, hand: [] }))

      for (let round = 0; round < HAND_SIZE; round++) {
        for (const player of players) {
          const card = deck[deck.length - 1]
          deck = deck.slice(0, -1)
          player.hand.push(card)
        }
      }

      const topCard = deck[deck.length - 1]
      deck = deck.slice(0, -1)

      return {
        ...createInitialState(),
        stage: 'initial-peek',
        players,
        deck,
        discard: [topCard],
        initialPeek: { playerIndex: 0, pickedIndices: [] },
        log: [
          msg('gameStartLog'),
          msg('initialPeekTurnLog', { name: players[0].name }),
        ],
      }
    }

    case 'CONFIRM_PEEK_DONE': {
      if (state.stage !== 'initial-peek' || !state.initialPeek) return state
      if (state.initialPeek.pickedIndices.length < INITIAL_PEEK_COUNT) return state

      const next = state.initialPeek.playerIndex + 1
      if (next >= state.players.length) {
        return {
          ...state,
          stage: 'turn-start',
          initialPeek: null,
          currentPlayerIndex: 0,
          log: [...state.log, msg('readyStartLog', { name: state.players[0].name })],
        }
      }

      return {
        ...state,
        initialPeek: { playerIndex: next, pickedIndices: [] },
        log: [...state.log, msg('initialPeekTurnLog', { name: state.players[next].name })],
      }
    }

    case 'DRAW_CARD': {
      if (state.stage !== 'turn-start') return state
      const player = state.players[state.currentPlayerIndex]
      const { card, deck, discard } = drawFromDeck(state.deck, state.discard)

      return {
        ...state,
        stage: 'drawn',
        deck,
        discard,
        drawnCard: card,
        overlay: {
          viewerIndex: state.currentPlayerIndex,
          heading: msg('drawnOverlayHeading'),
          description: msg('drawnOverlayDescription'),
          cards: [{ card }],
          confirmLabel: msg('confirmedLabel'),
          then: 'nothing',
        },
        log: [...state.log, msg('drawCardLog', { name: player.name })],
      }
    }

    case 'DISCARD_DRAWN': {
      if (state.stage !== 'drawn' || !state.drawnCard) return state
      const player = state.players[state.currentPlayerIndex]
      const card = state.drawnCard
      const discard = [...state.discard, card]
      const base = withLog(
        { ...state, discard, drawnCard: null },
        msg('discardedDrawnLog', { name: player.name, rank: rankParam(card.rank) }),
      )

      if (isSpecialRank(card.rank)) {
        return { ...base, stage: 'effect-choice', pendingEffectCard: card }
      }
      return readyForTurnDone(base)
    }

    case 'USE_EFFECT': {
      if (state.stage !== 'effect-choice' || !state.pendingEffectCard) return state
      const rank = state.pendingEffectCard.rank
      let stage: Stage = state.stage
      if (rank === 10) stage = 'effect-10-select'
      else if (rank === 11) stage = 'effect-11-select'
      else if (rank === 12) stage = 'effect-12-select-own'
      return { ...state, stage }
    }

    case 'SKIP_EFFECT': {
      if (state.stage !== 'effect-choice') return state
      return readyForTurnDone(withLog(state, msg('skippedEffectLog')))
    }

    case 'DECLARE_CABO': {
      if (state.caboDeclaredBy !== null) return state
      if (state.stage !== 'turn-start' && state.stage !== 'drawn') return state
      const player = state.players[state.currentPlayerIndex]
      // If a card was already drawn, put it on the discard pile before declaring
      const discard = state.drawnCard ? [...state.discard, state.drawnCard] : state.discard
      const declared = withLog(
        {
          ...state,
          drawnCard: null,
          discard,
          caboDeclaredBy: state.currentPlayerIndex,
          finalTurnsRemaining: state.players.length - 1,
        },
        msg('declaredCaboLog', { name: player.name, count: state.players.length - 1 }),
      )
      return moveToNextPlayer(declared)
    }

    case 'SELECT_CARD':
      return handleSelectCard(state, action.playerIndex, action.cardIndex)

    case 'OPEN_MATCH_ATTEMPT': {
      if (state.overlay || state.matchAttempt) return state
      if (state.stage === 'setup' || state.stage === 'initial-peek' || state.stage === 'round-end') return state
      if (state.discard.length === 0) return state
      return { ...state, matchAttempt: { step: 'choose-player', playerIndex: null } }
    }

    case 'CANCEL_MATCH_ATTEMPT':
      return { ...state, matchAttempt: null }

    case 'MATCH_SELECT_PLAYER': {
      if (!state.matchAttempt || state.matchAttempt.step !== 'choose-player') return state
      if (state.players[action.playerIndex].hand.length === 0) return state
      return { ...state, matchAttempt: { step: 'choose-card', playerIndex: action.playerIndex } }
    }

    case 'MATCH_SELECT_CARD':
      return resolveMatchAttempt(state, action.cardIndex)

    case 'DISMISS_OVERLAY': {
      if (!state.overlay) return state
      const { then } = state.overlay
      const cleared = { ...state, overlay: null }
      return then === 'advance-turn' ? readyForTurnDone(cleared) : cleared
    }

    case 'END_TURN': {
      if (state.stage !== 'turn-done') return state
      return advanceTurn(state)
    }

    default:
      return state
  }
}

function handleSelectCard(state: GameState, playerIndex: number, cardIndex: number): GameState {
  switch (state.stage) {
    case 'initial-peek': {
      const peek = state.initialPeek
      if (!peek || playerIndex !== peek.playerIndex) return state
      if (peek.pickedIndices.includes(cardIndex) || peek.pickedIndices.length >= INITIAL_PEEK_COUNT) return state

      const player = state.players[playerIndex]
      const card = player.hand[cardIndex]
      const prevIndices = state.peekHighlights[playerIndex] ?? []
      return {
        ...state,
        initialPeek: { ...peek, pickedIndices: [...peek.pickedIndices, cardIndex] },
        peekHighlights: { ...state.peekHighlights, [playerIndex]: [...prevIndices, cardIndex] },
        overlay: {
          viewerIndex: playerIndex,
          heading: msg('yourCardLabel', { name: player.name, index: cardIndex + 1 }),
          cards: [{ card }],
          confirmLabel: msg('rememberedLabel'),
          then: 'nothing',
        },
      }
    }

    case 'drawn': {
      if (playerIndex !== state.currentPlayerIndex || !state.drawnCard) return state
      const players = clonePlayers(state.players)
      const player = players[playerIndex]
      const oldCard = player.hand[cardIndex]
      player.hand[cardIndex] = state.drawnCard
      const discard = [...state.discard, oldCard]

      const base = withLog(
        { ...state, players, discard, drawnCard: null },
        msg('swappedCardLog', { name: player.name, index: cardIndex + 1, rank: rankParam(oldCard.rank) }),
      )

      if (isSpecialRank(oldCard.rank)) {
        return { ...base, stage: 'effect-choice', pendingEffectCard: oldCard }
      }
      return readyForTurnDone(base)
    }

    case 'effect-10-select': {
      if (playerIndex !== state.currentPlayerIndex) return state
      const player = state.players[playerIndex]
      const card = player.hand[cardIndex]
      const prevIndices = state.peekHighlights[playerIndex] ?? []
      return {
        ...state,
        peekHighlights: { ...state.peekHighlights, [playerIndex]: [...prevIndices, cardIndex] },
        overlay: {
          viewerIndex: playerIndex,
          heading: msg('peekedOwnOverlayHeading'),
          cards: [{ card, caption: msg('peekedOwnCardCaption', { index: cardIndex + 1 }) }],
          confirmLabel: msg('rememberedLabel'),
          then: 'advance-turn',
        },
      }
    }

    case 'effect-11-select': {
      if (playerIndex === state.currentPlayerIndex) return state
      const viewer = state.players[state.currentPlayerIndex]
      const target = state.players[playerIndex]
      const card = target.hand[cardIndex]
      return {
        ...state,
        overlay: {
          viewerIndex: state.currentPlayerIndex,
          heading: msg('peekedOpponentOverlayHeading', { name: target.name }),
          description: msg('peekedOpponentOverlayDescription', { name: viewer.name }),
          cards: [{ card, caption: msg('peekedOpponentCardCaption', { name: target.name, index: cardIndex + 1 }) }],
          confirmLabel: msg('rememberedLabel'),
          then: 'advance-turn',
        },
      }
    }

    case 'effect-12-select-own': {
      if (playerIndex !== state.currentPlayerIndex) return state
      return {
        ...state,
        stage: 'effect-12-select-target',
        pendingSelection: { ownIndex: cardIndex },
      }
    }

    case 'effect-12-select-target': {
      if (playerIndex === state.currentPlayerIndex || !state.pendingSelection) return state
      const ownIndex = state.pendingSelection.ownIndex
      const players = clonePlayers(state.players)
      const me = players[state.currentPlayerIndex]
      const them = players[playerIndex]
      const tmp = me.hand[ownIndex]
      me.hand[ownIndex] = them.hand[cardIndex]
      them.hand[cardIndex] = tmp

      const done = readyForTurnDone({ ...state, players, pendingSelection: null })
      return withLog(done, msg('swappedBlindLog', { name: me.name, target: them.name }))
    }

    default:
      return state
  }
}

function resolveMatchAttempt(state: GameState, cardIndex: number): GameState {
  if (!state.matchAttempt || state.matchAttempt.step !== 'choose-card' || state.matchAttempt.playerIndex === null) {
    return state
  }
  if (state.discard.length === 0) return { ...state, matchAttempt: null }

  // Only the current player may initiate a match attempt (enforced in the UI),
  // so `currentPlayerIndex` is always the caller.
  const callerIndex = state.currentPlayerIndex
  const targetIndex = state.matchAttempt.playerIndex
  const players = clonePlayers(state.players)
  const caller = players[callerIndex]
  const target = players[targetIndex]
  if (cardIndex < 0 || cardIndex >= target.hand.length) return state

  const card = target.hand[cardIndex]
  const top = state.discard[state.discard.length - 1]
  const success = card.rank === top.rank
  const isOwnCard = targetIndex === callerIndex

  // The targeted card always leaves the hand and stays on the discard pile,
  // whether or not it actually matched the top card.
  target.hand.splice(cardIndex, 1)
  let deck = state.deck
  let discard = [...state.discard, card]
  let log = state.log

  // The removed card shifts every later index in this hand, so any
  // previously-remembered peek positions for it are no longer valid.
  const peekHighlights = { ...state.peekHighlights }
  delete peekHighlights[targetIndex]

  if (success && !isOwnCard) {
    // Correctly called out an opponent's matching card: it's discarded, and
    // the opponent draws 2 replacement cards as a penalty.
    for (let i = 0; i < 2; i++) {
      const drawn = drawFromDeck(deck, discard)
      deck = drawn.deck
      discard = drawn.discard
      target.hand.push(drawn.card)
    }
    log = [
      ...log,
      msg('matchSuccessOpponentLog', { name: caller.name, target: target.name, rank: rankParam(card.rank), count: target.hand.length }),
    ]
  } else if (success) {
    log = [...log, msg('matchSuccessLog', { name: target.name, rank: rankParam(top.rank), count: target.hand.length })]
  } else {
    // No match: the card stays discarded regardless, and the caller draws 2 penalty cards.
    for (let i = 0; i < 2; i++) {
      const drawn = drawFromDeck(deck, discard)
      deck = drawn.deck
      discard = drawn.discard
      caller.hand.push(drawn.card)
    }
    log = [
      ...log,
      msg('matchFailLog', { name: caller.name, target: target.name, rank: rankParam(card.rank), topRank: rankParam(top.rank), count: caller.hand.length }),
    ]
  }

  return {
    ...state,
    players,
    deck,
    discard,
    matchAttempt: null,
    peekHighlights,
    log,
    overlay: {
      viewerIndex: null,
      heading: msg(success ? 'matchSuccessHeading' : 'matchFailHeading'),
      description: success
        ? (isOwnCard
            ? msg('matchSuccessDescription', { name: target.name, rank: rankParam(card.rank), topRank: rankParam(top.rank) })
            : msg('matchSuccessOpponentDescription', { name: caller.name, target: target.name, rank: rankParam(card.rank), topRank: rankParam(top.rank) }))
        : msg('matchFailDescription', { name: caller.name, target: target.name, rank: rankParam(card.rank), topRank: rankParam(top.rank) }),
      cards: [{ card, caption: { key: 'plainName', params: { name: target.name } } }],
      confirmLabel: msg('closeLabel'),
      then: 'nothing',
    },
  }
}

export function totalScore(player: PlayerState): number {
  return player.hand.reduce((sum, card) => sum + card.rank, 0)
}
