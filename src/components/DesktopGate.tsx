import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { LangToggle } from './LangToggle'
import { Mark } from './Mark'
import { ui } from '../data/ui'
import { useI18n } from '../lib/i18n'

interface Props {
  onPreview: () => void
}

/**
 * Desktop is deliberately not shipped in this MVP.
 *
 * Every lesson is a thumb-drag on a canvas sized for a phone, so rather than
 * stretching that to 1440px and calling it a desktop app, the wide viewport
 * gets an honest gate with a QR code. The phone-frame preview below it is the
 * same mobile build at phone dimensions — for review, not a desktop layout.
 */
export function DesktopGate({ onPreview }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    QRCode.toCanvas(canvas, window.location.href, {
      width: 168,
      margin: 1,
      color: { dark: '#0d1062', light: '#ffffff' },
    }).catch(() => {
      // A missing QR is cosmetic; the URL is in the address bar either way.
    })
  }, [])

  return (
    <div className="gate">
      <div className="blueprint" />

      <div className="gate__lang">
        <LangToggle />
      </div>

      <div className="gate__inner">
        <div className="gate__mark">
          <Mark size={64} />
        </div>

        <span className="gate__kicker">{t(ui.presents)}</span>
        <h1 className="gate__title">{t(ui.appName)}</h1>
        <p className="gate__tagline">{t(ui.tagline)}</p>

        <div className="gate__card">
          <div className="gate__copy">
            <span className="gate__badge">{t(ui.desktopSoon)}</span>
            <h2 className="gate__h2">{t(ui.desktopTitle)}</h2>
            <p className="gate__body">{t(ui.desktopBody)}</p>
            <button type="button" className="btn btn--ghost" onClick={onPreview}>
              {t(ui.desktopPreview)}
            </button>
          </div>

          <div className="gate__qr">
            <canvas ref={canvasRef} width={168} height={168} />
            <span>{t(ui.desktopScan)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
