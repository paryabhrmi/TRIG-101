import { useEffect, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Checkpoint } from '../components/Checkpoint'
import { Instruments } from '../components/Instruments'
import { RiveStage } from '../components/RiveStage'
import { lessons } from '../data/curriculum'
import { ui } from '../data/ui'
import { useI18n } from '../lib/i18n'
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
  const { t } = useI18n()
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  const index = lessons.indexOf(lesson)
  const nextLesson = lessons[index + 1]
  const alreadyDone = !!progress[lesson.id]

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

  return (
    <div className={`screen lesson lesson--${lesson.stage}`}>
      <div className="blueprint" />

      <AppBar
        onBack={onBack}
        subtitle={`${t(ui.lesson)} ${index + 1} ${t(ui.of)} ${lessons.length}`}
        title={t(lesson.title)}
        right={
          solved ? (
            <span className="pill pill--done">{t(ui.done)}</span>
          ) : (
            <span className="pill pill--idle">{String(index + 1).padStart(2, '0')}</span>
          )
        }
        progress={(index + (solved ? 1 : 0)) / lessons.length}
      />

      <div className="lesson__stagewrap">
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
        <div className="sheet__scroll">
          <p className="sheet__tagline">{t(lesson.tagline)}</p>

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
                  {t(action.label)}
                </button>
              ))}
            </div>
          )}

          <Instruments readouts={lesson.readouts} values={values} />

          {lesson.checkpoint && (
            <Checkpoint checkpoint={lesson.checkpoint} solved={solved} />
          )}

          <button
            type="button"
            className="linkish linkish--center"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t(ui.readLess) : t(ui.readMore)}
          </button>

          {expanded && (
            <div className="prose">
              {lesson.body.map((para, i) => (
                <p key={i}>{t(para)}</p>
              ))}
            </div>
          )}

          <div className="sheet__foot">
            {nextLesson ? (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => onGoto(nextLesson.id)}
              >
                {t(ui.next)} — {t(nextLesson.title)}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={onFinish}
              >
                {t(ui.finish)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
