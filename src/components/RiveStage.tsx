import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { useEffect, useState } from 'react'
import type { Rive } from '@rive-app/react-canvas'

export const RIVE_SRC = `${import.meta.env.BASE_URL}trig101.riv`

interface Props {
  artboard: string
  stateMachine: string
  bindViewModel: boolean
  /** Handed the Rive instance once the artboard is live. */
  onReady?: (rive: Rive) => void
  className?: string
}

/**
 * A single Rive artboard, drawn the full width of whatever it sits in.
 *
 * The box takes the artboard's own aspect ratio, read off the file on load
 * rather than hard-coded here, so the artwork lands edge to edge with nothing
 * cropped and nothing letterboxed — `Ratio` is 500×570 where the rest are
 * square, and a fixed square box would have pillarboxed it.
 *
 * The artboards ship with their own sliders and toggles, so this canvas is the
 * app's primary input surface — hence `touch-action: none`, which stops a drag
 * on a slider from scrolling the page out from under it.
 */
export function RiveStage({
  artboard,
  stateMachine,
  bindViewModel,
  onReady,
  className,
}: Props) {
  const { rive, RiveComponent } = useRive(
    {
      src: RIVE_SRC,
      artboard,
      stateMachines: stateMachine,
      autoplay: true,
      // Binding an artboard that has no view model logs a runtime error, so
      // only opt in where the file actually defines one.
      autoBind: bindViewModel,
      /**
       * `Fit.Contain` against a box already cut to the artboard's ratio is an
       * exact width fit: no scale-down, no bars, no crop.
       *
       * `Fit.None` was measured as the alternative and does not survive
       * contact with this file. It pins the artboard to one artboard-unit per
       * *device* pixel while the runtime maps touches in CSS pixels, so on a
       * 390px screen a drag across the SecretRatios slider moved the angle
       * 23.9° where the pointer asked for 30.7° — the knob walks out from
       * under the thumb. It also caps the drawing surface at the artboard's
       * own 500px, which is a third of the pixels a modern phone wants. Since
       * every lesson here is a thumb-drag, that trade is not available.
       */
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    },
    { shouldResizeCanvasToContainer: true, useDevicePixelRatio: true },
  )

  // Read off the file rather than tabulated here, so re-exporting an artboard
  // at a new size needs no code change.
  const [ratio, setRatio] = useState<number | null>(null)

  useEffect(() => {
    if (!rive) return
    const bounds = rive.bounds
    if (bounds) {
      const w = bounds.maxX - bounds.minX
      const h = bounds.maxY - bounds.minY
      if (w > 0 && h > 0) setRatio(w / h)
    }
    onReady?.(rive)
    // `onReady` is expected to be stable; re-running on every parent render
    // would restart the consumer's polling loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  return (
    <div
      className={`stage ${className ?? ''}`.trim()}
      // Square until the file says otherwise: every artboard but `Ratio` is
      // 1:1, so the box is the right shape before the first frame is drawn and
      // the layout never jumps as the artboard arrives.
      style={{ aspectRatio: ratio ?? 1 }}
    >
      <RiveComponent className="stage__canvas" />
      {!rive && <div className="stage__pending" aria-hidden="true" />}
    </div>
  )
}
