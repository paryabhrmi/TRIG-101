import { useI18n } from '../lib/i18n'
import type { Readout } from '../data/curriculum'

interface Props {
  readouts: Readout[]
  values: string[]
}

/** The live numeric mirror of whatever the learner is dragging on the canvas. */
export function Instruments({ readouts, values }: Props) {
  const { t } = useI18n()
  if (!readouts.length) return null

  return (
    <ul className="instruments">
      {readouts.map((r, i) => (
        <li key={r.id} className={`chip chip--${r.tone}`}>
          <span className="chip__label">{t(r.label)}</span>
          <span className="chip__value" dir="ltr">
            {values[i] ?? '—'}
          </span>
        </li>
      ))}
    </ul>
  )
}
