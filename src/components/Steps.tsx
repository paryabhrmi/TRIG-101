import { STEPS, stepName } from './lessonPane'
import type { Step } from './lessonPane'

interface Props {
  step: Step
  /** `Try it` ticks the moment its checkpoint is met, not when it is left. */
  solved: boolean
  onStep: (step: Step) => void
  /**
   * The sheet has always let you jump to any step. The bar only lets you go
   * back: forward is what the action button is for, and letting the stepper
   * skip the task would quietly hand out the answer.
   */
  allowForward?: boolean
  /** The bar's variant, which contributes a fixed 14px to its height. */
  tight?: boolean
}

/**
 * The lesson's three steps, as a track you glance at rather than a sentence
 * you read.
 *
 * It replaced "Step 1 of 3 · Find it" in the bar: the count is what the
 * segments are for, so only the current step's name is spelled out. The same
 * component draws the sheet's row, which used to be a different shape saying
 * the same thing.
 */
export function Steps({ step, solved, onStep, allowForward = false, tight = false }: Props) {
  const at = STEPS.indexOf(step)

  return (
    <nav
      className={`steps ${tight ? 'steps--tight' : ''}`.trim()}
      aria-label={`Lesson steps — step ${at + 1} of ${STEPS.length}`}
    >
      {STEPS.map((s, i) => {
        const current = i === at
        const done = i < at || (s === 'do' && solved)
        const reachable = allowForward || i < at
        return (
          <button
            key={s}
            type="button"
            className={`steps__seg ${current ? 'is-current' : ''} ${
              done ? 'is-done' : ''
            }`.trim()}
            aria-current={current ? 'step' : undefined}
            aria-label={`Step ${i + 1}: ${stepName(s)}`}
            disabled={!reachable}
            onClick={() => onStep(s)}
          >
            <span className="steps__bar" aria-hidden="true" />
          </button>
        )
      })}
      <span className="steps__name">{stepName(step)}</span>
    </nav>
  )
}
