import { useState } from 'react'
import { AppBar } from '../components/AppBar'
import { chapterById, lessonAfterReview, reviewKey } from '../data/curriculum'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'

interface Props {
  chapter: number
  onBack: () => void
  onGoto: (lessonId: string) => void
  onFinish: () => void
}

/**
 * End-of-chapter check. The lesson checkpoints prove the learner moved the
 * right slider; these prove they know why it moved.
 */
export function Review({ chapter, onBack, onGoto, onFinish }: Props) {
  const { t, tr } = useI18n()
  const meta = chapterById(chapter)
  const questions = meta?.review ?? []
  const { complete } = useProgress()

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[index]
  const nextLesson = lessonAfterReview(chapter)

  if (!meta || !q) {
    return (
      <div className="screen">
        <AppBar onBack={onBack} title={t('chapterReview')} />
        <div className="soon">
          <p className="soon__tag">{t('noReview')}</p>
          <div className="soon__foot">
            <button type="button" className="btn btn--primary btn--wide" onClick={onBack}>
              {t('backToLessons')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const answer = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setCorrect((c) => c + 1)
  }

  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setPicked(null)
      return
    }
    complete(reviewKey(chapter))
    setDone(true)
  }

  if (done) {
    const all = correct === questions.length
    return (
      <div className="screen">
        <AppBar
          onBack={onBack}
          subtitle={t('chapterNo', { n: chapter })}
          title={t('reviewComplete')}
        />
        <div className="soon">
          <div className={`score ${all ? 'is-perfect' : ''}`.trim()}>
            <strong>
              {correct}
              <em>/{questions.length}</em>
            </strong>
            <span>{all ? t('allRight') : t('anotherLook')}</span>
          </div>
          <h2 className="soon__title">{tr(meta.title)}</h2>
          <p className="soon__tag">{all ? t('perfectMsg') : t('imperfectMsg')}</p>
          <div className="soon__foot">
            {nextLesson ? (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => onGoto(nextLesson)}
              >
                {t('startNextChapter')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={onFinish}
              >
                {t('finishCourse')}
              </button>
            )}
            <button type="button" className="linkish linkish--center" onClick={onBack}>
              {t('backToLessons')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <AppBar
        onBack={onBack}
        subtitle={t('chapterNReview', { n: chapter })}
        title={tr(meta.title)}
        right={
          <span className="pill">
            {index + 1}/{questions.length}
          </span>
        }
        progress={index / questions.length}
      />

      <div className="quiz">
        <p className="quiz__prompt">{tr(q.prompt)}</p>

        <ul className="quiz__options">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer
            const isPicked = picked === i
            const state =
              picked === null
                ? ''
                : isAnswer
                  ? 'is-right'
                  : isPicked
                    ? 'is-wrong'
                    : 'is-dim'
            return (
              <li key={opt.en}>
                <button
                  type="button"
                  className={`quiz__option ${state}`.trim()}
                  onClick={() => answer(i)}
                  disabled={picked !== null}
                >
                  <span className="quiz__key" aria-hidden="true">
                    {picked === null ? String.fromCharCode(65 + i) : isAnswer ? '✓' : isPicked ? '✕' : ''}
                  </span>
                  <span>{tr(opt)}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {picked !== null && (
          <>
            <p className="quiz__explain">{tr(q.explain)}</p>
            <div className="sheet__foot">
              <button type="button" className="btn btn--primary btn--wide" onClick={advance}>
                {index + 1 < questions.length ? t('nextQuestion') : t('seeResults')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
