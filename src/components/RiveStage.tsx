import { Alignment, Fit, Layout, useRive } from '@rive-app/react-webgl'
import { useEffect } from 'react'
import type { Rive } from '@rive-app/react-webgl'
import type { StageTone } from '../data/curriculum'

export const RIVE_SRC = `${import.meta.env.BASE_URL}trig101.riv`

interface Props {
  artboard: string
  stateMachine: string
  stage: StageTone
  bindViewModel: boolean
  /** Handed the Rive instance once the artboard is live. */
  onReady?: (rive: Rive) => void
  className?: string
  fit?: Fit
}

/**
 * A single Rive artboard, sized to its container.
 *
 * The artboards ship with their own sliders and toggles, so this canvas is the
 * app's primary input surface — hence `touch-action: none`, which stops a drag
 * on a slider from scrolling the page out from under it.
 */
export function RiveStage({
  artboard,
  stateMachine,
  stage,
  bindViewModel,
  onReady,
  className,
  fit = Fit.Contain,
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
      layout: new Layout({ fit, alignment: Alignment.Center }),
    },
    { shouldResizeCanvasToContainer: true, useDevicePixelRatio: true },
  )

  useEffect(() => {
    if (rive && onReady) onReady(rive)
    // `onReady` is expected to be stable; re-running on every parent render
    // would restart the consumer's polling loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  return (
    <div className={`stage stage--${stage} ${className ?? ''}`.trim()}>
      <RiveComponent className="stage__canvas" />
      {!rive && <div className="stage__pending" aria-hidden="true" />}
    </div>
  )
}
