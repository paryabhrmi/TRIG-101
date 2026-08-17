import { chapters, lessons, reviewKey, slotNumber, upcoming } from '../data/curriculum'
import { useProgress } from '../lib/progress'

interface Props {
  onOpen: (lessonId: string) => void
  onReview: (chapter: number) => void
  onAbout: () => void
}

/** Each chapter owns one accent; they cycle in course order. */
const TONES = ['blue', 'amber', 'green', 'violet'] as const
const tone = (chapterId: number) => TONES[(chapterId - 1) % TONES.length]

/** The course index: a flat banner, then one grouped card per chapter. */
export function Home({ onOpen, onReview, onAbout }: Props) {
  const { progress } = useProgress()

  // The one lesson the course would hand you next — flagged so the index
  // always answers "where do I go?" at a glance.
  const nextUp = lessons.find((l) => !progress[l.id])?.id
  const doneCount = lessons.filter((l) => progress[l.id]).length

  return (
    <div className="screen home">
      <header className="duohead">
        <h1 className="duohead__title">Trigonometry 101</h1>
        <p className="duohead__sub">Lessons</p>
        <div className="duohead__meter">
          <div
            className="duohead__track"
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={lessons.length}
            aria-label="Course progress"
          >
            <div
              className="duohead__fill"
              style={{ transform: `scaleX(${doneCount / lessons.length})` }}
            />
          </div>
          <span className="duohead__count">
            {doneCount}/{lessons.length}
          </span>
        </div>
      </header>

      <div className="home__scroll">
        {chapters.map((chapter) => {
          const ready = lessons.filter((l) => l.chapter === chapter.id)
          const soon = upcoming.filter((l) => l.chapter === chapter.id)
          if (!ready.length && !soon.length) return null

          return (
            <section
              key={chapter.id}
              className={`chapter chapter--${tone(chapter.id)}`}
            >
              <span className="chapter__no">Chapter {chapter.id}</span>
              <h2 className="chapter__title">{chapter.title}</h2>

              {/* Numbered against the whole course, not the chapter. These
                  used to restart at 01 in every chapter while the lesson
                  screen itself said "Lesson 4 of 15" — so tapping 01 opened
                  lesson 4. */}
              <ul className="group">
                {ready.map((lesson) => {
                  const done = !!progress[lesson.id]
                  const isNext = lesson.id === nextUp
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={`row ${done ? 'is-done' : ''} ${
                          isNext ? 'row--next' : ''
                        }`.trim()}
                        onClick={() => onOpen(lesson.id)}
                      >
                        <span className="row__key" aria-hidden="true">
                          {done ? '✓' : String(slotNumber(lesson.id)).padStart(2, '0')}
                        </span>
                        <span className="row__title">{lesson.title}</span>
                        {isNext && <span className="row__next">Start</span>}
                      </button>
                    </li>
                  )
                })}

                {soon.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className="row is-soon"
                      onClick={() => onOpen(lesson.id)}
                    >
                      <span className="row__key" aria-hidden="true">
                        {String(slotNumber(lesson.id)).padStart(2, '0')}
                      </span>
                      <span className="row__title">{lesson.title}</span>
                      <span className="row__soon">Soon</span>
                    </button>
                  </li>
                ))}

                {chapter.review?.length ? (
                  <li>
                    <button
                      type="button"
                      className="row row--review"
                      onClick={() => onReview(chapter.id)}
                    >
                      <span className="row__key" aria-hidden="true">
                        {progress[reviewKey(chapter.id)] ? '✓' : '?'}
                      </span>
                      <span className="row__title">Chapter review</span>
                    </button>
                  </li>
                ) : null}
              </ul>
            </section>
          )
        })}

        <button type="button" className="linkish linkish--center" onClick={onAbout}>
          About this app
        </button>
        <div className="home__pad" />
      </div>
    </div>
  )
}
