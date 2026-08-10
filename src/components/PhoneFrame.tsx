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
  return (
    <div className="framer">
      <button type="button" className="framer__close btn btn--ghost" onClick={onClose}>
        Close preview
      </button>
      <div className="framer__device">
        <div className="framer__notch" aria-hidden="true" />
        <div className="framer__screen">{children}</div>
      </div>
    </div>
  )
}
