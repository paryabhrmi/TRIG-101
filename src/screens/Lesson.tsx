import { useEffect, useMemo, useRef, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { LessonBar } from '../components/LessonBar'
import { LessonSheet } from '../components/LessonSheet'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, nextStop, slotNumber } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import { useInstruments } from '../lib/useInstruments'
import { uiMode } from '../lib/uiMode'
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

  // Read once per mount: swapping panes mid-lesson would drop the pane's own
  // state, and the choice is a deploy-level one rather than a setting.
  const [mode] = useState(uiMode)

  const index = lessons.indexOf(lesson)
  const alreadyDone = !!progress[lesson.id]
  const n = slotNumber(lesson.id)
  const after = useMemo(() => nextStop(lesson.id), [lesson.id])

  const { values, aim, conditions, solved, markSolved } = useInstruments(
    rive,
    lesson,
    alreadyDone,
  )

  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id)
  }, [solved, alreadyDone, complete, lesson.id])

  // Clearing the task is the cue to move on, but only while the learner is
  // still on that step — never yank the screen out from under them.
  useEffect(() => {
    if (solved && step === 'do') setStep('learn')
  }, [solved, step])

  // A lesson with no checkpoint is one the artboard performs by itself: the
  // task is to watch it through, so the clock is the checkpoint. It runs only
  // on the task step, so a learner who skipped ahead is not credited for a
  // lesson they never saw.
  useEffect(() => {
    if (step !== 'do' || solved || !lesson.watchMs) return
    const id = window.setTimeout(markSolved, lesson.watchMs)
    return () => window.clearTimeout(id)
    // `markSolved` is a stable setter wrapper; watching it would reset the
    // clock on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, solved, lesson.watchMs])

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

  const paneProps = {
    lesson,
    step,
    onStep: setStep,
    solved,
    values,
    aim,
    conditions,
    showHint,
    onHint: () => setShowHint(true),
    after,
    onNext: goNext,
  }

  return (
    <div className={`screen lesson lesson--${mode}`}>
      <AppBar
        onBack={onBack}
        subtitle={`Lesson ${n} of ${TOTAL_LESSONS}`}
        title={lesson.title}
        right={solved ? <span className="pill pill--done">Done</span> : undefined}
        progress={(index + (solved ? 1 : 0)) / lessons.length}
      />

      {/* The artboard is a fixed square the width of the screen — every artboard
          in the file is 1:1, so it lands edge to edge with nothing cropped and
          nothing letterboxed. The field around it carries the artboard's own
          white, so the two read as one surface rather than a picture sitting
          on a page. */}
      <div className="lesson__field">
        <div className="lesson__art">
          <RiveStage
            key={lesson.id}
            artboard={lesson.artboard}
            stateMachine={lesson.stateMachine}
            bindViewModel={lesson.bindViewModel}
            onReady={setRive}
          />
        </div>

        {celebrate && (
          <div className="burst" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
      </div>

      {mode === 'sheet' ? <LessonSheet {...paneProps} /> : <LessonBar {...paneProps} />}
    </div>
  )
}
