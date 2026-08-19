import { useEffect, useMemo, useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { LessonSheet } from '../components/LessonSheet'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, nextStop, slotNumber } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import { useInstruments } from '../lib/useInstruments'
import type { Rive } from '@rive-app/react-canvas'
import type { Step } from '../components/lessonPane'
import type { Lesson as LessonModel } from '../data/curriculum'

interface Props {
  lesson: LessonModel
  onBack: () => void
  onGoto: (lessonId: string) => void
  onReview: (chapter: number) => void
  onFinish: () => void
}

/** How long the task step may sit unsolved before the hint offers itself. */
const STUCK_MS = 20_000

export function LessonScreen({ lesson, onBack, onGoto, onReview, onFinish }: Props) {
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [step, setStep] = useState<Step>('watch')
  const [showHint, setShowHint] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const index = lessons.indexOf(lesson)
  const alreadyDone = !!progress[lesson.id]
  const n = slotNumber(lesson.id)
  const after = useMemo(() => nextStop(lesson.id), [lesson.id])

  const { values, aim, conditions, solved } = useInstruments(
    rive,
    lesson,
    alreadyDone,
    step === 'do',
  )

  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id)
  }, [solved, alreadyDone, complete, lesson.id])

  // Clearing the task is the cue to move on, but only while the learner is
  // still on that step — never yank the screen out from under them.
  useEffect(() => {
    if (solved && step === 'do') setStep('learn')
  }, [solved, step])

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

  const goNext = () => {
    if (after?.kind === 'lesson') onGoto(after.id)
    else if (after?.kind === 'review') onReview(after.chapter)
    else onFinish()
  }

  return (
    <div className="screen lesson">
      <AppBar
        onBack={onBack}
        subtitle={`Lesson ${n} of ${TOTAL_LESSONS}`}
        title={lesson.title}
        right={solved ? <span className="pill pill--done">Done</span> : undefined}
        progress={(index + (solved ? 1 : 0)) / lessons.length}
      />

      {/* The artboard takes the full width of the screen in its own aspect
          ratio, so it lands edge to edge with nothing cropped and nothing
          letterboxed. The field it sits in carries the same paper as the
          artboards do, so the canvas and the page read as one surface rather
          than a picture pasted onto a backdrop. */}
      <div className="lesson__field">
        <RiveStage
          key={lesson.id}
          artboard={lesson.artboard}
          stateMachine={lesson.stateMachine}
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

      <LessonSheet
        lesson={lesson}
        step={step}
        onStep={setStep}
        solved={solved}
        values={values}
        aim={aim}
        conditions={conditions}
        showHint={showHint}
        onHint={() => setShowHint(true)}
        after={after}
        onNext={goNext}
      />
    </div>
  )
}
