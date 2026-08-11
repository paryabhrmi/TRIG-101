import { useCallback, useEffect, useState } from 'react'

/**
 * Hash routing, deliberately.
 *
 * GitHub Pages serves static files with no rewrite rules, so a history-API
 * router would 404 on any deep link that is not the index. `#/lesson/ratio`
 * always resolves.
 */
export type Route =
  | { name: 'splash' }
  | { name: 'home' }
  | { name: 'lesson'; id: string }
  | { name: 'review'; chapter: number }
  | { name: 'about' }

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0]
  const [head, tail] = path.split('/')
  if (head === 'lesson' && tail) return { name: 'lesson', id: decodeURIComponent(tail) }
  if (head === 'review' && tail) {
    const chapter = Number(tail)
    if (Number.isFinite(chapter)) return { name: 'review', chapter }
  }
  if (head === 'about') return { name: 'about' }
  if (head === 'home') return { name: 'home' }
  return { name: 'splash' }
}

export function toPath(route: Route): string {
  switch (route.name) {
    case 'lesson':
      return `#/lesson/${encodeURIComponent(route.id)}`
    case 'review':
      return `#/review/${route.chapter}`
    case 'about':
      return '#/about'
    case 'home':
      return '#/home'
    case 'splash':
      return '#/'
  }
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route, replace = false) => {
    const path = toPath(next)
    if (replace) {
      window.history.replaceState(null, '', path)
      setRoute(next)
    } else {
      window.location.hash = path
    }
  }, [])

  return { route, navigate }
}
