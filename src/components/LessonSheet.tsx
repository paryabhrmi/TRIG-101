import { useState } from 'react'
import { Instruments } from './Instruments'
import { STEPS, stepName } from './lessonPane'
import type { LessonPaneProps } from './lessonPane'

/**
 * The previous bottom pane, kept intact.
 *
 * This is the collapsible sheet the lesson screen shipped with before the
 * lesson bar replaced it. Nothing here is new work — it is preserved so
 * `?ui=sheet` can put the old screen back on a live deploy, without a revert
 * and without a redeploy. See `src/lib/uiMode.ts`.
 */
export function LessonSheet({
  lesson,
  step,
  onStep,
  solved,
  values,
  showHint,
  onHint,
  after,
  onNext,
}: LessonPaneProps) {
  const [open, setOpen] = useState(step === 'learn')
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className={`sheet ${open ? 'is-open' : ''}`.trim()}>
      <button
        type="button"
        className="sheet__grab"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide details' : 'More details'}
      >
        <span className="sheet__handle" aria-hidden="true" />
      </button>

      <nav className="steps" aria-label="Lesson steps">
        {STEPS.map((s, i) => {
          const current = i === stepIndex
          const doneStep = i < stepIndex || (s === 'do' && solved)
          return (
            <button
              key={s}
              type="button"
              className={`steps__seg ${current ? 'is-current' : ''} ${
                doneStep ? 'is-done' : ''
              }`.trim()}
              aria-current={current}
              aria-label={`Step ${i + 1}: ${stepName(s)}`}
              onClick={() => onStep(s)}
            >
              <span className="steps__dot" aria-hidden="true" />
              {current && <span className="steps__name">{stepName(s)}</span>}
            </button>
          )
        })}
        <button
          type="button"
          className="steps__more"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide details' : 'More details'}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path
              d="M2.5 7.5 L6 4 L9.5 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </nav>

      <div className="sheet__scroll">
        {step === 'watch' && (
          <>
            <p className="step__lead">{lesson.watch}</p>
            {open && (
              <div className="sheet__detail">
                <Instruments readouts={lesson.readouts} values={values} />
              </div>
            )}
            <div className="sheet__foot">
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => onStep('do')}
              >
                Got it — give me a task
              </button>
            </div>
          </>
        )}

        {step === 'do' && (
          <>
            <p className="step__lead">
              {lesson.checkpoint ? lesson.checkpoint.goal : lesson.tagline}
            </p>

            {open && (
              <div className="sheet__detail">
                <Instruments readouts={lesson.readouts} values={values} />
              </div>
            )}

            {lesson.checkpoint && (
              <div className="hintrow">
                {showHint ? (
                  <p className="step__hint">{lesson.checkpoint.hint}</p>
                ) : (
                  <button type="button" className="linkish" onClick={onHint}>
                    Need a hint?
                  </button>
                )}
                <button
                  type="button"
                  className="linkish linkish--quiet"
                  onClick={() => onStep('learn')}
                >
                  Skip
                </button>
              </div>
            )}
          </>
        )}

        {step === 'learn' && (
          <>
            {solved && (
              <p className="step__win">
                <span aria-hidden="true">✓</span> Nice — that is the idea.
              </p>
            )}
            <div className="prose">
              {lesson.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="sheet__foot">
              <button type="button" className="btn btn--primary btn--wide" onClick={onNext}>
                {after?.kind === 'review'
                  ? 'Chapter review'
                  : after?.kind === 'lesson'
                    ? 'Next lesson'
                    : 'Finish the course'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
