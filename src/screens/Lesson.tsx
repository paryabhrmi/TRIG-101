import { useEffect, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Checkpoint } from '../components/Checkpoint'
import { Instruments } from '../components/Instruments'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, slotNumber } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import { useInstruments } from '../lib/useInstruments'
import type { Rive } from '@rive-app/react-canvas'
import type { Lesson as LessonModel, LessonAction } from '../data/curriculum'

interface Props {
  lesson: LessonModel
  onBack: () => void
  onGoto: (lessonId: string) => void
  onFinish: () => void
}

export function LessonScreen({ lesson, onBack, onGoto, onFinish }: Props) {
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  const index = lessons.indexOf(lesson)
  const nextLesson = lessons[index + 1]
  const alreadyDone = !!progress[lesson.id]
  const n = slotNumber(lesson.id)

  const { values, solved, markSolved } = useInstruments(rive, lesson, alreadyDone)

  // A lesson with no checkpoint (only an action to perform) still counts once
  // the learner has done the thing.
  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id)
  }, [solved, alreadyDone, complete, lesson.id])

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

  // Light artboards keep the dark app-bar treatment; the navy ones let the bar
  // sit straight on the artwork so the canvas reads as one full-bleed field.
  const overDark = lesson.stage !== 'paper'

  return (
    <div className={`screen lesson lesson--${lesson.stage}`}>
      {/* Over a navy artboard the bar is absolutely positioned and the canvas
          runs underneath it; over a light one it sits in flow above. Either
          way it comes first in the DOM so the reading order is right. */}
      <AppBar
        onBack={onBack}
        variant={overDark ? 'over-dark' : 'light'}
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
      </div>

      <div className="sheet">
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__scroll">
          <h1 className="sheet__title">{lesson.title}</h1>
          <p className="sheet__tagline">{lesson.tagline}</p>

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

          <Instruments readouts={lesson.readouts} values={values} />

          {lesson.checkpoint && (
            <Checkpoint checkpoint={lesson.checkpoint} solved={solved} />
          )}

          <div className="prose">
            {lesson.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="sheet__foot">
            {nextLesson ? (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => onGoto(nextLesson.id)}
              >
                Next — {nextLesson.title}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={onFinish}
              >
                Finish the course
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
