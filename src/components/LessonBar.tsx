import { useEffect, useState } from 'react'
import { STEPS, stepName } from './lessonPane'
import type { LessonPaneProps } from './lessonPane'

/**
 * The lesson bar — the app's whole share of the screen.
 *
 * The artboard above is the input surface and its own instrument panel; this
 * dock carries only what the file cannot know: what the learner is being asked
 * to do, how far off it they still are, and what happens next.
 *
 * Its height is fixed at 216px (see `.lbar` in app.css) across the first two
 * steps. Every row is reserved whether or not it has content, so moving from
 * "find it" to "try it" does not resize the canvas — which matters because the
 * artboards' sliders are dragged by thumb, and a canvas that rescales mid-drag
 * moves the knob out from under the finger.
 */

/** How long a hint stays up before the slot returns to its instrument. */
const HINT_MS = 8000

export function LessonBar({
  lesson,
  step,
  onStep,
  solved,
  values,
  aim,
  conditions,
  showHint,
  onHint,
  toggles,
  onAction,
  ready,
  after,
  onNext,
}: LessonPaneProps) {
  // A revealed hint takes the instrument slot rather than adding a row, then
  // hands it back — so the bar never changes height to say something.
  const [hintUp, setHintUp] = useState(false)

  useEffect(() => {
    if (!showHint) return setHintUp(false)
    setHintUp(true)
    const id = window.setTimeout(() => setHintUp(false), HINT_MS)
    return () => window.clearTimeout(id)
  }, [showHint, lesson.id])

  useEffect(() => setHintUp(false), [step, lesson.id])

  if (step === 'learn') {
    return (
      <div className="lbar lbar--panel">
        {solved && (
          <p className="lbar__win">
            <span aria-hidden="true">✓</span> Nice — that is the idea
          </p>
        )}
        <h2 className="lbar__title">{lesson.title}</h2>
        <div className="lbar__prose">
          {lesson.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <div className="lbar__act">
          <button type="button" className="btn btn--primary btn--wide" onClick={onNext}>
            {after?.kind === 'review'
              ? 'Chapter review'
              : after?.kind === 'lesson'
                ? 'Next lesson'
                : 'Finish'}
          </button>
        </div>
      </div>
    )
  }

  const doing = step === 'do'
  // A lesson without a checkpoint has nothing to aim at, so the task line
  // keeps naming the action. The tagline is a subtitle, not an instruction —
  // and it is the one string here long enough to clip on a short phone.
  const task = doing ? (lesson.checkpoint?.goal ?? lesson.watch) : lesson.watch
  const hint = lesson.checkpoint?.hint
  const actions = lesson.actions ?? []

  return (
    <div className={`lbar ${solved && doing ? 'is-hit' : ''}`.trim()}>
      <p className="lbar__step">
        Step {STEPS.indexOf(step) + 1} of {STEPS.length} · {stepName(step)}
      </p>

      <p className="lbar__task">{task}</p>

      {/* One slot, one line, always 28px: a hint if the learner asked for one,
          otherwise whatever this lesson measures — and nothing at all for the
          lessons whose artboard already says everything. */}
      <div className="lbar__slot">
        {hintUp && hint ? (
          <p className="lbar__hintline">{hint}</p>
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
              <li key={c.label} className={`conds__c ${conditions[i] ? 'is-on' : ''}`.trim()}>
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

      <div className="lbar__act">
        {!doing ? (
          <button type="button" className="btn btn--primary btn--wide" onClick={() => onStep('do')}>
            Try it
          </button>
        ) : (
          <>
            {actions.map((action) => (
              <button
                key={action.input}
                type="button"
                className={`btn ${
                  action.tone === 'ghost' ? 'btn--ghost' : 'btn--primary'
                } btn--wide ${toggles[action.input] ? 'is-on' : ''}`.trim()}
                onClick={() => onAction(action)}
                disabled={!ready}
              >
                {action.label}
              </button>
            ))}

            {!actions.length && (
              <button
                type="button"
                className="btn btn--ghost btn--wide"
                onClick={() => onStep('learn')}
              >
                {solved ? 'Why it works' : 'Skip'}
              </button>
            )}

            {hint && (
              <button
                type="button"
                className="lbar__hint"
                onClick={onHint}
                aria-label="Show a hint"
              >
                ?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** Three words is the whole vocabulary — the artboard prints the number. */
function aimWord(aim: number, solved: boolean): string {
  if (solved) return 'got it'
  if (aim > 0.92) return 'almost'
  return 'keep going'
}
