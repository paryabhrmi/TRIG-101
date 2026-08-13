import { useEffect, useMemo, useState } from 'react'
import { AppBar } from '../components/AppBar'
import { Instruments } from '../components/Instruments'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons, nextStop, slotNumber } from '../data/curriculum'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'
import { useInstruments } from '../lib/useInstruments'
import type { Rive } from '@rive-app/react-canvas'
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

export function LessonScreen({ lesson, onBack, onGoto, onReview, onFinish }: Props) {
  const { t, tr, lang } = useI18n()
  const { progress, complete } = useProgress()
  const [rive, setRive] = useState<Rive | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<Step>('watch')
  const [showHint, setShowHint] = useState(false)

  const index = lessons.indexOf(lesson)
  const alreadyDone = !!progress[lesson.id]
  const n = slotNumber(lesson.id)
  const after = useMemo(() => nextStop(lesson.id), [lesson.id])

  const { values, solved, markSolved } = useInstruments(rive, lesson, alreadyDone, lang)

  useEffect(() => {
    if (solved && !alreadyDone) complete(lesson.id)
  }, [solved, alreadyDone, complete, lesson.id])

  // Clearing the task is the cue to move on, but only while the learner is
  // still on that step — never yank the screen out from under them.
  useEffect(() => {
    if (solved && step === 'do') setStep('learn')
  }, [solved, step])

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
        subtitle={t('lessonOf', { n, total: TOTAL_LESSONS })}
        title={tr(lesson.title)}
        right={
          solved ? (
            <span className="pill pill--done">{t('done')}</span>
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
        <nav className="steps" aria-label={t('lessonSteps')}>
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              className={`steps__dot ${i === stepIndex ? 'is-current' : ''} ${
                i < stepIndex || (s === 'do' && solved) ? 'is-done' : ''
              }`.trim()}
              aria-current={i === stepIndex}
              aria-label={t('stepN', { n: i + 1 })}
              onClick={() => setStep(s)}
            />
          ))}
          <span className="steps__label">
            {step === 'watch' ? t('stepFind') : step === 'do' ? t('stepTry') : t('stepWhy')}
          </span>
        </nav>

        <div className="sheet__scroll">
          {step === 'watch' && (
            <>
              <p className="step__lead">{tr(lesson.watch)}</p>
              <Instruments readouts={lesson.readouts} values={values} />
              <div className="sheet__foot">
                <button
                  type="button"
                  className="btn btn--primary btn--wide"
                  onClick={() => setStep('do')}
                >
                  {t('giveTask')}
                </button>
              </div>
            </>
          )}

          {step === 'do' && (
            <>
              <p className="step__lead">
                {lesson.checkpoint ? tr(lesson.checkpoint.goal) : tr(lesson.tagline)}
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
                      {tr(action.label)}
                    </button>
                  ))}
                </div>
              )}

              <Instruments readouts={lesson.readouts} values={values} />

              {lesson.checkpoint && (
                <div className="hintrow">
                  {showHint ? (
                    <p className="step__hint">{tr(lesson.checkpoint.hint)}</p>
                  ) : (
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => setShowHint(true)}
                    >
                      {t('needHint')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="linkish linkish--quiet"
                    onClick={() => setStep('learn')}
                  >
                    {t('skip')}
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'learn' && (
            <>
              {solved && (
                <p className="step__win">
                  <span aria-hidden="true">✓</span> {t('nice')}
                </p>
              )}
              <div className="prose">
                {lesson.body.map((para, i) => (
                  <p key={i}>{tr(para)}</p>
                ))}
              </div>
              <div className="sheet__foot">
                <button
                  type="button"
                  className="btn btn--primary btn--wide"
                  onClick={goNext}
                >
                  {after?.kind === 'review'
                    ? t('chapterReview')
                    : after?.kind === 'lesson'
                      ? t('nextLesson')
                      : t('finishCourse')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
