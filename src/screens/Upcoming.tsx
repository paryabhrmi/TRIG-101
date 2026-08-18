import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { TOTAL_LESSONS, slotNumber } from '../data/curriculum'
import type { UpcomingLesson } from '../data/curriculum'

interface Props {
  lesson: UpcomingLesson
  onBack: () => void
}

/** Placeholder screen for a course slot whose artboard does not exist yet. */
export function Upcoming({ lesson, onBack }: Props) {
  const n = slotNumber(lesson.id)

  return (
    <div className="screen">
      <AppBar
        onBack={onBack}
        subtitle={`Lesson ${n} of ${TOTAL_LESSONS}`}
        title={lesson.title}
        right={<span className="pill pill--soon">Soon</span>}
      />

      <div className="soon">
        <div className="soon__art">
          <Mark size={88} />
        </div>

        <span className="soon__badge">Not built yet</span>
        <h2 className="soon__title">{lesson.title}</h2>
        <p className="soon__tag">{lesson.tagline}</p>
        <p className="soon__note">{lesson.note}</p>

        <div className="soon__foot">
          <button type="button" className="btn btn--primary btn--wide" onClick={onBack}>
            Back to the lessons
          </button>
        </div>
      </div>
    </div>
  )
}
