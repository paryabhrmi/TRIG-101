import { useEffect, useState } from 'react'
import { STEPS, stepName } from './lessonPane'
import type { LessonPaneProps } from './lessonPane'

/**
 * The bottom sheet — the app's whole share of the screen.
 *
 * The artboard above is the input surface and its own instrument panel; this
 * sheet carries only what the file cannot know: what the learner is being
 * asked to do, how far off it they still are, and what happens next.
 *
 * It meets the bottom edge of the artboard and runs to the bottom of the
 * screen, so the space under a short artboard belongs to the sheet rather than
 * to a band of empty paper. Its own height therefore never changes between
 * steps — which matters, because the artboards' sliders are dragged by thumb
 * and a canvas that resizes mid-drag moves the knob out from under the finger.
 * A step with more to say scrolls inside the sheet instead of growing it.
 */

/** How long a hint stays up before the slot returns to its instrument. */
const HINT_MS = 8000

export function LessonSheet({
  lesson,
  step,
  onStep,
  solved,
  values,
  aim,
  conditions,
  showHint,
  onHint,
  after,
  onNext,
}: LessonPaneProps) {
  // A revealed hint takes the instrument slot rather than adding a row, so the
  // sheet never reflows to say something.
  const [hintUp, setHintUp] = useState(false)

  useEffect(() => {
    if (!showHint) return setHintUp(false)
    setHintUp(true)
    const id = window.setTimeout(() => setHintUp(false), HINT_MS)
    return () => window.clearTimeout(id)
  }, [showHint, lesson.id])

  useEffect(() => setHintUp(false), [step, lesson.id])

  const doing = step === 'do'
  const learning = step === 'learn'
  // A lesson without a checkpoint has nothing to aim at, so the task line
  // keeps naming the action.
  const task = doing ? (lesson.checkpoint?.goal ?? lesson.watch) : lesson.watch
  const hint = lesson.checkpoint?.hint

  return (
    <section
      className={`sheet ${solved && doing ? 'is-hit' : ''}`.trim()}
      aria-label="Lesson"
    >
      <span className="sheet__grip" aria-hidden="true" />

      <div className="sheet__scroll">
        {learning ? (
          <>
            {solved && (
              <p className="sheet__win">
                <span aria-hidden="true">✓</span> Nice — that is the idea
              </p>
            )}
            <h2 className="sheet__title">{lesson.title}</h2>
            <div className="sheet__prose">
              {lesson.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="sheet__step">
              Step {STEPS.indexOf(step) + 1} of {STEPS.length} · {stepName(step)}
            </p>

            <p className="sheet__task">{task}</p>

            {/* The sheet runs to the bottom of the screen now, so there is
                finally room for the line that says why the task is worth
                doing. The 180px dock it replaced could only fit the order. */}
            <p className="sheet__lede">{doing ? lesson.watch : lesson.tagline}</p>

            {/* One slot: a hint if the learner asked for one, otherwise
                whatever this lesson measures — and nothing at all for the
                lessons whose artboard already says everything. */}
            <div className="sheet__slot">
              {hintUp && hint ? (
                <p className="sheet__hintline">{hint}</p>
              ) : !doing ? null : lesson.readouts.length ? (
                <ul className="cells">
                  {lesson.readouts.map((r, i) => (
                    <li key={r.id} className="cells__c">
                      <span className="cells__l">{r.label}</span>
                      <span className="cells__v">{values[i] ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              ) : lesson.conditions?.length ? (
                <ul className="conds">
                  {lesson.conditions.map((c, i) => (
                    <li
                      key={c.label}
                      className={`conds__c ${conditions[i] ? 'is-on' : ''}`.trim()}
                    >
                      <span className="conds__b" aria-hidden="true">
                        {conditions[i] ? '✓' : ''}
                      </span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              ) : aim !== null && lesson.checkpoint?.target ? (
                <div className="aim">
                  <span className="aim__goal">{lesson.checkpoint.target.label}</span>
                  <span className="aim__track">
                    <i className="aim__fill" style={{ width: `${Math.round(aim * 100)}%` }} />
                  </span>
                  <span className="aim__state">{aimWord(aim, solved)}</span>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Pinned under the scroll, so the way forward is reachable however long
          the step above it runs. */}
      <div className="sheet__act">
        {learning ? (
          <button type="button" className="btn btn--primary btn--wide" onClick={onNext}>
            {after?.kind === 'review'
              ? 'Chapter review'
              : after?.kind === 'lesson'
                ? 'Next lesson'
                : 'Finish'}
          </button>
        ) : !doing ? (
          <button
            type="button"
            className="btn btn--primary btn--wide"
            onClick={() => onStep('do')}
          >
            Try it
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--ghost btn--wide"
              onClick={() => onStep('learn')}
            >
              {solved ? 'Why it works' : 'Skip'}
            </button>

            {hint && (
              <button
                type="button"
                className="sheet__hint"
                onClick={onHint}
                aria-label="Show a hint"
              >
                ?
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

/** Three words is the whole vocabulary — the artboard prints the number. */
function aimWord(aim: number, solved: boolean): string {
  if (solved) return 'got it'
  if (aim > 0.92) return 'almost'
  return 'keep going'
}
