import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Mark } from './Mark'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Shown as text beside the code. A QR is unreadable to a person, so if it
  // fails to draw — or the reader has no camera to hand — the address is still
  // there to type.
  const url = `${window.location.origin}${window.location.pathname}`

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    QRCode.toCanvas(canvas, window.location.href, {
      width: 168,
      margin: 1,
      color: { dark: '#141a46', light: '#ffffff' },
    }).catch(() => {
      // A missing QR is cosmetic; the address below it still gets you there.
    })
  }, [])

  return (
    <div className="gate">
      <div className="gate__inner">
        <div className="gate__mark">
          <Mark size={64} />
        </div>

        <span className="gate__kicker">AYNE Studio presents</span>
        <h1 className="gate__title">Trigonometry 101</h1>
        <p className="gate__tagline">
          Learn sine, cosine and tangent by dragging — not by reading.
        </p>

        <div className="gate__card">
          <div className="gate__copy">
            <span className="gate__badge">Desktop — coming soon</span>
            <h2 className="gate__h2">Built for your phone</h2>
            <p className="gate__body">
              Every lesson here is something you drag with a thumb. The desktop build
              is not ready yet — open this page on a phone to take the course.
            </p>
            <button type="button" className="btn btn--ghost" onClick={onPreview}>
              Preview in a phone frame
            </button>
          </div>

          <div className="gate__qr">
            <canvas ref={canvasRef} width={168} height={168} />
            <span>Scan to open on your phone</span>
            <code className="gate__url">{url.replace(/^https?:\/\//, '')}</code>
          </div>
        </div>
      </div>
    </div>
  )
}
