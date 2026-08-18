import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { useEffect } from 'react'
import type { Rive } from '@rive-app/react-canvas'
import type { StageTone } from '../data/curriculum'

export const RIVE_SRC = `${import.meta.env.BASE_URL}trig101.riv`

interface Props {
  artboard: string
  stateMachine: string
  stage: StageTone
  bindViewModel: boolean
  /** Handed the Rive instance once the artboard is live. */
  onReady?: (rive: Rive) => void
  /**
   * Draw this artboard against another one's view-model instance instead of
   * its own. Used for control artboards that were authored separately from the
   * lesson they drive — sharing the instance is what reconnects them.
   */
  bindTo?: Rive | null
  className?: string
  fit?: Fit
  alignment?: Alignment
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
  bindTo,
  fit = Fit.Contain,
  alignment = Alignment.Center,
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
      layout: new Layout({ fit, alignment }),
    },
    { shouldResizeCanvasToContainer: true, useDevicePixelRatio: true },
  )

  useEffect(() => {
    if (rive) rive.layout = new Layout({ fit, alignment })
  }, [rive, fit, alignment])

  useEffect(() => {
    if (rive && onReady) onReady(rive)
    // `onReady` is expected to be stable; re-running on every parent render
    // would restart the consumer's polling loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  // A control artboard carries no data of its own; binding it to the artboard
  // it drives is what makes dragging it move anything.
  useEffect(() => {
    if (!rive || !bindTo) return
    const instance = (bindTo as unknown as { viewModelInstance?: unknown }).viewModelInstance
    if (!instance) return
    try {
      ;(rive as unknown as { bindViewModelInstance: (i: unknown) => void }).bindViewModelInstance(
        instance,
      )
    } catch {
      // An artboard with nothing bindable simply stays inert.
    }
  }, [rive, bindTo])

  return (
    <div className={`stage stage--${stage} ${className ?? ''}`.trim()}>
      <RiveComponent className="stage__canvas" />
      {!rive && <div className="stage__pending" aria-hidden="true" />}
    </div>
  )
}
