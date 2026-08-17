import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { TOTAL_LESSONS, lessons, slotNumber } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import type { UpcomingLesson } from '../data/curriculum'

interface Props {
  lesson: UpcomingLesson
  onBack: () => void
  onOpen: (lessonId: string) => void
}

/** Placeholder screen for a course slot whose artboard does not exist yet. */
export function Upcoming({ lesson, onBack, onOpen }: Props) {
  const { progress } = useProgress()
  const n = slotNumber(lesson.id)

  // A slot that cannot be played should still hand the learner somewhere to
  // go. Before, the only way out was back to the index.
  const nextUp = lessons.find((l) => !progress[l.id]) ?? lessons[0]

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

        {/* The SOON pill in the bar already says this once; it used to be said
            three times over, with the title repeated under it as well. */}
        <p className="soon__tag">{lesson.tagline}</p>
        <p className="soon__note">{lesson.note}</p>

        <div className="soon__foot">
          <button
            type="button"
            className="btn btn--primary btn--wide"
            onClick={() => onOpen(nextUp.id)}
          >
            {progress[nextUp.id] ? 'Back to lesson 1' : `Take lesson ${slotNumber(nextUp.id)}`}
          </button>
          <button type="button" className="linkish linkish--center" onClick={onBack}>
            All lessons
          </button>
        </div>
      </div>
    </div>
  )
}
