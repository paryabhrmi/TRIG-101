import { useEffect, useMemo, useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Instruments } from '../components/Instruments'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, nextStop, slotNumber } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import { useInstruments } from '../lib/useInstruments'
import type { Rive } from '@rive-app/react-webgl'
import type { Lesson as LessonModel, LessonAction } from '../data/curriculum'

interface Props {
  lesson: LessonModel
  onBack: () => void
  onGoto: (lessonId: string) => void
  onReview: (chapter: number) => void
  onFinish: () => void
}

/** Watch what to touch → do the task → read why it happened. */
type Step = 'watch' | 'do' | 'learn'

/** How long the task step may sit unsolved before the hint offers itself. */
const STUCK_MS = 20_000

/** Give the artwork its first impression before the sheet claims attention. */
const DETAIL_FIRST_DELAY_MS = 900

export function LessonScreen({ lesson, onBack, onGoto, onReview, onFinish }: Props) {
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<Step>('watch')
  const [showHint, setShowHint] = useState(false)
  // Every lesson starts the same way: sheet closed, artwork owning the
  // screen, so the animation makes its impression before anything competes
  // for attention. Opening it is how the learner asks for more — except
  // where the instructions point at the readouts themselves, which still
  // opens itself, just on a short delay (see the effect below) instead of
  // beating the artwork onto the screen.
  const [open, setOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const index = lessons.indexOf(lesson)
  const alreadyDone = !!progress[lesson.id]
  const n = slotNumber(lesson.id)
  const after = useMemo(() => nextStop(lesson.id), [lesson.id])

  const { values, solved, markSolved } = useInstruments(rive, lesson, alreadyDone)

  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id)
  }, [solved, alreadyDone, complete, lesson.id])

  // Clearing the task is the cue to move on, but only while the learner is
  // still on that step — never yank the screen out from under them.
  useEffect(() => {
    if (solved && step === 'do') setStep('learn')
  }, [solved, step])

  // The learn step is nothing but explanation, so the sheet opens itself.
  useEffect(() => {
    if (step === 'learn') setOpen(true)
  }, [step])

  // The sheet is a fixed strip now, so a long step scrolls inside it instead
  // of growing. Every change of step or of the details starts that scroll at
  // the top — otherwise the previous step's offset carries over and clips the
  // new instruction right where the learner reads it.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [step, open])

  // Lessons whose instructions point at the readouts still need the sheet
  // open on the watch step — but only after the artwork has had its beat,
  // so this makes the same first impression every other lesson does before
  // the sheet rises. Cancelled if the learner moves on before it fires.
  useEffect(() => {
    if (!lesson.detailFirst || step !== 'watch') return
    const id = window.setTimeout(() => setOpen(true), DETAIL_FIRST_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [lesson.detailFirst, step])

  // A learner who sits on the task without progress should not have to admit
  // defeat to get help — after a while the hint surfaces on its own.
  useEffect(() => {
    if (step !== 'do' || solved || showHint || !lesson.checkpoint) return
    const id = window.setTimeout(() => setShowHint(true), STUCK_MS)
    return () => window.clearTimeout(id)
  }, [step, solved, showHint, lesson.checkpoint])

  // One short burst the first time this lesson is cracked — never on revisit.
  const celebratedRef = useRef(alreadyDone)
  useEffect(() => {
    if (!solved || celebratedRef.current) return
    celebratedRef.current = true
    setCelebrate(true)
    const id = window.setTimeout(() => setCelebrate(false), 1400)
    return () => window.clearTimeout(id)
  }, [solved])

  const runAction = (action: LessonAction) => {
    const input = rive
      ?.stateMachineInputs(lesson.stateMachine)
      ?.find((i) => i.name === action.input)
    if (!input) return

    if (action.kind === 'trigger') {
      input.fire()
    } else {
      const next = !toggles[action.input]
      input.value = next
      setToggles((prev) => ({ ...prev, [action.input]: next }))
    }
    if (action.completes) markSolved()
  }

  const steps: Step[] = ['watch', 'do', 'learn']
  const stepIndex = steps.indexOf(step)

  const goNext = () => {
    if (after?.kind === 'lesson') onGoto(after.id)
    else if (after?.kind === 'review') onReview(after.chapter)
    else onFinish()
  }

  return (
    <div className={`screen lesson lesson--${lesson.stage}`}>
      <AppBar
        onBack={onBack}
        subtitle={`Lesson ${n} of ${TOTAL_LESSONS}`}
        title={lesson.title}
        right={solved ? <span className="pill pill--done">Done</span> : undefined}
        progress={(index + (solved ? 1 : 0)) / lessons.length}
      />

      {/* Full-bleed stage: no card, no inset — the artwork is the backdrop. */}
      <div className="lesson__stage">
        <RiveStage
          key={lesson.id}
          artboard={lesson.artboard}
          stateMachine={lesson.stateMachine}
          stage={lesson.stage}
          bindViewModel={lesson.bindViewModel}
          onReady={setRive}
        />
        {celebrate && (
          <div className="burst" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
      </div>

      {/* The dock reserves the sheet's strip whether or not the sheet fills
          it, so the stage above keeps one fixed size all lesson long. */}
      <div className="lesson__dock">
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
            {steps.map((s, i) => {
              const current = i === stepIndex
              const doneStep = i < stepIndex || (s === 'do' && solved)
              const name = s === 'watch' ? 'Find it' : s === 'do' ? 'Try it' : 'Why it works'
              return (
                <button
                  key={s}
                  type="button"
                  className={`steps__seg ${current ? 'is-current' : ''} ${
                    doneStep ? 'is-done' : ''
                  }`.trim()}
                  aria-current={current}
                  aria-label={`Step ${i + 1}: ${name}`}
                  onClick={() => setStep(s)}
                >
                  <span className="steps__dot" aria-hidden="true" />
                  {current && <span className="steps__name">{name}</span>}
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

          <div className="sheet__scroll" ref={scrollRef}>
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
                    onClick={() => setStep('do')}
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

                {lesson.actions && lesson.actions.length > 0 && (
                  <div className="actions">
                    {lesson.actions.map((action) => (
                      <button
                        key={action.input}
                        type="button"
                        className={`btn ${
                          action.tone === 'ghost' ? 'btn--ghost' : 'btn--primary'
                        } ${toggles[action.input] ? 'is-on' : ''}`.trim()}
                        onClick={() => runAction(action)}
                        disabled={!rive}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

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
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setShowHint(true)}
                      >
                        Need a hint?
                      </button>
                    )}
                    <button
                      type="button"
                      className="linkish linkish--quiet"
                      onClick={() => setStep('learn')}
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
                  <button
                    type="button"
                    className="btn btn--primary btn--wide"
                    onClick={goNext}
                  >
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
      </div>
    </div>
  )
}
