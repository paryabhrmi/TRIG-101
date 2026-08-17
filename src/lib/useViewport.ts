import { useEffect, useState } from 'react'

/** Below this width the mobile course runs; at or above it, the gate shows. */
export const DESKTOP_MIN = 900

/**
 * The gate exists because every lesson is a thumb-drag, so what disqualifies a
 * viewport is the absence of a thumb — not its width. Width alone turned away
 * a landscape tablet, which has a touchscreen and could take the course as
 * authored, while a narrowed desktop window sailed past it with only a mouse.
 *
 * `pointer: coarse` is the actual question, so it is the one asked; width
 * still decides for the pointerless case, where the layout is the problem.
 */
const QUERY = `(min-width: ${DESKTOP_MIN}px) and (pointer: fine)`

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

/**
 * Keeps a `--vh` custom property in sync with the *visual* viewport.
 *
 * Mobile Safari's `100vh` includes the URL bar, which would push the lesson
 * sheet off-screen. `100dvh` covers most of this, but the visual viewport is
 * the only thing that is right while a browser chrome animation is running.
 */
export function useViewportHeight() {
  useEffect(() => {
    const apply = () => {
      const h = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--vh', `${h}px`)
    }
    apply()
    window.visualViewport?.addEventListener('resize', apply)
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      window.visualViewport?.removeEventListener('resize', apply)
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])
}
