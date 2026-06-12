import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/I18nContext'
import type { TranslationKey } from '../i18n/translations'
import type { GameAction } from '../game/types'
import {
  createRoom as createRoomApi,
  dispatchGameAction,
  ensureSignedIn,
  joinRoom as joinRoomApi,
  requestNewGame,
  requestNextRound,
  startGame as startGameApi,
  subscribeActions,
  subscribeRoom,
} from './roomApi'
import type { RoomDoc } from './types'

const STORAGE_KEY = 'cabo-online-room'

interface SavedSession {
  code: string
}

function loadSavedCode(): string | null {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  try {
    const session = JSON.parse(saved) as SavedSession
    return session.code ?? null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const ERROR_KEYS = new Set<string>([
  'errorCreateRoomFailed',
  'errorRoomNotFound',
  'errorRoomAlreadyStarted',
  'errorRoomFull',
  'errorRoomNotFoundOnSubscribe',
])

export function useRoom() {
  const { t } = useTranslation()
  const [uid, setUid] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(loadSavedCode)
  const [room, setRoom] = useState<RoomDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const translateError = useCallback(
    (e: unknown): string => {
      const message = e instanceof Error ? e.message : String(e)
      return ERROR_KEYS.has(message) ? t(message as TranslationKey) : message
    },
    [t],
  )

  const roomRef = useRef<RoomDoc | null>(null)
  useEffect(() => {
    roomRef.current = room
  }, [room])

  useEffect(() => {
    ensureSignedIn()
      .then(setUid)
      .catch((e) => setError(translateError(e)))
  }, [translateError])

  useEffect(() => {
    if (!code) return
    return subscribeRoom(code, (next) => {
      if (!next) {
        setError(t('errorRoomNotFoundOnSubscribe'))
        setCode(null)
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      setRoom(next)
    })
  }, [code, t])

  const isHost = !!uid && !!room && room.hostUid === uid

  useEffect(() => {
    if (!code || !isHost) return
    return subscribeActions(code, () => roomRef.current?.gameState ?? null)
  }, [code, isHost])

  const createRoom = useCallback(
    async (name: string) => {
      if (!uid) return
      setBusy(true)
      setError(null)
      try {
        const newCode = await createRoomApi(uid, name)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: newCode }))
        setCode(newCode)
      } catch (e) {
        setError(translateError(e))
      } finally {
        setBusy(false)
      }
    },
    [uid, translateError],
  )

  const joinRoom = useCallback(
    async (joinCode: string, name: string) => {
      if (!uid) return
      setBusy(true)
      setError(null)
      try {
        const normalized = joinCode.trim().toUpperCase()
        await joinRoomApi(normalized, uid, name)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: normalized }))
        setCode(normalized)
      } catch (e) {
        setError(translateError(e))
      } finally {
        setBusy(false)
      }
    },
    [uid, translateError],
  )

  const startGame = useCallback(
    (startingCoins: number, betAmount: number) => {
      if (!code || !room) return
      void startGameApi(code, room, startingCoins, betAmount)
    },
    [code, room],
  )

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!code || !room) return
      void dispatchGameAction(code, room, isHost, action)
    },
    [code, room, isHost],
  )

  const nextRound = useCallback(
    (newBalances: number[]) => {
      if (!code || !room) return
      void requestNextRound(code, room, newBalances)
    },
    [code, room],
  )

  const newGame = useCallback(() => {
    if (!code) return
    void requestNewGame(code)
  }, [code])

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCode(null)
    setRoom(null)
    setError(null)
  }, [])

  const myPlayerIndex = room && uid ? room.playerSlots.findIndex((s) => s?.uid === uid) : -1

  return {
    uid,
    code,
    room,
    error,
    busy,
    isHost,
    myPlayerIndex: myPlayerIndex >= 0 ? myPlayerIndex : null,
    createRoom,
    joinRoom,
    startGame,
    dispatch,
    nextRound,
    newGame,
    leaveRoom,
    clearError: () => setError(null),
  }
}
