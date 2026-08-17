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

/**
 * The open height is the step's own height, capped — not the cap itself.
 * A sheet that always opens to its ceiling leaves the short steps ending in
 * a hand's width of blank paper, which reads as content failing to load
 * rather than as a step that is simply short. `content` is the height this
 * step actually needs; only the steps that exceed the cap scroll.
 */
function metrics(safeBottom: number, content: number) {
  const vh = window.visualViewport?.height ?? window.innerHeight
  const peek = Math.min(PEEK_MAX, Math.max(PEEK_MIN, vh * PEEK_VH)) + safeBottom
  const ceiling = Math.min(OPEN_MAX, vh * OPEN_VH) + safeBottom
  const open = content > 0 ? Math.min(ceiling, Math.max(peek, content)) : ceiling
  return { peek, open }
}

/**
 * What this step would occupy if nothing constrained it: the sheet's own
 * chrome (grabber, steps, docked action) plus the copy's natural height.
 * Measured off the scroller's inner wrapper, because a scroller's own
 * `scrollHeight` never reports less than the box it is given.
 */
function contentHeight(sheet: HTMLElement) {
  const scroll = sheet.querySelector<HTMLElement>('.sheet__scroll')
  const inner = sheet.querySelector<HTMLElement>('.sheet__inner')
  if (!scroll || !inner) return 0
  const pad = getComputedStyle(scroll)
  const padding = Number.parseFloat(pad.paddingTop) + Number.parseFloat(pad.paddingBottom)
  const chrome = sheet.offsetHeight - scroll.offsetHeight
  return chrome + inner.offsetHeight + padding
}

function safeAreaBottom(el: HTMLElement) {
  const raw = getComputedStyle(el).getPropertyValue('--safe-b').trim()
  return Number.parseFloat(raw) || 0
}

export function useBottomSheet(open: boolean, setOpen: (open: boolean) => void) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
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
    const { peek, open: openH } = metrics(safeAreaBottom(el), contentHeight(el))
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

  // Each step brings its own amount of copy, so the open height is re-measured
  // whenever that copy changes. Observing the inner wrapper rather than the
  // sheet avoids a feedback loop: its width is what wraps the text, and the
  // height we set never touches it.
  useEffect(() => {
    const inner = sheetRef.current?.querySelector('.sheet__inner')
    if (!inner) return
    const ro = new ResizeObserver(applyMetrics)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [applyMetrics])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = sheetRef.current
      if (!el) return
      const { peek, open: openH } = metrics(safeAreaBottom(el), contentHeight(el))
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

    // The backdrop darkens in lockstep with how open the sheet is, not just
    // at the two endpoints — that's what makes a mid-drag feel connected to
    // the sheet instead of the scrim just snapping in afterwards.
    const scrim = scrimRef.current
    if (scrim) scrim.style.opacity = String((next - d.peek) / (d.open - d.peek))
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
      // the drag that just ended, then hand both back to their CSS classes
      // once the transition settles so a later resize keeps tracking them.
      el.style.height = `${shouldOpen ? d.open : d.peek}px`
      if (scrimRef.current) scrimRef.current.style.opacity = shouldOpen ? '1' : '0'
      setOpen(shouldOpen)
      window.setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.height = ''
        if (scrimRef.current) scrimRef.current.style.opacity = ''
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

  // Tapping the dimmed backdrop is the expected way to back out of the open
  // sheet without hunting for the handle.
  const collapse = useCallback(() => setOpen(false), [setOpen])

  return {
    sheetRef,
    scrimRef,
    dragging,
    toggle,
    collapse,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
