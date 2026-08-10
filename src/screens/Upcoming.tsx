import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { TOTAL_LESSONS, slotNumber } from '../data/curriculum'
import { ui } from '../data/ui'
import { useI18n } from '../lib/i18n'
import type { UpcomingLesson } from '../data/curriculum'

interface Props {
  lesson: UpcomingLesson
  onBack: () => void
}

/** Placeholder screen for a course slot whose artboard does not exist yet. */
export function Upcoming({ lesson, onBack }: Props) {
  const { t } = useI18n()
  const n = slotNumber(lesson.id)

  return (
    <div className="screen">
      <div className="blueprint" />

      <AppBar
        onBack={onBack}
        subtitle={`${t(ui.lesson)} ${n} ${t(ui.of)} ${TOTAL_LESSONS}`}
        title={t(lesson.title)}
        right={<span className="pill pill--soon">{t(ui.soon)}</span>}
      />

      <div className="soon">
        <div className="soon__art">
          <Mark size={112} />
        </div>

        <span className="soon__badge">{t(ui.soonTitle)}</span>
        <h2 className="soon__title">{t(lesson.title)}</h2>
        <p className="soon__tag">{t(lesson.tagline)}</p>
        <p className="soon__note">{t(lesson.note)}</p>

        <div className="soon__foot">
          <button type="button" className="btn btn--primary btn--wide" onClick={onBack}>
            <span>{t(ui.backToLessons)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
