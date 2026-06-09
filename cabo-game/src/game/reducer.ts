import { createDeck, drawFromDeck, isSpecialRank, rankLabel, shuffle } from './deck'
import type { GameAction, GameState, PlayerState, Stage } from './types'

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
        log: [...cleared.log, 'ラウンド終了！全員のカードを公開します。'],
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

function withLog(state: GameState, message: string): GameState {
  return { ...state, log: [...state.log, message] }
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
          'ゲームを開始しました。各プレイヤーは自分のカードを2枚だけ確認できます。',
          `${players[0].name} さんの番です。スマホ・画面を他の人に見られないようにして確認してください。`,
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
          log: [...state.log, `準備完了！ ${state.players[0].name} さんのターンから開始します。`],
        }
      }

      return {
        ...state,
        initialPeek: { playerIndex: next, pickedIndices: [] },
        log: [...state.log, `${state.players[next].name} さんの番です。画面を他の人に見られないようにして確認してください。`],
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
          heading: '引いたカード',
          description: '交換するか、そのまま捨てるか選びましょう。',
          cards: [{ card }],
          confirmLabel: '確認した',
          then: 'nothing',
        },
        log: [...state.log, `${player.name} が山札からカードを引きました。`],
      }
    }

    case 'DISCARD_DRAWN': {
      if (state.stage !== 'drawn' || !state.drawnCard) return state
      const player = state.players[state.currentPlayerIndex]
      const card = state.drawnCard
      const discard = [...state.discard, card]
      const base = withLog(
        { ...state, discard, drawnCard: null },
        `${player.name} は引いたカード（${rankLabel(card.rank)}）をそのまま捨てました。`,
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
      return readyForTurnDone(withLog(state, '効果を使いませんでした。'))
    }

    case 'DECLARE_CABO': {
      if (state.stage !== 'turn-start' || state.caboDeclaredBy !== null) return state
      const player = state.players[state.currentPlayerIndex]
      const declared = withLog(
        {
          ...state,
          caboDeclaredBy: state.currentPlayerIndex,
          finalTurnsRemaining: state.players.length - 1,
        },
        `${player.name} が「Cabo」を宣言しました！ 残り ${state.players.length - 1} 人が最後のターンを行います。`,
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
          heading: `${player.name} のカード（位置 ${cardIndex + 1}）`,
          cards: [{ card }],
          confirmLabel: '覚えた',
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
        `${player.name} は位置 ${cardIndex + 1} のカードと交換し、古いカード（${rankLabel(oldCard.rank)}）を捨てました。`,
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
          heading: '自分のカードを確認（効果：10）',
          cards: [{ card, caption: `位置 ${cardIndex + 1}` }],
          confirmLabel: '覚えた',
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
          heading: `${target.name} のカードを確認（効果：11）`,
          description: `${viewer.name} だけがこのカードを見ることができます。`,
          cards: [{ card, caption: `${target.name} の位置 ${cardIndex + 1}` }],
          confirmLabel: '覚えた',
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
      return withLog(done, `${me.name} は ${them.name} と中身を見ずにカードを交換しました（効果：12）。`)
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

  const playerIndex = state.matchAttempt.playerIndex
  const players = clonePlayers(state.players)
  const player = players[playerIndex]
  if (cardIndex < 0 || cardIndex >= player.hand.length) return state

  const card = player.hand[cardIndex]
  const top = state.discard[state.discard.length - 1]
  const success = card.rank === top.rank

  let deck = state.deck
  let discard = state.discard
  let log = state.log

  if (success) {
    player.hand.splice(cardIndex, 1)
    discard = [...discard, card]
    log = [...log, `${player.name} は捨て札（${rankLabel(top.rank)}）と一致するカードを当てて捨てました！ 手札が ${player.hand.length} 枚になりました。`]
  } else {
    const drawn = drawFromDeck(deck, discard)
    deck = drawn.deck
    discard = drawn.discard
    player.hand.push(drawn.card)
    log = [...log, `${player.name} のカードは一致しませんでした。ペナルティで山札からカードを1枚引きました（手札 ${player.hand.length} 枚）。`]
  }

  return {
    ...state,
    players,
    deck,
    discard,
    matchAttempt: null,
    log,
    overlay: {
      viewerIndex: null,
      heading: success ? '一致！カードを捨てました' : '残念、一致しませんでした',
      description: success
        ? `${player.name} のカードは ${rankLabel(card.rank)} で、捨て札（${rankLabel(top.rank)}）と一致しました。`
        : `${player.name} のカードは ${rankLabel(card.rank)} でした。捨て札（${rankLabel(top.rank)}）とは一致せず、ペナルティでカードが1枚増えました。`,
      cards: [{ card, caption: player.name }],
      confirmLabel: '閉じる',
      then: 'nothing',
    },
  }
}

export function totalScore(player: PlayerState): number {
  return player.hand.reduce((sum, card) => sum + card.rank, 0)
}
