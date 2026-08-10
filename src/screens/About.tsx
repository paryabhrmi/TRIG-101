import { AppBar } from '../components/AppBar'
import { LangToggle } from '../components/LangToggle'
import { RiveStage } from '../components/RiveStage'
import { lessons } from '../data/curriculum'
import { ui } from '../data/ui'
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
      <div className="blueprint" />
      <AppBar onBack={onBack} title={t(ui.aboutTitle)} right={<LangToggle />} />

      <div className="about__scroll">
        <div className="about__art">
          <RiveStage
            artboard="About"
            stateMachine="State Machine 1"
            stage="navy"
            bindViewModel={false}
          />
        </div>

        <div className="prose">
          <p>{t(ui.aboutBody)}</p>
          <p className="prose__dim">{t(ui.aboutCredit)}</p>
        </div>

        <div className="about__stat">
          {doneCount}/{lessons.length} {t(ui.complete)}
        </div>

        {doneCount > 0 && (
          <button
            type="button"
            className="linkish linkish--center linkish--warn"
            onClick={() => {
              if (window.confirm(t(ui.resetConfirm))) resetAll()
            }}
          >
            {t(ui.reset)}
          </button>
        )}
        <div className="home__pad" />
      </div>
    </div>
  )
}
