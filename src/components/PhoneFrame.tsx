import { ui } from '../data/ui'
import { useI18n } from '../lib/i18n'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClose: () => void
}

/**
 * Renders the mobile app at phone dimensions on a wide screen. This exists so
 * the build can be reviewed from a laptop; it is not a desktop layout, and the
 * app inside is byte-for-byte the mobile one.
 */
export function PhoneFrame({ children, onClose }: Props) {
  const { t } = useI18n()

  return (
    <div className="framer">
      <div className="blueprint" />
      <button type="button" className="framer__close btn btn--ghost" onClick={onClose}>
        {t(ui.desktopExit)}
      </button>
      <div className="framer__device">
        <div className="framer__notch" aria-hidden="true" />
        <div className="framer__screen">{children}</div>
      </div>
    </div>
  )
}
