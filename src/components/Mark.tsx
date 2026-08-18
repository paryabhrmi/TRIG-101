interface Props {
  size?: number
}

/**
 * The app mark: a right triangle inscribed in a circle.
 *
 * Drawn from the palette tokens rather than literal hexes, so the mark cannot
 * drift away from the chrome around it. The right-angle tick used to be white,
 * which made it invisible on every surface the mark is actually placed on —
 * all three are paper. It is ink now, matching `public/favicon.svg`, which
 * carries the same artwork in literal hexes because a standalone SVG document
 * cannot read the app's custom properties.
 */
export function Mark({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="21"
        fill="none"
        stroke="var(--blue)"
        strokeWidth="2.5"
        opacity=".55"
      />
      <path
        d="M14 46 H46 L14 20 Z"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M14 46 H46" stroke="var(--amber)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M14 38 h8 v8"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2"
        opacity=".8"
      />
    </svg>
  )
}
