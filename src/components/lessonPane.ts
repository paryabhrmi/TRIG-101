import type { Lesson, nextStop } from '../data/curriculum'

/** Watch what to touch → do the task → read why it happened. */
export type Step = 'watch' | 'do' | 'learn'

export const STEPS: Step[] = ['watch', 'do', 'learn']

export const stepName = (s: Step) =>
  s === 'watch' ? 'Find it' : s === 'do' ? 'Try it' : 'Why it works'

/**
 * Everything the bottom sheet needs. The lesson screen owns the state; the
 * sheet only draws it.
 */
export interface LessonPaneProps {
  lesson: Lesson
  step: Step
  onStep: (step: Step) => void
  solved: boolean
  /** Formatted readouts, index-aligned with `lesson.readouts`. */
  values: string[]
  /** 0–1 progress toward `checkpoint.target`, or null if there is none. */
  aim: number | null
  /** Index-aligned with `lesson.conditions`. */
  conditions: boolean[]
  showHint: boolean
  onHint: () => void
  after: ReturnType<typeof nextStop>
  onNext: () => void
}
