/**
 * The lesson graph.
 *
 * Every entry points at one artboard inside `public/trig101.riv`. The artboards
 * ship with their own sliders, toggles and buttons, so the canvas — not the
 * page — is the control surface. The app reads the artboard's view-model each
 * frame to mirror its state as instrument readouts and to decide when a
 * checkpoint has been met.
 *
 * Property names and their ranges were calibrated against the runtime; see
 * README.md for the full map.
 */

/** Which of the file's two artboard themes this lesson uses. */
export type StageTone = 'navy' | 'deep' | 'paper'
export type Tone = 'blue' | 'cyan' | 'amber' | 'violet' | 'mint' | 'rose'

/** One frame of artboard state, sampled from the view model + state machine. */
export interface Sample {
  n: Record<string, number>
  b: Record<string, boolean>
  /**
   * The boolean inputs as they were when the artboard loaded. Defaults are not
   * always `false`, so "the learner flipped this" has to be expressed as a
   * change from the baseline rather than a specific value.
   */
  b0: Record<string, boolean>
}

export interface Readout {
  id: string
  label: string
  tone: Tone
  value: (s: Sample) => string
}

export interface Checkpoint {
  goal: string
  hint: string
  test: (s: Sample) => boolean
}

export interface LessonAction {
  /** State-machine input name. */
  input: string
  kind: 'trigger' | 'bool'
  label: string
  tone?: 'primary' | 'ghost'
  /** Pressing this satisfies the lesson instead of a measured checkpoint. */
  completes?: boolean
}

export interface Lesson {
  id: string
  artboard: string
  stateMachine: string
  stage: StageTone
  /** False for artboards that carry no view model (Rive warns if you bind). */
  bindViewModel: boolean
  chapter: number
  title: string
  tagline: string
  /** Step 1: what to touch. This is where the canvas is taught as a control. */
  watch: string
  body: string[]
  readouts: Readout[]
  actions?: LessonAction[]
  checkpoint?: Checkpoint
  /** Boolean state-machine inputs to mirror into `Sample.b`. */
  watchInputs?: string[]
  /**
   * Open the sheet's detail pane from the start. Set on lessons whose
   * instructions point at the readout panel — hiding what the text refers to
   * would break the link between instruction and referent.
   */
  detailFirst?: boolean
}

/**
 * A lesson that is planned but has no artboard wired up yet. The course is
 * scoped at 15; these are the slots still to be authored, shown in the index
 * so the shape of the whole course is visible from day one.
 */
export interface UpcomingLesson {
  id: string
  chapter: number
  title: string
  tagline: string
  /** What it will cover once the artboard exists. */
  note: string
}

/** One multiple-choice item in a chapter review. */
export interface Question {
  prompt: string
  options: string[]
  /** Index into `options`. */
  answer: number
  /** Shown after answering, right or wrong. Teaches, never just confirms. */
  explain: string
  /** The lesson to revisit when this is missed — remediation in one tap. */
  lesson?: string
}

export interface Chapter {
  id: number
  title: string
  blurb: string
  /**
   * Checkpoints prove the learner moved a slider; these prove they understood
   * why. Placed at the end of a chapter so a question can span several
   * lessons rather than echo the one just finished.
   */
  review?: Question[]
}

const SM = 'State Machine 1'
const DEG = 180 / Math.PI

const num = (s: Sample, key: string) => s.n[key] ?? 0

/** Slider readouts are noisy at the edges; keep display steady. */
function fixed(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '∞'
  // -0.00 is technically correct and always looks like a bug.
  const v = Object.is(value, -0) ? 0 : value
  return v.toFixed(decimals)
}

/** `AmpFrqSin` exposes amplitude as a raw pixel span; map it back to 0.5–2.5. */
function amplitude(s: Sample): number {
  const raw = num(s, 'sliderA')
  const a = 0.5 + ((raw - 24) / 95.8) * 2
  return Math.min(2.5, Math.max(0.5, a))
}

export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'The Right Triangle',
    blurb: 'Where the ratios come from.',
    review: [
      {
        prompt:
          'A right triangle has sides 3, 4 and 5. Standing at the angle opposite the side of length 4, what is sin of that angle?',
        options: ['3/5', '4/5', '3/4', '4/3'],
        answer: 1,
        explain:
          'Sine is opposite over hypotenuse. The opposite side is 4, and the hypotenuse — always the longest — is 5.',
        lesson: 'soh-cah-toa',
      },
      {
        prompt: 'You double the length of every side. What happens to cos θ?',
        options: ['It doubles', 'It halves', 'It does not change', 'It depends on the angle'],
        answer: 2,
        explain:
          'Both sides in the ratio grew by the same factor, so the fraction is untouched. Ratios track shape, not size.',
        lesson: 'ratio',
      },
      {
        prompt: 'Why does tan θ have no value at exactly 90°?',
        options: [
          'The opposite side becomes zero',
          'The adjacent side becomes zero, and nothing divides by zero',
          'The hypotenuse becomes infinite',
          'It does have a value — it is 1',
        ],
        answer: 1,
        explain:
          'tan θ is opposite ÷ adjacent. At 90° the adjacent side has collapsed to nothing, and the division is undefined.',
        lesson: 'soh-cah-toa',
      },
    ],
  },
  {
    id: 2,
    title: 'The Circle',
    blurb: 'Where the triangle stops being enough.',
    review: [
      {
        prompt: 'One radian is the angle you have turned when…',
        options: [
          'you have gone a quarter of the way round',
          'the arc you travelled is as long as the radius',
          'the arc you travelled is as long as the diameter',
          'you have turned exactly 60°',
        ],
        answer: 1,
        explain:
          'That is the whole definition, and it is why a half turn is π radians: a little over three radii laid around the rim.',
        lesson: 'radians',
      },
      {
        prompt: 'At which of these angles is cos θ negative?',
        options: ['30°', '45°', '89°', '120°'],
        answer: 3,
        explain:
          'Past 90° the adjacent side points backwards, so cosine goes negative — a reading a right triangle cannot produce.',
        lesson: 'unit-circle',
      },
      {
        prompt: 'A half turn is how many radians?',
        options: ['π/2', 'π', '2π', '180'],
        answer: 1,
        explain: 'A full turn is 2π, so half of it is π — roughly 3.14 radians.',
        lesson: 'radians',
      },
    ],
  },
  {
    id: 3,
    title: 'The Wave',
    blurb: 'Where trigonometry meets the real world.',
    review: [
      {
        prompt: 'After how much angle does the sine wave repeat exactly?',
        options: ['π/2', 'π', '2π', 'It never repeats'],
        answer: 2,
        explain:
          'One full turn of the circle is one full cycle of the wave. That repeat is what periodic means.',
        lesson: 'sine-wave',
      },
      {
        prompt: 'In y = A·sin(Bθ), what does raising B do?',
        options: [
          'Makes the peaks taller',
          'Squeezes the wave so more cycles fit in the same span',
          'Shifts the wave sideways',
          'Flips the wave upside down',
        ],
        answer: 1,
        explain:
          'A sets the height, B sets how many cycles fit. Louder versus higher-pitched, if the wave is a sound.',
        lesson: 'amplitude-frequency',
      },
      {
        prompt: 'How does the cosine wave differ from the sine wave?',
        options: [
          'It is taller',
          'It repeats twice as often',
          'It is the same wave, shifted a quarter turn',
          'It is upside down',
        ],
        answer: 2,
        explain:
          'Same shape, same period, started a quarter turn early: cos θ = sin(θ + π/2). That offset is a phase shift.',
        lesson: 'cosine-wave',
      },
    ],
  },
  {
    id: 4,
    title: 'Coming Next',
    blurb: 'Planned lessons — artboards still to be authored.',
  },
]

export const lessons: Lesson[] = [
  // ── Chapter 1 ────────────────────────────────────────────────────────────
  {
    id: 'sides',
    artboard: 'Angle',
    stateMachine: SM,
    stage: 'paper',
    bindViewModel: false,
    chapter: 1,
    watchInputs: ['Boolean 1'],
    title: 'Naming the sides',
    tagline: 'Opposite and adjacent are job titles, not names.',
    watch:
      'Under the triangle is a switch — everything on the canvas responds to your finger. Flip it.',
    body: [
      'Every right triangle has one side whose name never changes: the hypotenuse. Always across from the right angle, always the longest.',
      'The other two swap. Which one is opposite and which is adjacent depends entirely on the angle you are standing at.',
      'Flip the focus between angle A and angle B. The triangle never moves — only the labels do.',
    ],
    // `Angle` carries no view model, so these come from the state machine's
    // own boolean instead. Only the focus is live data — the side letters are
    // derived from it, never numbers copied out of the artboard.
    readouts: [
      {
        id: 'focus',
        label: 'Focus',
        tone: 'cyan',
        value: (s) => (s.b['Boolean 1'] ? 'Angle A' : 'Angle B'),
      },
      {
        id: 'opp',
        label: 'Opposite',
        tone: 'amber',
        value: (s) => (s.b['Boolean 1'] ? 'BC' : 'AC'),
      },
      {
        id: 'adj',
        label: 'Adjacent',
        tone: 'mint',
        value: (s) => (s.b['Boolean 1'] ? 'AC' : 'BC'),
      },
      {
        id: 'hyp',
        label: 'Hypotenuse',
        tone: 'violet',
        value: () => 'AB',
      },
    ],
    checkpoint: {
      goal: 'Move the focus onto angle B and watch the two labels trade places.',
      hint: 'The switch sits under the triangle.',
      test: (s) => s.b['Boolean 1'] !== s.b0['Boolean 1'],
    },
  },
  {
    id: 'ratio',
    artboard: 'Ratio',
    stateMachine: SM,
    stage: 'paper',
    bindViewModel: true,
    chapter: 1,
    // "Watch the panel" refers to the ratio readouts — keep them in view.
    detailFirst: true,
    title: 'Shape, not size',
    tagline: 'Blow the triangle up. The ratios refuse to change.',
    watch:
      'Two sliders sit under the triangle: Angle and Scale. Drag either one and watch the panel.',
    body: [
      'Two triangles with the same angles are one shape at two sizes. Mathematicians call them similar.',
      'Similar triangles share their side ratios exactly. That is the hinge the entire subject swings on.',
      'Drag Scale end to end: Opposite, Adjacent and Hypotenuse all move. The three ratios below them do not.',
    ],
    readouts: [
      {
        id: 'theta',
        label: 'Angle',
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'AngleControl'), 1)}°`,
      },
      {
        id: 'scale',
        label: 'Scale',
        tone: 'violet',
        value: (s) => fixed(num(s, 'ScaleControl'), 0),
      },
      // The artboard already prints Opposite, Adjacent and Hypotenuse next to
      // the sides themselves. Repeating them here cost eight tiles, filled the
      // sheet, and squeezed the artwork. Show only the invariant — which is
      // the entire point of the lesson.
      {
        id: 'oh',
        label: 'Opp ÷ Hyp',
        tone: 'rose',
        value: (s) => fixed(num(s, 'OppRatio'), 3),
      },
      {
        id: 'ah',
        label: 'Adj ÷ Hyp',
        tone: 'rose',
        value: (s) => fixed(num(s, 'AdjRatio'), 3),
      },
      {
        id: 'oa',
        label: 'Opp ÷ Adj',
        tone: 'rose',
        value: (s) => fixed(num(s, 'TanRatio'), 3),
      },
    ],
    checkpoint: {
      goal: 'Hold the angle at 60°, then push Scale past 160 — and keep an eye on the three ratios.',
      hint: 'Set the angle first, then the scale. Neither slider disturbs the other.',
      test: (s) =>
        Math.abs(num(s, 'AngleControl') - 60) <= 3 && num(s, 'ScaleControl') >= 160,
    },
  },
  {
    id: 'soh-cah-toa',
    artboard: 'SecretRatios',
    stateMachine: SM,
    stage: 'paper',
    bindViewModel: true,
    chapter: 1,
    title: 'SOH CAH TOA',
    tagline: 'Three ratios, three names. That is the whole vocabulary.',
    watch:
      'One slider under the circle sets the angle. Drag it and watch all three ratios at once.',
    body: [
      'Shrink the hypotenuse to exactly 1 and the ratios stop being fractions — they become the sides themselves.',
      'sin θ is the opposite side. cos θ is the adjacent side. tan θ is one divided by the other.',
      'Sweep from 0° to 90° and watch sine climb while cosine falls. At the very end tangent gives up entirely.',
    ],
    readouts: [
      {
        id: 'theta',
        label: 'Angle',
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'AngleControl'), 1)}°`,
      },
      {
        id: 'sin',
        label: 'sin θ',
        tone: 'blue',
        value: (s) => fixed(num(s, 'OppSR'), 3),
      },
      {
        id: 'cos',
        label: 'cos θ',
        tone: 'amber',
        value: (s) => fixed(num(s, 'AdjSR'), 3),
      },
      {
        id: 'tan',
        label: 'tan θ',
        tone: 'rose',
        value: (s) => {
          const cos = num(s, 'AdjSR')
          if (Math.abs(cos) < 1e-4) return '∞'
          return fixed(num(s, 'OppSR') / cos, 3)
        },
      },
    ],
    checkpoint: {
      // The artboard opens at 45°, where sine and cosine already match — so
      // "find where they are equal" would award itself. Aim somewhere else.
      goal: 'Bring the angle down until sin θ reads 0.50.',
      hint: 'Sine hits exactly one half at a famous angle: 30°.',
      test: (s) => Math.abs(num(s, 'OppSR') - 0.5) < 0.025,
    },
  },

  // ── Chapter 2 ────────────────────────────────────────────────────────────
  {
    id: 'radians',
    artboard: 'RadDeg',
    stateMachine: SM,
    stage: 'paper',
    bindViewModel: true,
    chapter: 2,
    // The checkpoint asks for "the radian readout" — it must be visible.
    detailFirst: true,
    title: 'Radians',
    tagline: 'A degree is a convention. A radian is a measurement.',
    watch:
      'Drag the slider at the bottom. Both dials turn together — one counts degrees, one counts radii.',
    body: [
      '360 is a number inherited from Babylonian astronomers. Nothing about a circle requires it.',
      'A radian is honest: it is the angle you have turned when the arc you walked is exactly as long as the radius.',
      'So a half turn is π radians — a little over three radii laid around the rim.',
    ],
    readouts: [
      {
        id: 'deg',
        label: 'Degrees',
        tone: 'amber',
        value: (s) => `${fixed(num(s, 'Angle'), 1)}°`,
      },
      {
        id: 'rad',
        label: 'Radians',
        tone: 'cyan',
        value: (s) => fixed(num(s, 'Angle') / DEG, 3),
      },
      {
        id: 'pi',
        label: 'In terms of π',
        tone: 'violet',
        value: (s) => `${fixed(num(s, 'Angle') / 180, 3)} π`,
      },
    ],
    checkpoint: {
      goal: 'Set the angle to exactly one radian.',
      hint: 'Watch the radian readout, not the degrees. It lands near 57°.',
      test: (s) => Math.abs(num(s, 'Angle') / DEG - 1) < 0.05,
    },
  },
  {
    id: 'unit-circle',
    artboard: 'UnitCircle',
    stateMachine: SM,
    stage: 'navy',
    bindViewModel: true,
    chapter: 2,
    // "Watch Opp and Adj" and the checkpoint's "Adj readout" live in the panel.
    detailFirst: true,
    title: 'The unit circle',
    tagline: 'Trigonometry escapes the triangle.',
    watch:
      'Press Spin it below, then watch Opp and Adj as the arm goes all the way round.',
    body: [
      'Set the hypotenuse to 1 and pin it at the origin. Now the angle can keep going — past 90°, past 180°, past a full turn.',
      "The handle's height above the axis is sin θ. Its distance along the axis is cos θ. Always.",
      'Past 90° the adjacent side points backwards and cos θ turns negative — a reading no right triangle can produce. That is the moment a triangle rule becomes a function you can feed any number at all.',
    ],
    readouts: [
      {
        id: 'opp',
        label: 'Opp — sin θ',
        tone: 'amber',
        value: (s) => fixed(num(s, 'opp'), 2),
      },
      {
        id: 'adj',
        label: 'Adj — cos θ',
        tone: 'mint',
        value: (s) => fixed(num(s, 'adj'), 2),
      },
      {
        id: 'hyp',
        label: 'Hyp',
        tone: 'blue',
        value: () => '1.00',
      },
    ],
    actions: [
      { input: 'start', kind: 'trigger', label: 'Spin it', tone: 'primary' },
      { input: 'reset', kind: 'trigger', label: 'Reset', tone: 'ghost' },
    ],
    checkpoint: {
      goal: 'Spin the circle and catch cos θ going negative — a reading no right triangle can produce.',
      hint: 'Press Spin it and watch the Adj readout once the arm passes the top of the circle.',
      test: (s) => num(s, 'adj') < -0.5,
    },
  },

  // ── Chapter 3 ────────────────────────────────────────────────────────────
  {
    id: 'sine-wave',
    artboard: 'CircletoSin',
    stateMachine: SM,
    stage: 'deep',
    bindViewModel: true,
    chapter: 3,
    title: 'Unrolling the sine',
    tagline: 'A wave is a circle, walked in a straight line.',
    watch:
      'Drag the slider along the bottom to unroll the circle into the wave.',
    body: [
      'Keep the angle turning, and plot the height of the handle against the angle itself.',
      "The circle's vertical position, stretched out along an axis, is the sine wave. There is nothing more mysterious in it than that.",
      'Sweep past π and the wave crosses zero on the way down. Past 2π the whole thing repeats — that repeat is what periodic means.',
    ],
    readouts: [
      {
        id: 'deg',
        label: 'Angle',
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'angle'), 0)}°`,
      },
      {
        id: 'rad',
        label: 'Radians',
        tone: 'violet',
        value: (s) => fixed(num(s, 'radian'), 2),
      },
      {
        id: 'sin',
        label: 'sin θ',
        tone: 'blue',
        value: (s) => fixed(Math.sin(num(s, 'radian')), 3),
      },
    ],
    checkpoint: {
      goal: 'Sweep past a full turn — 2π — and watch the wave start over, identical.',
      hint: 'Drag the slider knob to roughly halfway; the axis is marked in multiples of π.',
      test: (s) => num(s, 'radian') >= 2 * Math.PI,
    },
  },
  {
    id: 'cosine-wave',
    artboard: 'CircletoCos',
    stateMachine: SM,
    stage: 'deep',
    bindViewModel: true,
    chapter: 3,
    title: 'Cosine, one quarter early',
    tagline: 'Cosine is sine with a head start.',
    watch:
      'The same slider as before — but now it plots the horizontal position instead of the vertical.',
    body: [
      'Plot the horizontal position instead of the vertical one and the cosine wave falls out.',
      'Same shape, same period. It simply starts at 1 instead of 0.',
      'That quarter-turn offset has a name: a phase shift. cos θ = sin(θ + π/2).',
    ],
    readouts: [
      {
        id: 'deg',
        label: 'Angle',
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'angle'), 0)}°`,
      },
      {
        id: 'rad',
        label: 'Radians',
        tone: 'violet',
        value: (s) => fixed(num(s, 'radian'), 2),
      },
      {
        id: 'cos',
        label: 'cos θ',
        tone: 'amber',
        value: (s) => fixed(Math.cos(num(s, 'radian')), 3),
      },
    ],
    checkpoint: {
      goal: 'Sweep a half turn, until cos θ bottoms out near −1.',
      hint: 'Half a turn is π — the first mark on the axis.',
      test: (s) => Math.cos(num(s, 'radian')) < -0.9,
    },
  },
  {
    id: 'tangent',
    artboard: 'CircletoTan',
    stateMachine: SM,
    stage: 'deep',
    bindViewModel: true,
    chapter: 3,
    title: 'Tangent and its walls',
    tagline: 'The ratio that runs off the page.',
    watch:
      'Drag slowly through the first quarter turn. The interesting part is only a degree wide.',
    body: [
      'Tangent is sine over cosine — height divided by width.',
      'As the angle nears 90°, the width collapses toward zero while the height holds near 1. Dividing by almost nothing gives almost everything.',
      'The wall the curve never touches is called an asymptote. Tangent has one every half turn, forever.',
    ],
    readouts: [
      {
        id: 'deg',
        label: 'Angle',
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'angle'), 0)}°`,
      },
      {
        id: 'rad',
        label: 'Radians',
        tone: 'violet',
        value: (s) => fixed(num(s, 'radian'), 2),
      },
      {
        id: 'tan',
        label: 'tan θ',
        tone: 'rose',
        value: (s) => {
          const t = Math.tan(num(s, 'radian'))
          if (!Number.isFinite(t) || Math.abs(t) > 999) return '∞'
          return fixed(t, 2)
        },
      },
    ],
    checkpoint: {
      goal: 'Sweep straight through 90° and watch tangent blow up, flip sign, and climb back.',
      hint: 'Drag slowly through the first quarter turn — the interesting part is one degree wide.',
      test: (s) => num(s, 'radian') > Math.PI / 2 + 0.15,
    },
  },
  {
    id: 'amplitude-frequency',
    artboard: 'AmpFrqSin',
    stateMachine: SM,
    stage: 'navy',
    bindViewModel: true,
    chapter: 3,
    title: 'Amplitude and frequency',
    tagline: 'Two dials turn one wave into every wave.',
    watch:
      'A slider for amplitude, three buttons for frequency. Try them in any order.',
    body: [
      'y = A·sin(Bθ). A stretches the wave vertically; B squeezes it horizontally.',
      'Amplitude is how loud. Frequency is how high the note. For sound, that is not a metaphor.',
      'Change A and the peaks move. Change B and the peaks multiply. The shape never stops being a sine.',
    ],
    readouts: [
      {
        id: 'amp',
        label: 'Amplitude — A',
        tone: 'amber',
        value: (s) => fixed(amplitude(s), 2),
      },
      {
        id: 'frq',
        label: 'Frequency — B',
        tone: 'cyan',
        value: (s) => fixed(num(s, 'frqNum'), 0),
      },
    ],
    actions: [{ input: 'start', kind: 'bool', label: 'Animate', tone: 'primary' }],
    checkpoint: {
      goal: 'Push the amplitude to its maximum and set the frequency to 3.',
      hint: 'Amplitude is the slider; frequency is the row of buttons.',
      test: (s) => amplitude(s) > 2.35 && num(s, 'frqNum') >= 3,
    },
  },
  {
    id: 'the-swing',
    artboard: 'TheSwing',
    stateMachine: SM,
    stage: 'navy',
    bindViewModel: true,
    chapter: 3,
    title: 'Where the wave shows up',
    tagline: 'A pendulum knows no trigonometry. It obeys it anyway.',
    watch:
      'Press Release it below and follow the weight as it traces its path.',
    body: [
      'Release the weight and track its horizontal position over time.',
      'The trace is a sine wave. So is a plucked string, an alternating current, a tide, and the brightness of one pixel in a radio signal.',
      'You did not learn a rule about triangles. You learned the shape of anything that repeats.',
    ],
    readouts: [
      {
        id: 'theta',
        label: 'Angle',
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'AngleControl'), 1)}°`,
      },
      {
        id: 's',
        label: 'Displacement',
        tone: 'amber',
        value: (s) => fixed(num(s, 'OppSR'), 2),
      },
    ],
    actions: [
      {
        input: 'start',
        kind: 'trigger',
        label: 'Release it',
        tone: 'primary',
        completes: true,
      },
    ],
  },
]

/**
 * Slots 11–15. Titles are provisional: rename them freely, and promote one
 * into `lessons` as soon as its artboard lands.
 */
export const upcoming: UpcomingLesson[] = [
  {
    id: 'phase',
    chapter: 4,
    title: 'Phase shift',
    tagline: 'Sliding a wave sideways without changing it.',
    note: 'y = A·sin(Bθ + C) — the third dial, and why two identical waves can cancel each other out.',
  },
  {
    id: 'identity',
    chapter: 4,
    title: 'The Pythagorean identity',
    tagline: 'sin²θ + cos²θ = 1, and why it cannot be otherwise.',
    note: 'The unit circle has radius 1. Pythagoras does the rest — no memorisation required.',
  },
  {
    id: 'inverse',
    chapter: 4,
    title: 'Going backwards',
    tagline: 'You know the ratio. What was the angle?',
    note: 'arcsin, arccos and arctan — and why a calculator has to pick just one of infinitely many answers.',
  },
  {
    id: 'solving',
    chapter: 4,
    title: 'Measuring the unreachable',
    tagline: 'One angle and one distance is enough for a tower.',
    note: 'Solving right triangles in the field: heights, slopes, and how surveyors actually work.',
  },
  {
    id: 'signals',
    chapter: 4,
    title: 'Everything is waves',
    tagline: 'Stack enough sines and you can draw anything.',
    note: 'A first look at Fourier: sound, light and every signal as a sum of the waves you already know.',
  },
]

/** Every slot in the course, ready or not — used for numbering and counts. */
export const TOTAL_LESSONS = lessons.length + upcoming.length

export const lessonById = (id: string): Lesson | undefined =>
  lessons.find((l) => l.id === id)

export const upcomingById = (id: string): UpcomingLesson | undefined =>
  upcoming.find((l) => l.id === id)

export const chapterById = (id: number): Chapter | undefined =>
  chapters.find((c) => c.id === id)

/** Progress-store key for a chapter review. */
export const reviewKey = (chapter: number) => `review-${chapter}`

/**
 * Where "next" goes from a lesson: the following lesson, or the chapter
 * review if this was the last lesson of a chapter that has one.
 */
export function nextStop(
  lessonId: string,
): { kind: 'lesson'; id: string } | { kind: 'review'; chapter: number } | null {
  const i = lessons.findIndex((l) => l.id === lessonId)
  if (i < 0) return null
  const current = lessons[i]
  const next = lessons[i + 1]
  const endOfChapter = !next || next.chapter !== current.chapter
  if (endOfChapter && chapterById(current.chapter)?.review?.length) {
    return { kind: 'review', chapter: current.chapter }
  }
  return next ? { kind: 'lesson', id: next.id } : null
}

/** The first lesson of the chapter after this one, if any. */
export function lessonAfterReview(chapter: number): string | null {
  const next = lessons.find((l) => l.chapter > chapter)
  return next ? next.id : null
}

/** 1-based position in the full 15-slot course. */
export function slotNumber(id: string): number {
  const ready = lessons.findIndex((l) => l.id === id)
  if (ready >= 0) return ready + 1
  const soon = upcoming.findIndex((l) => l.id === id)
  return soon >= 0 ? lessons.length + soon + 1 : 0
}
