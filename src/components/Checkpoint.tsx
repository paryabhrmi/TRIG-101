import { useEffect, useState } from 'react'
import type { Checkpoint as CheckpointModel } from '../data/curriculum'

interface Props {
  checkpoint: CheckpointModel
  solved: boolean
}

/**
 * The per-lesson task. It is deliberately a thing to *do* on the canvas rather
 * than a multiple-choice question — the artboard already knows the answer, so
 * the app just watches for it.
 */
export function Checkpoint({ checkpoint, solved }: Props) {
  const [showHint, setShowHint] = useState(false)

  // A hint that stayed open from the previous lesson would be noise.
  useEffect(() => setShowHint(false), [checkpoint])

  return (
    <div className={`checkpoint ${solved ? 'is-solved' : ''}`.trim()}>
      <div className="checkpoint__head">
        <span className="checkpoint__badge" aria-hidden="true">
          {solved ? '✓' : '◆'}
        </span>
        <span className="checkpoint__kicker">{solved ? 'Got it' : 'Try this'}</span>
      </div>

      <p className="checkpoint__goal">{checkpoint.goal}</p>

      {solved ? (
        <p className="checkpoint__note">Checkpoint cleared.</p>
      ) : showHint ? (
        <p className="checkpoint__note">{checkpoint.hint}</p>
      ) : (
        <button type="button" className="linkish" onClick={() => setShowHint(true)}>
          Need a hint?
        </button>
      )}
    </div>
  )
}
