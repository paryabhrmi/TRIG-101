import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { BottomSheet } from '../components/BottomSheet'
import { Instruments } from '../components/Instruments'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, nextStop, slotNumber } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import { useInstruments } from '../lib/useInstruments'
import { useMediaQuery } from '../lib/useViewport'
import type { Rive } from '@rive-app/react-canvas'
import type { SheetMetrics, SheetSnap } from '../components/BottomSheet'
import type { Lesson as LessonModel, LessonAction } from '../data/curriculum'

interface Props {
  lesson: LessonModel
  onBack: () => void
  onGoto: (lessonId: string) => void
  onReview: (chapter: number) => void
  onFinish: () => void
}

/** Find the control → clear the task → read why it happened. */
type Step = 'watch' | 'do' | 'learn'

const STEPS: { id: Step; label: string }[] = [
  { id: 'watch', label: 'Find it' },
  { id: 'do', label: 'Try it' },
  { id: 'learn', label: 'Why' },
]

/**
 * Each step opens the sheet at the height it actually needs: finding the
 * control wants the instruction and the first button, doing the task wants
 * the canvas, reading wants the page. The learner can drag away from any of
 * these — the step only sets the opening position.
 */
const SNAP_FOR: Record<Step, SheetSnap> = { watch: 'half', do: 'peek', learn: 'full' }

/** How long a learner sits on the task before the hint offers itself. */
const AUTO_HINT_MS = 22000

/** How far the artwork tucks under the sheet's rounded corners. */
const SHEET_TUCK_PX = 16

export function LessonScreen({ lesson, onBack, onGoto, onReview, onFinish }: Props) {
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<Step>('watch')
  const [snap, setSnap] = useState<SheetSnap>(SNAP_FOR.watch)
  const [showHint, setShowHint] = useState(false)
  const [metrics, setMetrics] = useState<SheetMetrics>({ peek: 208, half: 380 })
  const [barH, setBarH] = useState(61)

  const barRef = useRef<HTMLDivElement>(null)
  const isPanel = useMediaQuery('(orientation: landscape) and (max-height: 560px)')

  const index = lessons.indexOf(lesson)
  const alreadyDone = !!progress[lesson.id]
  const n = slotNumber(lesson.id)
  const after = nextStop(lesson.id)

  const { values, solved, markSolved } = useInstruments(rive, lesson, alreadyDone)

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const measure = () => setBarH(Math.ceil(bar.getBoundingClientRect().height))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id)
  }, [solved, alreadyDone, complete, lesson.id])

  const goStep = (next: Step) => {
    setStep(next)
    setSnap(SNAP_FOR[next])
  }

  // Clearing the task is the cue to move on, but only while the learner is
  // still on that step — never yank the screen out from under them.
  useEffect(() => {
    if (solved && step === 'do') {
      setStep('learn')
      setSnap('full')
    }
  }, [solved, step])

  // A learner stuck on the task gets the hint brought to them: it appears in
  // the checkpoint card and the sheet rises just enough to show it.
  useEffect(() => {
    if (step !== 'do' || solved || showHint || !lesson.checkpoint) return
    const id = window.setTimeout(() => {
      setShowHint(true)
      setSnap((s) => (s === 'peek' ? 'half' : s))
    }, AUTO_HINT_MS)
    return () => window.clearTimeout(id)
  }, [step, solved, showHint, lesson.checkpoint])

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

  const goNext = () => {
    if (after?.kind === 'lesson') onGoto(after.id)
    else if (after?.kind === 'review') onReview(after.chapter)
    else onFinish()
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const lead =
    step === 'watch'
      ? lesson.watch
      : step === 'do'
        ? (lesson.checkpoint?.goal ?? lesson.tagline)
        : lesson.tagline

  // Everything the learner needs while a finger is on the canvas lives in the
  // peek region: tabs, the current instruction, canvas buttons, live readouts.
  // It renders identically across steps (only the lead changes), so the stage
  // is never resized mid-lesson.
  const peekContent = (
    <>
      <div className="stepper" role="tablist" aria-label="Lesson steps">
        {STEPS.map((s, i) => {
          const done = s.id === 'do' ? solved : s.id === 'watch' && (stepIndex > 0 || solved)
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === step}
              className={`stepper__tab ${s.id === step ? 'is-current' : ''} ${
                done ? 'is-done' : ''
              }`.trim()}
              onClick={() => goStep(s.id)}
            >
              <span className="stepper__num" aria-hidden="true">
                {done ? '✓' : i + 1}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>

      <p className="step__lead" key={step}>
        {lead}
      </p>

      {lesson.actions && lesson.actions.length > 0 && (
        <div className="actions">
          {lesson.actions.map((action) => (
            <button
              key={action.input}
              type="button"
              className={`btn ${action.tone === 'ghost' ? 'btn--ghost' : 'btn--primary'} ${
                toggles[action.input] ? 'is-on' : ''
              }`.trim()}
              onClick={() => runAction(action)}
              disabled={!rive}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <Instruments readouts={lesson.readouts} values={values} />
    </>
  )

  return (
    <div className={`screen lesson lesson--${lesson.stage}`}>
      <div className="lesson__bar" ref={barRef}>
        <AppBar
          onBack={onBack}
          subtitle={`Lesson ${n} of ${TOTAL_LESSONS}`}
          title={lesson.title}
          right={
            solved ? (
              <span className="pill pill--done">Done</span>
            ) : (
              <span className="pill">{String(n).padStart(2, '0')}</span>
            )
          }
          progress={(index + (solved ? 1 : 0)) / lessons.length}
        />
      </div>

      {/* Full-bleed stage, laid out against the sheet's snapped stop so no
          in-canvas control ever hides behind the sheet at rest. At `full`
          (reading mode) the sheet covers the artwork behind its scrim, so the
          stage keeps the half layout and nothing reflows on the way back. */}
      <div
        className="lesson__stage"
        style={{
          marginBottom: isPanel
            ? 0
            : Math.max(0, (snap === 'peek' ? metrics.peek : metrics.half) - SHEET_TUCK_PX),
        }}
      >
        <RiveStage
          key={lesson.id}
          artboard={lesson.artboard}
          stateMachine={lesson.stateMachine}
          stage={lesson.stage}
          bindViewModel={lesson.bindViewModel}
          onReady={setRive}
        />
      </div>

      <BottomSheet
        snap={snap}
        onSnap={setSnap}
        topInset={barH}
        peek={peekContent}
        onMetrics={setMetrics}
        isStatic={isPanel}
        resetKey={step}
      >
        {step === 'watch' && (
          <>
            <div className="prose">
              <p className="prose__dim">
                The canvas is the controls — drag what you see. The tiles above
                mirror it live as you move things.
              </p>
            </div>
            <div className="sheet__foot">
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => goStep('do')}
              >
                Got it — give me the task
              </button>
            </div>
          </>
        )}

        {step === 'do' && (
          <>
            <div className={`checkpoint ${solved ? 'is-solved' : ''}`.trim()}>
              <div className="checkpoint__head">
                <span className="checkpoint__badge" aria-hidden="true">
                  {solved ? '✓' : '!'}
                </span>
                <span className="checkpoint__kicker">
                  {solved ? 'Checkpoint cleared' : 'Checkpoint'}
                </span>
              </div>
              <p className="checkpoint__note">
                {solved
                  ? 'Nice — head to Why to see what just happened.'
                  : showHint && lesson.checkpoint
                    ? lesson.checkpoint.hint
                    : lesson.checkpoint
                      ? 'Watching the canvas — this clears itself the moment you get there.'
                      : 'Use the button above — the canvas does the rest.'}
              </p>
              {!showHint && !solved && lesson.checkpoint && (
                <button type="button" className="linkish" onClick={() => setShowHint(true)}>
                  Need a hint?
                </button>
              )}
            </div>
            <div className="hintrow">
              <button
                type="button"
                className="linkish linkish--quiet"
                onClick={() => goStep('learn')}
              >
                Skip to the idea
              </button>
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
            {lesson.formula && (
              <div className="keyidea">
                <span className="keyidea__kicker">Key idea</span>
                <span className="keyidea__formula">{lesson.formula}</span>
              </div>
            )}
            <div className="prose">
              {lesson.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="sheet__foot">
              <button type="button" className="btn btn--primary btn--wide" onClick={goNext}>
                {after?.kind === 'review'
                  ? 'Chapter review'
                  : after?.kind === 'lesson'
                    ? 'Next lesson'
                    : 'Finish the course'}
              </button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}
