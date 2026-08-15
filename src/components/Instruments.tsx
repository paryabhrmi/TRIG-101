import type { Readout } from '../data/curriculum'

interface Props {
  readouts: Readout[]
  values: string[]
}

/**
 * The live numeric mirror of whatever the learner is dragging on the canvas.
 *
 * The tiles stay visually quiet — the accent lives only in the label, which
 * matches it to the coloured side it mirrors on the canvas above.
 */
export function Instruments({ readouts, values }: Props) {
  if (!readouts.length) return null

  return (
    <ul className="instruments">
      {readouts.map((r, i) => (
        <li key={r.id} className={`chip chip--${r.tone}`}>
          <span className="chip__label">{r.label}</span>
          <span className="chip__value">{values[i] ?? '—'}</span>
        </li>
      ))}
    </ul>
  )
}
