import { useEffect, useRef, useState } from 'react'
import type { Rive } from '@rive-app/react-canvas'
import type { Lesson, Sample } from '../data/curriculum'
import type { Lang } from './i18n'

/** How often the readouts refresh. Fast enough to feel live, slow enough
 *  that dragging a slider does not fight React for the main thread. */
const POLL_MS = 70

/** A checkpoint has to hold for this long before it counts, so a value
 *  swept through on the way somewhere else does not award the lesson. */
const DWELL_MS = 350

export interface Instruments {
  /** Formatted readout strings, index-aligned with `lesson.readouts`. */
  values: string[]
  /** True once the lesson's checkpoint has been satisfied. */
  solved: boolean
  /** Marks the checkpoint satisfied from outside (e.g. an action button). */
  markSolved: () => void
}

/**
 * Mirrors the live artboard state into React.
 *
 * Rather than declaring which properties each lesson needs, the sample is a
 * proxy that reads straight through to the view model on property access. A
 * readout formatter can therefore ask for any property by name and always get
 * the current frame's value.
 */
export function useInstruments(
  rive: Rive | null,
  lesson: Lesson,
  alreadyDone: boolean,
  lang: Lang,
): Instruments {
  const [values, setValues] = useState<string[]>(() => lesson.readouts.map(() => '—'))
  const [solved, setSolved] = useState(alreadyDone)

  // Keep the latest lesson/solved state reachable from the interval without
  // tearing down and rebuilding the loop on every render.
  const lessonRef = useRef(lesson)
  lessonRef.current = lesson
  const solvedRef = useRef(solved)
  solvedRef.current = solved
  // Textual readouts follow the UI language; the next tick picks it up.
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    setSolved(alreadyDone)
  }, [alreadyDone, lesson.id])

  useEffect(() => {
    if (!rive) return

    const numberCache = new Map<string, { value: number } | null>()
    let inputs: { name: string; value?: unknown }[] = []
    try {
      inputs = rive.stateMachineInputs(lessonRef.current.stateMachine) ?? []
    } catch {
      inputs = []
    }

    const readNumber = (name: string): number => {
      if (!numberCache.has(name)) {
        let prop: { value: number } | null = null
        try {
          prop = rive.viewModelInstance?.number(name) ?? null
        } catch {
          prop = null
        }
        numberCache.set(name, prop)
      }
      const prop = numberCache.get(name)
      const v = prop?.value
      return typeof v === 'number' && Number.isFinite(v) ? v : 0
    }

    const readBool = (name: string): boolean => {
      const input = inputs.find((i) => i.name === name)
      return input?.value === true
    }

    // Snapshot the boolean inputs the lesson cares about, so a checkpoint can
    // ask "did the learner flip this?" without assuming the default is false.
    const baseline: Record<string, boolean> = {}
    for (const name of lessonRef.current.watchInputs ?? []) {
      baseline[name] = readBool(name)
    }

    const sample: Sample = {
      n: new Proxy({} as Record<string, number>, {
        get: (_t, key) => (typeof key === 'string' ? readNumber(key) : 0),
        has: () => true,
      }),
      b: new Proxy({} as Record<string, boolean>, {
        get: (_t, key) => (typeof key === 'string' ? readBool(key) : false),
        has: () => true,
      }),
      b0: baseline,
    }

    let heldSince: number | null = null

    const tick = () => {
      const current = lessonRef.current

      if (current.readouts.length) {
        const next = current.readouts.map((r) => {
          try {
            return r.value(sample, langRef.current)
          } catch {
            return '—'
          }
        })
        setValues((prev) =>
          prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
        )
      }

      const check = current.checkpoint
      if (check && !solvedRef.current) {
        let pass = false
        try {
          pass = check.test(sample)
        } catch {
          pass = false
        }
        if (pass) {
          const now = performance.now()
          if (heldSince === null) heldSince = now
          else if (now - heldSince >= DWELL_MS) setSolved(true)
        } else {
          heldSince = null
        }
      }
    }

    const id = window.setInterval(tick, POLL_MS)
    tick()
    return () => window.clearInterval(id)
  }, [rive, lesson.id])

  const markSolved = () => setSolved(true)

  return { values, solved, markSolved }
}
