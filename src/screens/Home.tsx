import { AppBar } from '../components/AppBar'
import { LangToggle } from '../components/LangToggle'
import { chapters, lessons } from '../data/curriculum'
import { ui } from '../data/ui'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'

interface Props {
  onOpen: (lessonId: string) => void
  onAbout: () => void
  onBack: () => void
}

/** The course index: three chapters, ten lessons, one visible thread. */
export function Home({ onOpen, onAbout, onBack }: Props) {
  const { t } = useI18n()
  const { progress } = useProgress()

  const doneCount = lessons.filter((l) => progress[l.id]).length
  const ratio = doneCount / lessons.length

  return (
    <div className="screen home">
      <div className="blueprint" />

      <AppBar
        onBack={onBack}
        subtitle={t(ui.appName)}
        title={t(ui.lessons)}
        right={<LangToggle />}
        progress={ratio}
      />

      <div className="home__scroll">
        <div className="home__stat">
          <strong>
            {doneCount}/{lessons.length}
          </strong>
          <span>{t(ui.complete)}</span>
          {doneCount === lessons.length && (
            <span className="home__medal">{t(ui.courseDone)}</span>
          )}
        </div>

        {chapters.map((chapter) => {
          const items = lessons.filter((l) => l.chapter === chapter.id)
          return (
            <section key={chapter.id} className="chapter">
              <div className="chapter__head">
                <span className="chapter__no">
                  {t(ui.chapter)} {chapter.id}
                </span>
                <h2 className="chapter__title">{t(chapter.title)}</h2>
                <p className="chapter__blurb">{t(chapter.blurb)}</p>
              </div>

              <ul className="lesslist">
                {items.map((lesson) => {
                  const n = lessons.indexOf(lesson) + 1
                  const done = !!progress[lesson.id]
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={`lesscard ${done ? 'is-done' : ''}`.trim()}
                        onClick={() => onOpen(lesson.id)}
                      >
                        <span className="lesscard__no" aria-hidden="true">
                          {done ? '✓' : String(n).padStart(2, '0')}
                        </span>
                        <span className="lesscard__text">
                          <span className="lesscard__title">{t(lesson.title)}</span>
                          <span className="lesscard__tag">{t(lesson.tagline)}</span>
                        </span>
                        <span className="lesscard__go" aria-hidden="true">
                          →
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        <button type="button" className="linkish linkish--center" onClick={onAbout}>
          {t(ui.about)}
        </button>
        <div className="home__pad" />
      </div>
    </div>
  )
}
