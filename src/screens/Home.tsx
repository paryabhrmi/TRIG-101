import type { CSSProperties } from 'react'
import { chapters, lessons, reviewKey, upcoming } from '../data/curriculum'
import { useProgress } from '../lib/progress'

interface Props {
  onOpen: (lessonId: string) => void
  onReview: (chapter: number) => void
  onAbout: () => void
}

/**
 * Per-chapter accent, game-style: the light shade fills the review row and
 * the lesson numbers; the deep shade carries the "Chapter N" kicker.
 */
const ACCENTS: Record<number, { main: string; deep: string }> = {
  1: { main: '#55aaee', deep: '#28517e' },
  2: { main: '#e0a03d', deep: '#94660f' },
  3: { main: '#21b573', deep: '#0f6b44' },
  4: { main: '#9a63cc', deep: '#5d3585' },
}

/** The course index: one rounded card per chapter, review row at the bottom. */
export function Home({ onOpen, onReview, onAbout }: Props) {
  const { progress } = useProgress()

  return (
    <div className="screen home">
      <header className="homebar">
        <h1 className="homebar__title">Trigonometry101</h1>
        <span className="homebar__sub">Lessons</span>
      </header>

      <div className="home__scroll">
        {chapters.map((chapter) => {
          const ready = lessons.filter((l) => l.chapter === chapter.id)
          const soon = upcoming.filter((l) => l.chapter === chapter.id)
          if (!ready.length && !soon.length) return null

          const accent = ACCENTS[chapter.id] ?? ACCENTS[1]
          const reviewDone = !!progress[reviewKey(chapter.id)]

          return (
            <section
              key={chapter.id}
              className="chapter"
              style={
                { '--ch': accent.main, '--ch-deep': accent.deep } as CSSProperties
              }
            >
              <div className="chapter__head">
                <span className="chapter__no">Chapter {chapter.id}</span>
                <h2 className="chapter__title">{chapter.title}</h2>
              </div>

              <ul className="chgroup">
                {ready.map((lesson, i) => {
                  const done = !!progress[lesson.id]
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className={`chrow ${done ? 'is-done' : ''}`.trim()}
                        onClick={() => onOpen(lesson.id)}
                      >
                        <span className="chrow__key" aria-hidden="true">
                          {done ? '✓' : String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="chrow__title">{lesson.title}</span>
                      </button>
                    </li>
                  )
                })}

                {soon.map((lesson, i) => (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className="chrow is-soon"
                      onClick={() => onOpen(lesson.id)}
                    >
                      <span className="chrow__key" aria-hidden="true">
                        {String(ready.length + i + 1).padStart(2, '0')}
                      </span>
                      <span className="chrow__title">{lesson.title}</span>
                      <span className="chrow__soon">Soon</span>
                    </button>
                  </li>
                ))}

                {chapter.review?.length ? (
                  <li>
                    <button
                      type="button"
                      className={`chrow chrow--review ${
                        reviewDone ? 'is-done' : ''
                      }`.trim()}
                      onClick={() => onReview(chapter.id)}
                    >
                      <span className="chrow__key" aria-hidden="true">
                        {reviewDone ? '✓' : '?'}
                      </span>
                      <span className="chrow__title">Chapter review</span>
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
