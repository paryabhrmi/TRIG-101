import { useEffect, useMemo, useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Instruments } from '../components/Instruments'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, nextStop, slotNumber } from '../data/curriculum'
import { useBottomSheet } from '../lib/useBottomSheet'
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

export function LessonScreen({ lesson, onBack, onGoto, onReview, onFinish }: Props) {
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<Step>('watch')
  const [showHint, setShowHint] = useState(false)
  // The sheet starts as a slim peek — one instruction and its button — so the
  // artwork owns the screen. Opening it is how the learner asks for more,
  // except where the instructions point at the readouts themselves.
  const [open, setOpen] = useState(!!lesson.detailFirst)
  const [celebrate, setCelebrate] = useState(false)
  const { sheetRef, scrimRef, dragging, toggle, collapse, dragHandleProps } = useBottomSheet(
    open,
    setOpen,
  )

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

  // Each step starts reading from the top; leftover scroll from the previous
  // step would leave the lead sentence hidden above the fold.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [step])

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

      {/* Dims the artwork as the sheet opens — the read that the panel has
          become its own floating layer, not just a taller footer. Tapping
          it is the same "back out" gesture as tapping the handle. */}
      <div
        ref={scrimRef}
        className={`sheet__scrim ${open ? 'is-open' : ''}`.trim()}
        onClick={collapse}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        className={`sheet ${open ? 'is-open' : ''} ${dragging ? 'is-dragging' : ''}`.trim()}
      >
        <button
          type="button"
          className="sheet__grab"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? 'Hide details' : 'More details'}
          {...dragHandleProps}
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
              {/* Always in the tree: closed, it peeks below the fold (and is
                  reachable by scroll); open, the extra height reveals it. The
                  toggle therefore always has a visible effect. */}
              <div className="sheet__detail">
                <Instruments readouts={lesson.readouts} values={values} />
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

              <div className="sheet__detail">
                <Instruments readouts={lesson.readouts} values={values} />
              </div>
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
            </>
          )}
        </div>

        {/* Footers live outside the scroll area so the step's one call to
            action is always on screen, whatever the scroll position. */}
        {step === 'watch' && (
          <div className="sheet__foot sheet__foot--pinned">
            <button
              type="button"
              className="btn btn--primary btn--wide"
              onClick={() => setStep('do')}
            >
              Got it — give me a task
            </button>
          </div>
        )}

        {step === 'do' && lesson.checkpoint && (
          <div className="sheet__foot sheet__foot--pinned">
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
          </div>
        )}

        {step === 'learn' && (
          <div className="sheet__foot sheet__foot--pinned">
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
        )}
      </div>
    </div>
  )
}
