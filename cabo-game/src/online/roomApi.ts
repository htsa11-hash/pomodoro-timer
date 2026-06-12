import { signInAnonymously } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { gameReducer, createInitialState } from '../game/reducer'
import type { GameAction } from '../game/types'
import { db, getFirebaseAuth } from '../firebase/config'
import type { PlayerSlot, RoomDoc } from './types'

const MAX_PLAYERS = 6
const MIN_PLAYERS = 2
// Avoid visually ambiguous characters (0/O, 1/I, etc.)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4

function randomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

function roomRef(code: string) {
  return doc(db, 'rooms', code)
}

function actionsRef(code: string) {
  return collection(db, 'rooms', code, 'actions')
}

export async function ensureSignedIn(): Promise<string> {
  const auth = getFirebaseAuth()
  if (auth.currentUser) return auth.currentUser.uid
  const credential = await signInAnonymously(auth)
  return credential.user.uid
}

export async function createRoom(uid: string, name: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const ref = roomRef(code)
    const existing = await getDoc(ref)
    if (existing.exists()) continue

    const room: Omit<RoomDoc, never> & { createdAt: unknown } = {
      hostUid: uid,
      status: 'lobby',
      maxPlayers: MAX_PLAYERS,
      playerSlots: [{ uid, name }],
      gameState: null,
      coinSession: null,
      createdAt: serverTimestamp(),
    }
    await setDoc(ref, room)
    return code
  }
  throw new Error('errorCreateRoomFailed')
}

export async function joinRoom(code: string, uid: string, name: string): Promise<void> {
  const ref = roomRef(code)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('errorRoomNotFound')
    const room = snap.data() as RoomDoc
    const slots = [...room.playerSlots]

    const existingIndex = slots.findIndex((s) => s?.uid === uid)
    if (existingIndex !== -1) {
      slots[existingIndex] = { uid, name }
      tx.update(ref, { playerSlots: slots })
      return
    }

    if (room.status !== 'lobby') {
      throw new Error('errorRoomAlreadyStarted')
    }
    if (slots.length >= room.maxPlayers) {
      throw new Error('errorRoomFull')
    }
    slots.push({ uid, name })
    tx.update(ref, { playerSlots: slots })
  })
}

export function subscribeRoom(code: string, onChange: (room: RoomDoc | null) => void): Unsubscribe {
  return onSnapshot(roomRef(code), (snap) => {
    onChange(snap.exists() ? (snap.data() as RoomDoc) : null)
  })
}

export async function startGame(code: string, room: RoomDoc, startingCoins: number, betAmount: number): Promise<void> {
  const players = room.playerSlots.filter((s): s is PlayerSlot => s !== null)
  if (players.length < MIN_PLAYERS) return
  const names = players.map((p) => p.name)

  let state = createInitialState()
  state = gameReducer(state, { type: 'START_GAME', names })

  await updateDoc(roomRef(code), {
    status: 'playing',
    gameState: state,
    coinSession: {
      playerNames: names,
      balances: names.map(() => startingCoins),
      betAmount,
    },
  })
}

export async function dispatchGameAction(code: string, room: RoomDoc, isHost: boolean, action: GameAction): Promise<void> {
  if (isHost) {
    if (!room.gameState) return
    const ref = roomRef(code)
    // Read-modify-write inside a transaction so a concurrently-processed guest
    // action (see subscribeActions) can't be silently overwritten by a stale read.
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const current = snap.data() as RoomDoc | undefined
      if (!current?.gameState) return
      const next = gameReducer(current.gameState, action)
      tx.update(ref, { gameState: next })
    })
    return
  }
  await addDoc(actionsRef(code), { action, createdAt: serverTimestamp() })
}

/**
 * Host-only: listens for actions queued by guest players, applies them to the
 * shared game state in arrival order, and clears the queue.
 */
export function subscribeActions(
  code: string,
  getGameState: () => RoomDoc['gameState'],
): Unsubscribe {
  const processed = new Set<string>()
  const q = query(actionsRef(code), orderBy('createdAt'))
  const ref = roomRef(code)

  return onSnapshot(q, async (snap) => {
    const pending: { id: string; action: GameAction }[] = []

    for (const change of snap.docChanges()) {
      if (change.type === 'removed') continue
      const id = change.doc.id
      if (processed.has(id)) continue
      const data = change.doc.data() as { action: GameAction; createdAt: unknown }
      if (data.createdAt == null) continue

      processed.add(id)
      pending.push({ id, action: data.action })
    }

    if (pending.length === 0) return

    // Read-modify-write inside a transaction so concurrent dispatches (host
    // actions or overlapping snapshot callbacks) can't clobber each other's
    // updates with a stale `gameState` read.
    await runTransaction(db, async (tx) => {
      const snapDoc = await tx.get(ref)
      const current = snapDoc.data() as RoomDoc | undefined
      let state = current?.gameState ?? getGameState()
      if (!state) return
      for (const { action } of pending) {
        state = gameReducer(state, action)
      }
      tx.update(ref, { gameState: state })
    })

    await Promise.all(pending.map(({ id }) => deleteDoc(doc(db, 'rooms', code, 'actions', id))))
  })
}

export async function requestNextRound(code: string, room: RoomDoc, newBalances: number[]): Promise<void> {
  if (!room.gameState || !room.coinSession) return
  const names = room.coinSession.playerNames
  let state = gameReducer(room.gameState, { type: 'RESTART' })
  state = gameReducer(state, { type: 'START_GAME', names })

  await updateDoc(roomRef(code), {
    gameState: state,
    coinSession: { ...room.coinSession, balances: newBalances },
  })
}

export async function requestNewGame(code: string): Promise<void> {
  await updateDoc(roomRef(code), {
    status: 'lobby',
    gameState: null,
    coinSession: null,
  })
}
