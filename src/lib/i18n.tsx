import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'fa'

/** Every user-facing string in the app carries both languages. */
export type Localized = { en: string; fa: string }

const STORE_KEY = 'trig101.lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved === 'en' || saved === 'fa') return saved
  } catch {
    /* private mode — fall through to the language heuristic */
  }
  return navigator.language?.toLowerCase().startsWith('fa') ? 'fa' : 'en'
}

interface I18n {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
  /** Resolve a localized record against the active language. */
  t: (value: Localized) => string
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
  const dir = lang === 'fa' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORE_KEY, l)
    } catch {
      /* persistence is a nicety, not a requirement */
    }
  }, [])

  const value = useMemo<I18n>(
    () => ({ lang, dir, setLang, t: (v) => v[lang] }),
    [lang, dir, setLang],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/**
 * Format a number for display. Persian gets Western digits on purpose: the
 * numbers on the Rive canvas are Western, and mixing the two sets in one
 * glance is worse than being slightly less localized.
 */
export function fmt(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '∞'
  return value.toFixed(decimals)
}
