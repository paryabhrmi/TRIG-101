import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A professional bottom sheet lives outside the flow of whatever it sits
 * over — the canvas behind it never resizes as the sheet moves, and the
 * sheet itself is bottom-anchored, so growing it only pushes its top edge
 * up. This hook owns the pixel math and the drag gesture; the caller only
 * supplies the open/closed boolean it already has.
 */

const PEEK_MIN = 216
const PEEK_MAX = 276
const PEEK_VH = 0.32
const OPEN_MAX = 470
const OPEN_VH = 0.58

/** A flick faster than this (px/ms) snaps by direction, ignoring position. */
const FLICK_VELOCITY = 0.35
/** Velocity is measured over this trailing window, not sample-to-sample —
 * a single noisy interval (common right as a finger lifts off) would
 * otherwise decide the whole gesture. */
const VELOCITY_WINDOW_MS = 80

function metrics(safeBottom: number) {
  const vh = window.visualViewport?.height ?? window.innerHeight
  const peek = Math.min(PEEK_MAX, Math.max(PEEK_MIN, vh * PEEK_VH)) + safeBottom
  const open = Math.min(OPEN_MAX, vh * OPEN_VH) + safeBottom
  return { peek, open }
}

function safeAreaBottom(el: HTMLElement) {
  const raw = getComputedStyle(el).getPropertyValue('--safe-b').trim()
  return Number.parseFloat(raw) || 0
}

export function useBottomSheet(open: boolean, setOpen: (open: boolean) => void) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const drag = useRef<{
    startY: number
    startHeight: number
    peek: number
    open: number
    moved: boolean
    /** Trailing (time, y) samples for the windowed velocity estimate. */
    history: { t: number; y: number }[]
  } | null>(null)

  // A mouse/touch drag still fires a native `click` on release even though
  // the pointer moved — without this, that click's own toggle would undo
  // whatever the drag just decided.
  const justDragged = useRef(false)

  const applyMetrics = useCallback(() => {
    const el = sheetRef.current
    if (!el) return
    const { peek, open: openH } = metrics(safeAreaBottom(el))
    el.style.setProperty('--sheet-peek-h', `${peek}px`)
    el.style.setProperty('--sheet-open-h', `${openH}px`)
  }, [])

  useEffect(() => {
    applyMetrics()
    window.addEventListener('resize', applyMetrics)
    window.visualViewport?.addEventListener('resize', applyMetrics)
    return () => {
      window.removeEventListener('resize', applyMetrics)
      window.visualViewport?.removeEventListener('resize', applyMetrics)
    }
  }, [applyMetrics])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = sheetRef.current
      if (!el) return
      const { peek, open: openH } = metrics(safeAreaBottom(el))
      drag.current = {
        startY: e.clientY,
        startHeight: open ? openH : peek,
        peek,
        open: openH,
        moved: false,
        history: [{ t: e.timeStamp, y: e.clientY }],
      }
      // Captured immediately, not once a move threshold is crossed: a fast
      // drag's very first move can already land past the handle's small hit
      // area, and a handler that isn't capturing yet never sees it again.
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [open],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    const el = sheetRef.current
    if (!d || !el) return
    const delta = e.clientY - d.startY

    if (!d.moved) {
      if (Math.abs(delta) < 4) return
      d.moved = true
      setDragging(true)
    }

    d.history.push({ t: e.timeStamp, y: e.clientY })
    while (d.history.length > 2 && e.timeStamp - d.history[0].t > VELOCITY_WINDOW_MS) {
      d.history.shift()
    }

    // Dragging up (negative delta) grows the sheet; dragging down shrinks it.
    const next = Math.min(d.open, Math.max(d.peek, d.startHeight - delta))
    el.style.height = `${next}px`
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      const el = sheetRef.current
      drag.current = null
      if (!d || !el) return
      if (!d.moved) return // a tap with no real movement — let onClick handle it

      setDragging(false)
      const delta = e.clientY - d.startY
      const current = Math.min(d.open, Math.max(d.peek, d.startHeight - delta))
      const mid = (d.peek + d.open) / 2

      const first = d.history[0]
      const last = d.history[d.history.length - 1]
      const windowDt = last.t - first.t
      const velocity = windowDt > 0 ? (last.y - first.y) / windowDt : 0
      const shouldOpen = Math.abs(velocity) > FLICK_VELOCITY ? velocity < 0 : current > mid

      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 300)

      // Animate to the exact target in px so the motion is continuous with
      // the drag that just ended, then hand height back to the CSS class
      // once the transition settles so a later resize keeps tracking it.
      el.style.height = `${shouldOpen ? d.open : d.peek}px`
      setOpen(shouldOpen)
      window.setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.height = ''
      }, 380)
    },
    [setOpen],
  )

  // A plain tap on the handle (no real movement) still needs to toggle —
  // this is what the handle's onClick should call instead of setOpen
  // directly, so the drag's own decision always wins over the trailing
  // synthetic click.
  const toggle = useCallback(() => {
    if (justDragged.current) {
      justDragged.current = false
      return
    }
    setOpen(!open)
  }, [open, setOpen])

  return {
    sheetRef,
    dragging,
    toggle,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
