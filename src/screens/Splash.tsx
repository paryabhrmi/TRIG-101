import { useEffect, useState } from 'react'
import { RiveStage } from '../components/RiveStage'
import { lessons } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import type { Rive } from '@rive-app/react-canvas'

interface Props {
  onStart: () => void
  onResume: (lessonId: string) => void
}

/** The title card. `Cover` is the one portrait artboard in the file. */
export function Splash({ onStart, onResume }: Props) {
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
        bindViewModel={false}
        // Pinned to the screen rather than to the artboard's 810×1440 ratio:
        // the cover's paper matches the page, so letterboxing it would only
        // draw a seam where there is nothing to see.
        className="splash__art"
        onReady={play}
      />

      <div className="splash__scrim" />

      <div className={`splash__foot ${revealed ? 'is-in' : ''}`.trim()}>
        <p className="splash__tagline">Learn sine, cosine and tangent</p>
        <button type="button" className="btn btn--primary btn--wide" onClick={onStart}>
          {started ? 'Resume' : 'Start the course'}
        </button>
        {started && nextUp && (
          <button
            type="button"
            className="linkish linkish--center"
            onClick={() => onResume(nextUp.id)}
          >
            Lesson {lessons.indexOf(nextUp) + 1} — {nextUp.title}
          </button>
        )}
      </div>
    </div>
  )
}
