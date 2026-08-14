import { chapters, lessons, reviewKey, upcoming } from '../data/curriculum'
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

  return (
    <div className="screen home">
      <header className="duohead">
        <h1 className="duohead__title">Trigonometry 101</h1>
        <p className="duohead__sub">Lessons</p>
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

              <ul className="group">
                {ready.map((lesson, i) => {
                  const done = !!progress[lesson.id]
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={`row ${done ? 'is-done' : ''}`.trim()}
                        onClick={() => onOpen(lesson.id)}
                      >
                        <span className="row__key" aria-hidden="true">
                          {done ? '✓' : String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="row__title">{lesson.title}</span>
                      </button>
                    </li>
                  )
                })}

                {soon.map((lesson, i) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className="row is-soon"
                      onClick={() => onOpen(lesson.id)}
                    >
                      <span className="row__key" aria-hidden="true">
                        {String(ready.length + i + 1).padStart(2, '0')}
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
