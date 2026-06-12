import type { CoinSession, GameState } from '../game/types'

export interface PlayerSlot {
  uid: string
  name: string
}

export type RoomStatus = 'lobby' | 'playing'

export interface RoomDoc {
  hostUid: string
  status: RoomStatus
  maxPlayers: number
  playerSlots: (PlayerSlot | null)[]
  gameState: GameState | null
  coinSession: CoinSession | null
}
