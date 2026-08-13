import { useEffect, useState } from 'react'
import { Fit } from '@rive-app/react-canvas'
import { LangToggle } from '../components/LangToggle'
import { RiveStage } from '../components/RiveStage'
import { lessons } from '../data/curriculum'
import { useI18n } from '../lib/i18n'
import { useProgress } from '../lib/progress'
import type { Rive } from '@rive-app/react-canvas'

interface Props {
  onStart: () => void
  onResume: (lessonId: string) => void
}

/** The title card. `Cover` is the one portrait artboard in the file. */
export function Splash({ onStart, onResume }: Props) {
  const { t, tr } = useI18n()
  const { progress } = useProgress()
  const [revealed, setRevealed] = useState(false)

  const nextUp = lessons.find((l) => !progress[l.id])
  const started = lessons.some((l) => progress[l.id])

  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 900)
    return () => window.clearTimeout(id)
  }, [])

  const play = (rive: Rive) => {
    const trigger = rive
      .stateMachineInputs('State Machine 1')
      ?.find((i) => i.name === 'start')
    trigger?.fire()
  }

  return (
    <div className="screen splash">
      <RiveStage
        artboard="Cover"
        stateMachine="State Machine 1"
        stage="navy"
        bindViewModel={false}
        // The cover is 810×1440; Cover-fit would crop the wordmark on a
        // narrower phone, and the artboard's navy matches the screen anyway.
        fit={Fit.Contain}
        className="splash__art"
        onReady={play}
      />

      <div className="splash__scrim" />

      <LangToggle className="splash__lang" />

      <div className={`splash__foot ${revealed ? 'is-in' : ''}`.trim()}>
        <p className="splash__tagline">{t('tagline')}</p>
        <button type="button" className="btn btn--primary btn--wide" onClick={onStart}>
          {started ? t('resume') : t('startCourse')}
        </button>
        {started && nextUp && (
          <button
            type="button"
            className="linkish linkish--center"
            onClick={() => onResume(nextUp.id)}
          >
            {t('lessonLink', {
              n: lessons.indexOf(nextUp) + 1,
              title: tr(nextUp.title),
            })}
          </button>
        )}
      </div>
    </div>
  )
}
