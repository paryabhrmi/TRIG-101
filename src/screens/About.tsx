import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { TOTAL_LESSONS, lessons } from '../data/curriculum'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'

interface Props {
  onBack: () => void
}

export function About({ onBack }: Props) {
  const { t } = useI18n()
  const { progress, resetAll } = useProgress()
  const doneCount = lessons.filter((l) => progress[l.id]).length

  return (
    <div className="screen about">
      <AppBar onBack={onBack} title={t('aboutApp')} />

      <div className="about__scroll">
        <div className="about__hero">
          <Mark size={72} />
          <h2 className="about__name">{t('appName')}</h2>
          <p className="about__kicker">{t('studio')}</p>
        </div>

        <div className="prose">
          <p>{t('aboutP1')}</p>
          <p className="prose__dim">{t('aboutP2')}</p>
        </div>

        <div className="about__stat">
          {t('aboutStat', {
            done: doneCount,
            ready: lessons.length,
            total: TOTAL_LESSONS,
          })}
        </div>

        {doneCount > 0 && (
          <button
            type="button"
            className="linkish linkish--center linkish--warn"
            onClick={() => {
              if (window.confirm(t('confirmReset'))) resetAll()
            }}
          >
            {t('resetProgress')}
          </button>
        )}
        <div className="home__pad" />
      </div>
    </div>
  )
}
