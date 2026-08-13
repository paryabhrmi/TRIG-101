import { useEffect, useState } from 'react'

/** Below this width the mobile course runs; at or above it, the gate shows. */
export const DESKTOP_MIN = 900

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${DESKTOP_MIN}px)`)
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
