import { useI18n } from '../lib/i18n'
import type { ReactNode } from 'react'

interface Props {
  onBack?: () => void
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  /** 0–1. Renders the hairline course progress bar under the bar. */
  progress?: number
}

export function AppBar({ onBack, title, subtitle, right, progress }: Props) {
  const { dir } = useI18n()
  const backGlyph = dir === 'rtl' ? '›' : '‹'

  return (
    <header className="appbar">
      <div className="appbar__row">
        {onBack ? (
          <button type="button" className="iconbtn" onClick={onBack} aria-label="Back">
            <span aria-hidden="true">{backGlyph}</span>
          </button>
        ) : (
          <span className="iconbtn iconbtn--ghost" aria-hidden="true" />
        )}

        <div className="appbar__titles">
          {subtitle && <span className="appbar__sub">{subtitle}</span>}
          {title && <span className="appbar__title">{title}</span>}
        </div>

        <div className="appbar__right">{right}</div>
      </div>

      {progress !== undefined && (
        <div className="appbar__track" aria-hidden="true">
          <div
            className="appbar__fill"
            style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }}
          />
        </div>
      )}
    </header>
  )
}
