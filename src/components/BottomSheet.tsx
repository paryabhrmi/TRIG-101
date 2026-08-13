import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react'

export type SheetSnap = 'peek' | 'half' | 'full'

export interface SheetMetrics {
  /** Height of the always-visible peek region. */
  peek: number
  /** Height of the half stop — the stage is laid out against these two. */
  half: number
}

interface Props {
  /** Controlled snap position. Steps set their preferred height through this. */
  snap: SheetSnap
  onSnap: (next: SheetSnap) => void
  /** Height of the app bar — at `full` the sheet stops just below it. */
  topInset: number
  /**
   * The always-visible region: grab handle, step tabs, the current
   * instruction and the live readouts. Everything the learner needs while a
   * finger is on the canvas.
   */
  peek: ReactNode
  /** Reports the snap geometry so the stage can be laid out against it. */
  onMetrics?: (m: SheetMetrics) => void
  /** Landscape side-panel mode: no drag, no snaps, everything scrolls. */
  isStatic?: boolean
  /** Changing this scrolls the expanded region back to the top (step id). */
  resetKey?: unknown
  children: ReactNode
}

/** Finger travel before a touch counts as a drag rather than a tap. */
const DRAG_START_PX = 7
/** How far ahead the release velocity is projected when picking a snap. */
const PROJECT_MS = 170

const ORDER: SheetSnap[] = ['peek', 'half', 'full']

interface Gesture {
  id: number
  startY: number
  /** Sheet offset (visible height) when the drag activated. */
  startOffset: number
  /** Latest offset applied during the drag. */
  offset: number
  active: boolean
  /** Gesture began inside a natively-scrollable body (snap === 'full'). */
  fromScroll: boolean
  lastY: number
  lastT: number
  /** Smoothed offset velocity in px/ms (positive = sheet growing). */
  v: number
  /** Window-level listeners, so a fast flick cannot escape the sheet. */
  cleanup: () => void
}

/**
 * The lesson's bottom sheet: all textual content lives here, over a Rive
 * canvas that is the app's real control surface.
 *
 * Three snap points share the screen with the artwork:
 *   peek — canvas first; only the handle, tabs, instruction and readouts show.
 *   half — the working set: peek plus the top of the expanded region.
 *   full — reading mode; the artwork dims behind a scrim.
 *
 * The stage is laid out against the *snapped* stop (peek or half), so every
 * in-canvas control stays visible at rest; only while a finger is actively
 * dragging does the sheet ride over the artwork.
 */
export function BottomSheet({
  snap,
  onSnap,
  topInset,
  peek,
  onMetrics,
  isStatic,
  resetKey,
  children,
}: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const peekRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)

  const [box, setBox] = useState({ host: 0, peek: 0 })

  useLayoutEffect(() => {
    if (isStatic) return
    const root = rootRef.current
    const peekEl = peekRef.current
    const host = root?.parentElement
    if (!root || !peekEl || !host) return

    const measure = () => {
      const peekPx = Math.ceil(peekEl.getBoundingClientRect().height)
      const hostPx = host.clientHeight
      setBox((prev) => (prev.host === hostPx && prev.peek === peekPx ? prev : { host: hostPx, peek: peekPx }))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    ro.observe(peekEl)
    return () => ro.disconnect()
  }, [isStatic])

  // Snap geometry. `full` clears the app bar by a hair; `half` sits at
  // roughly half the screen but never closer than a card's height to either
  // neighbour, so the three stops always feel distinct.
  const fullPx = Math.max(240, box.host - topInset - 8)
  const peekPx = Math.min(box.peek || 208, fullPx - 96)
  const halfPx = Math.min(Math.max(peekPx + 132, Math.round(box.host * 0.52)), fullPx - 56)
  const snapPx: Record<SheetSnap, number> = { peek: peekPx, half: halfPx, full: fullPx }
  const target = snapPx[snap]

  const onMetricsRef = useRef(onMetrics)
  onMetricsRef.current = onMetrics
  useEffect(() => {
    if (!isStatic && box.host > 0) onMetricsRef.current?.({ peek: peekPx, half: halfPx })
  }, [peekPx, halfPx, box.host, isStatic])

  const scrimFor = (offset: number) =>
    Math.min(0.44, Math.max(0, ((offset - halfPx) / Math.max(1, fullPx - halfPx)) * 0.44))

  const applyOffset = (offset: number) => {
    if (rootRef.current) {
      rootRef.current.style.transform = `translate3d(0, ${fullPx - offset}px, 0)`
    }
    if (scrimRef.current) {
      scrimRef.current.style.opacity = String(scrimFor(offset))
    }
  }

  // Entering a new step starts the reading fresh.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [resetKey])

  // A gesture must never outlive the component.
  useEffect(() => () => gesture.current?.cleanup(), [])

  const currentOffset = (): number => {
    const root = rootRef.current
    if (!root) return target
    const t = getComputedStyle(root).transform
    if (!t || t === 'none') return fullPx
    try {
      return fullPx - new DOMMatrixReadOnly(t).m42
    } catch {
      return target
    }
  }

  const handleMove = (e: PointerEvent) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dy = e.clientY - g.startY

    if (!g.active) {
      if (Math.abs(dy) < DRAG_START_PX) return
      if (g.fromScroll) {
        // Inside a scrolling body the sheet only takes over when the content
        // is at its top and the finger pulls down; otherwise it is a scroll.
        const atTop = (bodyRef.current?.scrollTop ?? 0) <= 0
        if (!atTop || dy < 0) {
          g.cleanup()
          gesture.current = null
          return
        }
        if (bodyRef.current) bodyRef.current.style.overflowY = 'hidden'
      }
      g.active = true
      g.startY = e.clientY
      g.startOffset = currentOffset()
      g.lastY = e.clientY
      g.lastT = e.timeStamp
      rootRef.current?.classList.add('is-dragging')
      if (scrimRef.current) scrimRef.current.style.transition = 'none'
      return
    }

    let offset = g.startOffset - (e.clientY - g.startY)
    // Rubber-band past the end stops instead of pinning dead.
    if (offset > fullPx) offset = Math.min(fullPx + 24, fullPx + (offset - fullPx) * 0.15)
    if (offset < peekPx) offset = Math.max(peekPx - 40, peekPx - (peekPx - offset) * 0.25)

    const dt = e.timeStamp - g.lastT
    if (dt > 0) {
      const instant = -(e.clientY - g.lastY) / dt
      g.v = g.v * 0.75 + instant * 0.25
      g.lastY = e.clientY
      g.lastT = e.timeStamp
    }

    g.offset = offset
    applyOffset(offset)
  }

  const handleEnd = (e: PointerEvent) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    g.cleanup()
    gesture.current = null
    if (bodyRef.current) bodyRef.current.style.overflowY = ''
    if (!g.active) return

    suppressClick.current = true
    rootRef.current?.classList.remove('is-dragging')
    if (scrimRef.current) scrimRef.current.style.transition = ''

    // Project the release velocity forward and land on the nearest stop.
    const projected = g.offset + g.v * PROJECT_MS
    let best: SheetSnap = 'peek'
    let bestDist = Infinity
    for (const key of ORDER) {
      const d = Math.abs(snapPx[key] - projected)
      if (d < bestDist) {
        bestDist = d
        best = key
      }
    }
    applyOffset(snapPx[best])
    if (best !== snap) onSnap(best)
  }

  // The window listeners are registered once per gesture but must always see
  // the latest render's snap geometry.
  const handleMoveRef = useRef(handleMove)
  handleMoveRef.current = handleMove
  const handleEndRef = useRef(handleEnd)
  handleEndRef.current = handleEnd

  const onPointerDown = (e: ReactPointerEvent) => {
    if (isStatic || !e.isPrimary || gesture.current) return
    suppressClick.current = false
    const body = bodyRef.current
    const inBody = !!body && body.contains(e.target as Node)

    // A fast flick can leave the sheet before the next pointer event fires,
    // so the drag listens on the window rather than relying on capture.
    const move = (ev: PointerEvent) => handleMoveRef.current(ev)
    const end = (ev: PointerEvent) => handleEndRef.current(ev)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)

    gesture.current = {
      id: e.pointerId,
      startY: e.clientY,
      startOffset: currentOffset(),
      offset: currentOffset(),
      active: false,
      fromScroll: inBody && snap === 'full',
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
      cleanup: () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', end)
      },
    }
  }

  // A drag that ends on a button must not also press it.
  const onClickCapture = (e: ReactMouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const cycle = () => onSnap(snap === 'full' ? 'peek' : snap === 'half' ? 'full' : 'half')

  if (isStatic) {
    return (
      <section className="bsheet bsheet--static" aria-label="Lesson panel">
        <div className="bsheet__peek">{peek}</div>
        <div className="bsheet__body is-open">{children}</div>
      </section>
    )
  }

  return (
    <>
      <div
        ref={scrimRef}
        className={`bsheet-scrim ${snap === 'full' ? 'is-active' : ''}`.trim()}
        style={{ opacity: scrimFor(target) }}
        onClick={() => onSnap('peek')}
        aria-hidden="true"
      />
      <section
        ref={rootRef}
        className="bsheet"
        style={{ height: fullPx, transform: `translate3d(0, ${fullPx - target}px, 0)` }}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        aria-label="Lesson panel"
      >
        <div ref={peekRef} className="bsheet__peek">
          <button
            type="button"
            className="bsheet__grip"
            onClick={cycle}
            aria-expanded={snap !== 'peek'}
            aria-label={snap === 'full' ? 'Collapse the lesson panel' : 'Expand the lesson panel'}
          >
            <span aria-hidden="true" />
          </button>
          {peek}
        </div>
        <div
          ref={bodyRef}
          className={`bsheet__body ${snap === 'full' ? 'is-open' : ''}`.trim()}
          inert={snap === 'peek' ? true : undefined}
        >
          {children}
        </div>
      </section>
    </>
  )
}
