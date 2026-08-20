import { useCallback } from 'react'
import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { RiveStage } from '../components/RiveStage'
import { TOTAL_LESSONS, lessons } from '../data/curriculum'
import { useProgress } from '../lib/progress'
import type { Rive } from '@rive-app/react-canvas'

interface Props {
  onBack: () => void
}

/**
 * The file's `About` artboard is the credits card: two photographs, the two
 * names, and a row of social handles under each. Those handles are drawn in
 * Rive but a canvas cannot open a link, so each one fires a trigger on the
 * artboard's view model and the app opens the address here.
 *
 * The handles themselves are the artboard's own text — these addresses are
 * built from what the card already shows, never guessed.
 */
const PROFILES: Record<string, string> = {
  alirezaIG: 'https://instagram.com/alirzagharibi',
  alirezaLD: 'https://linkedin.com/in/alirezagharibi',
  paryaIG: 'https://instagram.com/paryabhrmii',
  paryaLD: 'https://linkedin.com/in/paryabhrmi',
}

export function About({ onBack }: Props) {
  const { progress, resetAll } = useProgress()
  const doneCount = lessons.filter((l) => progress[l.id]).length

  const wireProfiles = useCallback((rive: Rive) => {
    const vm = rive.viewModelInstance
    if (!vm) return
    for (const [name, url] of Object.entries(PROFILES)) {
      // A trigger the file no longer carries simply goes unwired; the card
      // still draws, it just stops opening that one profile.
      vm.trigger(name)?.on(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      })
    }
  }, [])

  return (
    <div className="screen about">
      <AppBar onBack={onBack} title="About this app" />

      <div className="about__scroll">
        <div className="about__hero">
          <Mark size={72} />
          <h2 className="about__name">Trigonometry 101</h2>
          <p className="about__kicker">Ayne Studio</p>
        </div>

        <div className="prose">
          <p>
            Fifteen interactive lessons that build one idea from the ground up: sine,
            cosine and tangent are not formulas to memorise, they are what you see
            when you watch a circle turn.
          </p>
          <p className="prose__dim">
            Animation and artwork by Ayne Studio, authored in Rive. Every slider,
            toggle and button you touch lives inside that file; this app is the
            course built around it, reading the artwork's own values back out as
            live readouts.
          </p>
        </div>

        {/* The team card, straight out of the file. Tapping a handle on it
            opens that profile — see `PROFILES`. */}
        <RiveStage
          artboard="About"
          stateMachine="State Machine 1"
          bindViewModel
          onReady={wireProfiles}
          className="stage--card"
        />

        <div className="about__stat">
          {doneCount} of {lessons.length} lessons complete · {lessons.length} of{' '}
          {TOTAL_LESSONS} built
        </div>

        {doneCount > 0 && (
          <button
            type="button"
            className="linkish linkish--center linkish--warn"
            onClick={() => {
              if (window.confirm('Clear every completed lesson?')) resetAll()
            }}
          >
            Reset progress
          </button>
        )}
        <div className="home__pad" />
      </div>
    </div>
  )
}
