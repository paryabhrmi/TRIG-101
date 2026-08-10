import { useCallback, useEffect, useState } from 'react'

const KEY = 'trig101.progress.v1'

export type Progress = Record<string, boolean>

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Progress
  } catch {
    return {}
  }
}

function write(value: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* storage can be unavailable; progress is then session-only */
  }
}

/** Cross-component progress store, kept in sync through a window event. */
const EVENT = 'trig101:progress'

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(read)

  useEffect(() => {
    const sync = () => setProgress(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const complete = useCallback((id: string) => {
    const next = { ...read(), [id]: true }
    write(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  const resetAll = useCallback(() => {
    write({})
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { progress, complete, resetAll }
}
