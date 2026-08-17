interface Props {
  size?: number
}

/**
 * The app mark: the unit circle with its angle arm, and the right triangle the
 * arm drops onto the axis.
 *
 * The previous mark inscribed a triangle whose hypotenuse ran corner to corner
 * through the middle of the circle. At icon sizes that is the universal "no /
 * forbidden" sign, which is a bad thing for a course to wear — worst of all on
 * the coming-soon screen, where it sat in a dashed box and read as a refusal.
 *
 * Keeping the triangle in one quadrant fixes it: nothing crosses the centre,
 * and the shape now says what the course is actually about.
 */
export function Mark({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      {/* The circle, drawn thin so the triangle inside it stays the subject */}
      <circle cx="26" cy="40" r="22" fill="none" stroke="#0075FF" strokeWidth="1.8" opacity=".4" />
      {/* The axis it turns against */}
      <path d="M4 40 H50" stroke="#B9C4E0" strokeWidth="1.8" strokeLinecap="round" />
      {/* Adjacent — along the axis */}
      <path d="M26 40 H42.6" stroke="#FEAF36" strokeWidth="4.5" strokeLinecap="round" />
      {/* Opposite — the drop from the arm to the axis */}
      <path d="M42.6 40 V23.4" stroke="#2BAFF7" strokeWidth="4.5" strokeLinecap="round" />
      {/* Hypotenuse — the radius arm, at 45° so the triangle reads as a shape
          rather than a sliver */}
      <path d="M26 40 L42.6 23.4" stroke="#854DB8" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}
