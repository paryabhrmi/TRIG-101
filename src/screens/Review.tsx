import { useState } from 'react'
import { AppBar } from '../components/AppBar'
import { chapterById, lessonAfterReview, lessonById, reviewKey } from '../data/curriculum'
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
  const meta = chapterById(chapter)
  const questions = meta?.review ?? []
  const { complete } = useProgress()

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[index]
  const nextLesson = lessonAfterReview(chapter)
  // The tick on the home screen means "understood", so it has to be earned:
  // one miss is allowed, more than that asks for another round.
  const passMark = Math.max(1, questions.length - 1)

  if (!meta || !q) {
    return (
      <div className="screen">
        <AppBar onBack={onBack} title="Chapter review" />
        <div className="soon">
          <p className="soon__tag">This chapter has no review yet.</p>
          <div className="soon__foot">
            <button type="button" className="btn btn--primary btn--wide" onClick={onBack}>
              Back to the lessons
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
    if (correct >= passMark) complete(reviewKey(chapter))
    setDone(true)
  }

  const retry = () => {
    setIndex(0)
    setPicked(null)
    setCorrect(0)
    setDone(false)
  }

  if (done) {
    const all = correct === questions.length
    const passed = correct >= passMark
    return (
      <div className="screen">
        <AppBar onBack={onBack} subtitle={`Chapter ${chapter}`} title="Review complete" />
        <div className="soon">
          <div className={`score ${all ? 'is-perfect' : ''}`.trim()}>
            <strong>
              {correct}
              <em>/{questions.length}</em>
            </strong>
            <span>
              {all
                ? 'Every one right.'
                : passed
                  ? 'Worth another look.'
                  : 'Not yet — one more round.'}
            </span>
          </div>
          <h2 className="soon__title">{meta.title}</h2>
          <p className="soon__tag">
            {all
              ? 'You can explain this chapter, not just operate it. That is the difference.'
              : passed
                ? 'Re-read the lesson for anything that felt shaky — the explanations are at the end of each one.'
                : `The ideas have not settled yet. Revisit the lessons the wrong answers pointed at, then try again — ${passMark} of ${questions.length} passes.`}
          </p>
          <div className="soon__foot">
            {!passed ? (
              <button type="button" className="btn btn--primary btn--wide" onClick={retry}>
                Try again
              </button>
            ) : nextLesson ? (
              <button
                type="button"
                className="btn btn--primary btn--wide"
                onClick={() => onGoto(nextLesson)}
              >
                Start the next chapter
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
            <button type="button" className="linkish linkish--center" onClick={onBack}>
              Back to the lessons
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
        subtitle={`Chapter ${chapter} review`}
        title={meta.title}
        right={
          <span className="pill">
            {index + 1}/{questions.length}
          </span>
        }
        /* Counts the question you are on, not the ones behind you: at 1/3 the
           bar used to sit at empty, reading as "nothing has happened yet". */
        progress={(index + (picked === null ? 0 : 1)) / questions.length}
      />

      <div className="quiz">
        <p className="quiz__prompt">{q.prompt}</p>

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
              <li key={opt}>
                <button
                  type="button"
                  className={`quiz__option ${state}`.trim()}
                  onClick={() => answer(i)}
                  disabled={picked !== null}
                >
                  <span className="quiz__key" aria-hidden="true">
                    {picked === null ? String.fromCharCode(65 + i) : isAnswer ? '✓' : isPicked ? '✕' : ''}
                  </span>
                  <span>{opt}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {picked !== null && (
          <>
            <p className="quiz__explain" role="status">
              {q.explain}
            </p>
            {picked !== q.answer && q.lesson && lessonById(q.lesson) && (
              <button
                type="button"
                className="linkish"
                onClick={() => onGoto(q.lesson!)}
              >
                Revisit: {lessonById(q.lesson)!.title}
              </button>
            )}
          </>
        )}
      </div>

      {/* Docked, not appended to the scroll. A long question plus four options
          plus the explanation pushed this past the fold, so continuing meant
          scrolling to find the button that was the only way forward. */}
      {picked !== null && (
        <div className="quiz__dock">
          <button type="button" className="btn btn--primary btn--wide" onClick={advance}>
            {index + 1 < questions.length ? 'Next question' : 'See how you did'}
          </button>
        </div>
      )}
    </div>
  )
}
