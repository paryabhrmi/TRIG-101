/**
 * Which bottom pane the lesson screen renders.
 *
 * `bar` is the current design: a fixed-height dock. `sheet` is the previous
 * one, a collapsible bottom sheet, kept whole so a deploy can be reverted
 * without a redeploy — useful while the new pane is being reviewed on a
 * Vercel preview URL.
 *
 * Pick one with `?ui=sheet` (or `?ui=bar`) anywhere in the address; the choice
 * is remembered afterwards, since hash routing drops the query on navigation.
 */
export type UiMode = 'bar' | 'sheet'

const KEY = 'trig101:ui'
const DEFAULT: UiMode = 'bar'

const isMode = (v: string | null): v is UiMode => v === 'bar' || v === 'sheet'

/** The `ui` parameter, from before or after the hash — either is valid here. */
function fromAddress(): UiMode | null {
  if (typeof window === 'undefined') return null

  const search = new URLSearchParams(window.location.search).get('ui')
  if (isMode(search)) return search

  const hash = window.location.hash
  const q = hash.indexOf('?')
  if (q >= 0) {
    const inHash = new URLSearchParams(hash.slice(q + 1)).get('ui')
    if (isMode(inHash)) return inHash
  }
  return null
}

export function uiMode(): UiMode {
  const chosen = fromAddress()
  if (chosen) {
    try {
      window.localStorage.setItem(KEY, chosen)
    } catch {
      // Private mode: honour the address for this session and move on.
    }
    return chosen
  }

  try {
    const stored = window.localStorage.getItem(KEY)
    if (isMode(stored)) return stored
  } catch {
    // No storage, no preference.
  }
  return DEFAULT
}
