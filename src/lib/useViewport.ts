import { useEffect, useState } from 'react'

/** Below this width the mobile course runs; at or above it, the gate shows. */
export const DESKTOP_MIN = 900

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
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
