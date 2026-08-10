import { useEffect, useState } from 'react'
import { ui } from '../data/ui'
import { useI18n } from '../lib/i18n'
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
  const { t } = useI18n()
  const [showHint, setShowHint] = useState(false)

  // A hint that stayed open from the previous lesson would be noise.
  useEffect(() => setShowHint(false), [checkpoint])

  return (
    <div className={`checkpoint ${solved ? 'is-solved' : ''}`.trim()}>
      <div className="checkpoint__head">
        <span className="checkpoint__badge" aria-hidden="true">
          {solved ? '✓' : '◆'}
        </span>
        <span className="checkpoint__kicker">
          {solved ? t(ui.solved) : t(ui.tryIt)}
        </span>
      </div>

      <p className="checkpoint__goal">{t(checkpoint.goal)}</p>

      {solved ? (
        <p className="checkpoint__note">{t(ui.solvedNote)}</p>
      ) : showHint ? (
        <p className="checkpoint__note">{t(checkpoint.hint)}</p>
      ) : (
        <button type="button" className="linkish" onClick={() => setShowHint(true)}>
          {t(ui.hint)}
        </button>
      )}
    </div>
  )
}
