import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { TOTAL_LESSONS, slotNumber } from '../data/curriculum'
import { useI18n } from '../lib/i18n'
import type { UpcomingLesson } from '../data/curriculum'

interface Props {
  lesson: UpcomingLesson
  onBack: () => void
}

/** Placeholder screen for a course slot whose artboard does not exist yet. */
export function Upcoming({ lesson, onBack }: Props) {
  const { t, tr } = useI18n()
  const n = slotNumber(lesson.id)

  return (
    <div className="screen">
      <AppBar
        onBack={onBack}
        subtitle={t('lessonOf', { n, total: TOTAL_LESSONS })}
        title={tr(lesson.title)}
        right={<span className="pill pill--soon">{t('soon')}</span>}
      />

      <div className="soon">
        <div className="soon__art">
          <Mark size={88} />
        </div>

        <span className="soon__badge">{t('notBuilt')}</span>
        <h2 className="soon__title">{tr(lesson.title)}</h2>
        <p className="soon__tag">{tr(lesson.tagline)}</p>
        <p className="soon__note">{tr(lesson.note)}</p>

        <div className="soon__foot">
          <button type="button" className="btn btn--primary btn--wide" onClick={onBack}>
            {t('backToLessons')}
          </button>
        </div>
      </div>
    </div>
  )
}
