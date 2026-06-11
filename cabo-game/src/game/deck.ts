import type { CardData, Rank, Suit } from './types'

export const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos']

export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]

export const SUIT_INFO: Record<Suit, { labelKey: string; symbol: string; color: string }> = {
  oros: { labelKey: 'suitOros', symbol: '◆', color: '#caa40b' },
  copas: { labelKey: 'suitCopas', symbol: '♥', color: '#c0392b' },
  espadas: { labelKey: 'suitEspadas', symbol: '♠', color: '#2c3e50' },
  bastos: { labelKey: 'suitBastos', symbol: '♣', color: '#1e8449' },
}

/** Translation key for a card rank's display label (10/11/12 have special names). */
export function rankLabelKey(rank: Rank): string | null {
  switch (rank) {
    case 10:
      return 'rank10'
    case 11:
      return 'rank11'
    case 12:
      return 'rank12'
    default:
      return null
  }
}

/**
 * Returns a value suitable for use as a `{rank}`-style interpolation parameter
 * in a translated message. For special ranks (10/11/12) this is a `rank:<n>`
 * marker that the i18n interpolator resolves to the translated rank label;
 * for regular ranks it's just the number as a string.
 */
export function rankParam(rank: Rank): string {
  const key = rankLabelKey(rank)
  return key ? `rank:${rank}` : String(rank)
}

export function isSpecialRank(rank: Rank): boolean {
  return rank === 10 || rank === 11 || rank === 12
}

export function createDeck(): CardData[] {
  const cards: CardData[] = []
  let id = 0
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: `card-${id++}`, suit, rank })
    }
  }
  return cards
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Draws the top card from the deck. If the deck is empty, the discard pile
 * (excluding its current top card) is reshuffled into a fresh deck first.
 */
export function drawFromDeck(
  deck: CardData[],
  discard: CardData[],
): { card: CardData; deck: CardData[]; discard: CardData[] } {
  let nextDeck = deck
  let nextDiscard = discard

  if (nextDeck.length === 0) {
    const top = nextDiscard[nextDiscard.length - 1]
    const rest = nextDiscard.slice(0, -1)
    nextDeck = shuffle(rest)
    nextDiscard = top ? [top] : []
  }

  const card = nextDeck[nextDeck.length - 1]
  return { card, deck: nextDeck.slice(0, -1), discard: nextDiscard }
}
