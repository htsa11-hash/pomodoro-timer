import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translations, type Locale, type TranslationKey } from './translations'
import type { Message } from '../game/types'

const STORAGE_KEY = 'cabo-locale'
const DEFAULT_LOCALE: Locale = 'ja'

type TranslationParams = Record<string, string | number>

function loadSavedLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'ja' || saved === 'en' || saved === 'es') return saved
  return DEFAULT_LOCALE
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
  /** Translates a `Message` object (`{ key, params }`) produced by the game reducer. */
  tMessage: (message: Message) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const RANK_LABEL_KEYS: Record<string, TranslationKey> = {
  '10': 'rank10',
  '11': 'rank11',
  '12': 'rank12',
}

/** Resolves `rank:<n>` marker values (produced by `rankParam`) to their translated labels. */
function resolveParamValue(value: string | number, dict: Record<string, string>): string {
  if (typeof value === 'string' && value.startsWith('rank:')) {
    const rank = value.slice('rank:'.length)
    const labelKey = RANK_LABEL_KEYS[rank]
    if (labelKey) return dict[labelKey] ?? rank
    return rank
  }
  return String(value)
}

function interpolate(template: string, params: TranslationParams | undefined, dict: Record<string, string>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key]
    return value === undefined ? match : resolveParamValue(value, dict)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadSavedLocale)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const dict = translations[locale] as Record<string, string>
      const template = dict[key] ?? (translations[DEFAULT_LOCALE] as Record<string, string>)[key] ?? key
      return interpolate(template, params, dict)
    },
    [locale],
  )

  const tMessage = useCallback(
    (message: Message) => t(message.key as TranslationKey, message.params),
    [t],
  )

  const value = useMemo(() => ({ locale, setLocale, t, tMessage }), [locale, setLocale, t, tMessage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within an I18nProvider')
  return ctx
}
