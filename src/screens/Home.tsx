import { AppBar } from '../components/AppBar'
import { TOTAL_LESSONS, chapters, lessons, slotNumber, upcoming } from '../data/curriculum'
import { useProgress } from '../lib/progress'

interface Props {
  onOpen: (lessonId: string) => void
  onAbout: () => void
  onBack: () => void
}

/** The course index: fifteen slots, ten playable, one visible thread. */
export function Home({ onOpen, onAbout, onBack }: Props) {
  const { progress } = useProgress()

  const doneCount = lessons.filter((l) => progress[l.id]).length
  const ratio = doneCount / lessons.length

  return (
    <div className="screen home">
      <AppBar
        onBack={onBack}
        subtitle="Trigonometry 101"
        title="Lessons"
        progress={ratio}
      />

      <div className="home__scroll">
        <div className="progresscard">
          <div className="progresscard__row">
            <span className="progresscard__num">
              {doneCount}
              <em>/{lessons.length}</em>
            </span>
            <span className="progresscard__label">
              lessons complete
              <br />
              <small>{lessons.length} of {TOTAL_LESSONS} built so far</small>
            </span>
          </div>
          <div className="progresscard__track" aria-hidden="true">
            <div
              className="progresscard__fill"
              style={{ transform: `scaleX(${ratio})` }}
            />
          </div>
        </div>

        {chapters.map((chapter) => {
          const ready = lessons.filter((l) => l.chapter === chapter.id)
          const soon = upcoming.filter((l) => l.chapter === chapter.id)
          if (!ready.length && !soon.length) return null

          return (
            <section key={chapter.id} className="chapter">
              <div className="chapter__head">
                <span className="chapter__no">Chapter {chapter.id}</span>
                <h2 className="chapter__title">{chapter.title}</h2>
                <p className="chapter__blurb">{chapter.blurb}</p>
              </div>

              <ul className="lesslist">
                {ready.map((lesson) => {
                  const done = !!progress[lesson.id]
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={`lesscard ${done ? 'is-done' : ''}`.trim()}
                        onClick={() => onOpen(lesson.id)}
                      >
                        <span className="lesscard__no" aria-hidden="true">
                          {done ? '✓' : String(slotNumber(lesson.id)).padStart(2, '0')}
                        </span>
                        <span className="lesscard__text">
                          <span className="lesscard__title">{lesson.title}</span>
                          <span className="lesscard__tag">{lesson.tagline}</span>
                        </span>
                        <span className="lesscard__go" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="18" height="18">
                            <path
                              d="M9 5 L16 12 L9 19"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </li>
                  )
                })}

                {soon.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className="lesscard is-soon"
                      onClick={() => onOpen(lesson.id)}
                    >
                      <span className="lesscard__no" aria-hidden="true">
                        {String(slotNumber(lesson.id)).padStart(2, '0')}
                      </span>
                      <span className="lesscard__text">
                        <span className="lesscard__title">{lesson.title}</span>
                        <span className="lesscard__tag">{lesson.tagline}</span>
                      </span>
                      <span className="lesscard__soon">Soon</span>
                    </button>
                  </li>
                ))}
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
