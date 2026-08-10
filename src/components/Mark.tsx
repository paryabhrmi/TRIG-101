interface Props {
  size?: number
}

/** The app mark: a right triangle inscribed in a circle, in the file's palette. */
export function Mark({ size = 56 }: Props) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="21" fill="none" stroke="#0075FF" strokeWidth="2" opacity=".6" />
      <path
        d="M14 46 H46 L14 20 Z"
        fill="none"
        stroke="#2BAFF7"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M14 46 H46" stroke="#FEAF36" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 38 h8 v8" fill="none" stroke="#ffffff" strokeWidth="2" opacity=".75" />
    </svg>
  )
}
