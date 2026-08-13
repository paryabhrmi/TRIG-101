import { AppBar } from '../components/AppBar'
import { Mark } from '../components/Mark'
import { TOTAL_LESSONS, lessons } from '../data/curriculum'
import { useProgress } from '../lib/progress'

interface Props {
  onBack: () => void
}

export function About({ onBack }: Props) {
  const { progress, resetAll } = useProgress()
  const doneCount = lessons.filter((l) => progress[l.id]).length

  return (
    <div className="screen about">
      <AppBar onBack={onBack} title="About this app" />

      <div className="about__scroll">
        <div className="about__hero">
          <Mark size={72} />
          <h2 className="about__name">Trigonometry 101</h2>
        </div>

        <div className="prose">
          <p>
            Fifteen interactive lessons that build one idea from the ground up: sine,
            cosine and tangent are not formulas to memorise, they are what you see
            when you watch a circle turn.
          </p>
          <p className="prose__dim">
            Animation and artwork authored in Rive. Every
            slider, toggle and button you touch lives inside that file; this app is
            the course built around it, reading the artwork's own values back out as
            live readouts.
          </p>
        </div>

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
