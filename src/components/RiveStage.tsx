import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import { useEffect, useRef } from 'react'
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
  className?: string
  fit?: Fit
}

/**
 * Every artboard in the file is square or near it (`Ratio` is 500×538, the
 * rest are 1:1), so on a portrait stage `FitWidth` and `Contain` scale
 * identically — but `FitWidth` also guarantees the artwork reaches both edges
 * of the screen whatever height the stage ends up with. It is only unsafe once
 * the stage is wider than the artboard, which is the landscape layout, and
 * there `Contain` takes over so nothing is cropped.
 */
const fitFor = (box: HTMLElement | null): Fit =>
  box && box.clientWidth > box.clientHeight ? Fit.Contain : Fit.FitWidth

/**
 * A square artboard on a tall phone leaves slack above and below it. Settling
 * the artwork on the bottom of the stage collects that slack into one band
 * under the app bar instead of splitting it in two — and it puts the sliders,
 * which sit along the artboard's bottom edge, within easy reach of the thumb.
 */
const alignFor = (box: HTMLElement | null): Alignment =>
  box && box.clientWidth > box.clientHeight ? Alignment.Center : Alignment.BottomCenter

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
  fit,
}: Props) {
  const box = useRef<HTMLDivElement>(null)

  const { rive, RiveComponent } = useRive(
    {
      src: RIVE_SRC,
      artboard,
      stateMachines: stateMachine,
      autoplay: true,
      // Binding an artboard that has no view model logs a runtime error, so
      // only opt in where the file actually defines one.
      autoBind: bindViewModel,
      layout: new Layout({ fit: fit ?? Fit.FitWidth, alignment: Alignment.BottomCenter }),
    },
    { shouldResizeCanvasToContainer: true, useDevicePixelRatio: true },
  )

  useEffect(() => {
    if (rive && onReady) onReady(rive)
    // `onReady` is expected to be stable; re-running on every parent render
    // would restart the consumer's polling loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  // Rotating the phone changes which fit is safe, so the layout is re-applied
  // rather than fixed at load.
  useEffect(() => {
    if (!rive || fit) return

    const apply = () => {
      const nextFit = fitFor(box.current)
      const nextAlign = alignFor(box.current)
      if (rive.layout.fit !== nextFit || rive.layout.alignment !== nextAlign) {
        rive.layout = new Layout({ fit: nextFit, alignment: nextAlign })
      }
    }

    apply()
    const observer = new ResizeObserver(apply)
    if (box.current) observer.observe(box.current)
    return () => observer.disconnect()
  }, [rive, fit])

  return (
    <div ref={box} className={`stage stage--${stage} ${className ?? ''}`.trim()}>
      <RiveComponent className="stage__canvas" />
      {!rive && <div className="stage__pending" aria-hidden="true" />}
    </div>
  )
}
