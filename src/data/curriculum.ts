import type { Localized } from '../lib/i18n'

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
  label: Localized
  tone: Tone
  value: (s: Sample) => string
}

export interface Checkpoint {
  goal: Localized
  hint: Localized
  test: (s: Sample) => boolean
}

export interface LessonAction {
  /** State-machine input name. */
  input: string
  kind: 'trigger' | 'bool'
  label: Localized
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
  title: Localized
  tagline: Localized
  body: Localized[]
  readouts: Readout[]
  actions?: LessonAction[]
  checkpoint?: Checkpoint
  /** Boolean state-machine inputs to mirror into `Sample.b`. */
  watchInputs?: string[]
}

export interface Chapter {
  id: number
  title: Localized
  blurb: Localized
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
    title: { en: 'The Right Triangle', fa: 'مثلث قائم‌الزاویه' },
    blurb: {
      en: 'Where the ratios come from.',
      fa: 'نسبت‌ها از کجا می‌آیند.',
    },
  },
  {
    id: 2,
    title: { en: 'The Circle', fa: 'دایره' },
    blurb: {
      en: 'Where the triangle stops being enough.',
      fa: 'جایی که مثلث دیگر کافی نیست.',
    },
  },
  {
    id: 3,
    title: { en: 'The Wave', fa: 'موج' },
    blurb: {
      en: 'Where trigonometry meets the real world.',
      fa: 'جایی که مثلثات به دنیای واقعی می‌رسد.',
    },
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
    title: { en: 'Naming the sides', fa: 'نام‌گذاری ضلع‌ها' },
    tagline: {
      en: 'Opposite and adjacent are job titles, not names.',
      fa: 'روبه‌رو و مجاور، عنوانِ نقش‌اند، نه نامِ ضلع.',
    },
    body: [
      {
        en: 'Every right triangle has one side whose name never changes: the hypotenuse. Always across from the right angle, always the longest.',
        fa: 'هر مثلث قائم‌الزاویه یک ضلع دارد که نامش هرگز عوض نمی‌شود: وتر. همیشه روبه‌روی زاویهٔ قائمه و همیشه بلندترین ضلع.',
      },
      {
        en: 'The other two swap. Which one is opposite and which is adjacent depends entirely on the angle you are standing at.',
        fa: 'دو ضلع دیگر جای‌شان را با هم عوض می‌کنند. اینکه کدام روبه‌رو است و کدام مجاور، فقط به زاویه‌ای بستگی دارد که از آن نگاه می‌کنید.',
      },
      {
        en: 'Flip the focus between angle A and angle B. The triangle never moves — only the labels do.',
        fa: 'تمرکز را بین زاویهٔ A و B جابه‌جا کنید. مثلث تکان نمی‌خورد؛ فقط برچسب‌ها عوض می‌شوند.',
      },
    ],
    readouts: [],
    checkpoint: {
      goal: {
        en: 'Move the focus onto angle B and watch the two labels trade places.',
        fa: 'تمرکز را روی زاویهٔ B ببرید و جابه‌جا شدن دو برچسب را ببینید.',
      },
      hint: {
        en: 'The switch sits under the triangle.',
        fa: 'کلید، زیر مثلث است.',
      },
      test: (s) => s.b['Boolean 1'] !== s.b0['Boolean 1'],
    },
  },
  {
    id: 'ratio',
    artboard: 'Ratio',
    stateMachine: SM,
    stage: 'navy',
    bindViewModel: true,
    chapter: 1,
    title: { en: 'Shape, not size', fa: 'شکل، نه اندازه' },
    tagline: {
      en: 'Blow the triangle up. The ratios refuse to change.',
      fa: 'مثلث را بزرگ کنید؛ نسبت‌ها زیر بار نمی‌روند.',
    },
    body: [
      {
        en: 'Two triangles with the same angles are one shape at two sizes. Mathematicians call them similar.',
        fa: 'دو مثلث با زاویه‌های یکسان، یک شکل‌اند در دو اندازه. به آن‌ها متشابه می‌گویند.',
      },
      {
        en: 'Similar triangles share their side ratios exactly. That is the hinge the entire subject swings on.',
        fa: 'مثلث‌های متشابه دقیقاً نسبت ضلع‌های یکسانی دارند. تمام این درس روی همین لولا می‌چرخد.',
      },
      {
        en: 'Drag Scale end to end: Opposite, Adjacent and Hypotenuse all move. The three ratios below them do not.',
        fa: 'اسلایدر مقیاس را از این سر به آن سر ببرید: روبه‌رو، مجاور و وتر هر سه تغییر می‌کنند؛ سه نسبتِ زیرشان هیچ تکانی نمی‌خورند.',
      },
    ],
    readouts: [
      {
        id: 'theta',
        label: { en: 'Angle', fa: 'زاویه' },
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'AngleControl'), 1)}°`,
      },
      {
        id: 'scale',
        label: { en: 'Scale', fa: 'مقیاس' },
        tone: 'violet',
        value: (s) => fixed(num(s, 'ScaleControl'), 0),
      },
      {
        id: 'opp',
        label: { en: 'Opposite', fa: 'روبه‌رو' },
        tone: 'amber',
        value: (s) => fixed(num(s, 'Opp'), 2),
      },
      {
        id: 'adj',
        label: { en: 'Adjacent', fa: 'مجاور' },
        tone: 'mint',
        value: (s) => fixed(num(s, 'Adj'), 2),
      },
      {
        id: 'hyp',
        label: { en: 'Hypotenuse', fa: 'وتر' },
        tone: 'blue',
        value: (s) => fixed(num(s, 'Hyp'), 2),
      },
      {
        id: 'oh',
        label: { en: 'Opp ÷ Hyp', fa: 'روبه‌رو ÷ وتر' },
        tone: 'rose',
        value: (s) => fixed(num(s, 'OppRatio'), 3),
      },
      {
        id: 'ah',
        label: { en: 'Adj ÷ Hyp', fa: 'مجاور ÷ وتر' },
        tone: 'rose',
        value: (s) => fixed(num(s, 'AdjRatio'), 3),
      },
      {
        id: 'oa',
        label: { en: 'Opp ÷ Adj', fa: 'روبه‌رو ÷ مجاور' },
        tone: 'rose',
        value: (s) => fixed(num(s, 'TanRatio'), 3),
      },
    ],
    checkpoint: {
      goal: {
        en: 'Hold the angle at 60°, then push Scale past 160 — and keep an eye on the three ratios.',
        fa: 'زاویه را روی 60° نگه دارید و بعد مقیاس را از 160 بالاتر ببرید — و حواستان به سه نسبت باشد.',
      },
      hint: {
        en: 'Set the angle first, then the scale. Neither slider disturbs the other.',
        fa: 'اول زاویه، بعد مقیاس. هیچ‌کدام روی دیگری اثر نمی‌گذارد.',
      },
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
    title: { en: 'SOH CAH TOA', fa: 'SOH CAH TOA' },
    tagline: {
      en: 'Three ratios, three names. That is the whole vocabulary.',
      fa: 'سه نسبت، سه نام. کل واژگان همین است.',
    },
    body: [
      {
        en: 'Shrink the hypotenuse to exactly 1 and the ratios stop being fractions — they become the sides themselves.',
        fa: 'وتر را دقیقاً برابر 1 کنید؛ آنگاه نسبت‌ها دیگر کسر نیستند و خودِ ضلع‌ها می‌شوند.',
      },
      {
        en: 'sin θ is the opposite side. cos θ is the adjacent side. tan θ is one divided by the other.',
        fa: 'sin θ همان ضلع روبه‌رو است، cos θ همان مجاور، و tan θ حاصل تقسیم این دو بر هم.',
      },
      {
        en: 'Sweep from 0° to 90° and watch sine climb while cosine falls. At the very end tangent gives up entirely.',
        fa: 'زاویه را از 0 تا 90 درجه بکشید و ببینید سینوس بالا می‌رود و کسینوس پایین می‌آید. در انتها تانژانت کاملاً از کار می‌افتد.',
      },
    ],
    readouts: [
      {
        id: 'theta',
        label: { en: 'Angle', fa: 'زاویه' },
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'AngleControl'), 1)}°`,
      },
      {
        id: 'sin',
        label: { en: 'sin θ', fa: 'sin θ' },
        tone: 'blue',
        value: (s) => fixed(num(s, 'OppSR'), 3),
      },
      {
        id: 'cos',
        label: { en: 'cos θ', fa: 'cos θ' },
        tone: 'amber',
        value: (s) => fixed(num(s, 'AdjSR'), 3),
      },
      {
        id: 'tan',
        label: { en: 'tan θ', fa: 'tan θ' },
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
      goal: {
        en: 'Bring the angle down until sin θ reads 0.50.',
        fa: 'زاویه را پایین بیاورید تا sin θ روی 0.50 بایستد.',
      },
      hint: {
        en: 'Sine hits exactly one half at a famous angle: 30°.',
        fa: 'سینوس دقیقاً در یک زاویهٔ مشهور به یک‌دوم می‌رسد: 30 درجه.',
      },
      test: (s) => Math.abs(num(s, 'OppSR') - 0.5) < 0.025,
    },
  },

  // ── Chapter 2 ────────────────────────────────────────────────────────────
  {
    id: 'radians',
    artboard: 'RadDeg',
    stateMachine: SM,
    stage: 'navy',
    bindViewModel: true,
    chapter: 2,
    title: { en: 'Radians', fa: 'رادیان' },
    tagline: {
      en: 'A degree is a convention. A radian is a measurement.',
      fa: 'درجه یک قرارداد است؛ رادیان یک اندازه‌گیری.',
    },
    body: [
      {
        en: '360 is a number inherited from Babylonian astronomers. Nothing about a circle requires it.',
        fa: 'عدد 360 میراث ستاره‌شناسان بابلی است. هیچ‌چیزِ دایره آن را لازم ندارد.',
      },
      {
        en: 'A radian is honest: it is the angle you have turned when the arc you walked is exactly as long as the radius.',
        fa: 'رادیان صادق است: زاویه‌ای که در آن، کمانی که پیموده‌اید دقیقاً به بلندی شعاع باشد.',
      },
      {
        en: 'So a half turn is π radians — a little over three radii laid around the rim.',
        fa: 'پس نیم‌دور می‌شود π رادیان؛ کمی بیش از سه شعاع که دور لبه چیده شده‌اند.',
      },
    ],
    readouts: [
      {
        id: 'deg',
        label: { en: 'Degrees', fa: 'درجه' },
        tone: 'amber',
        value: (s) => `${fixed(num(s, 'Angle'), 1)}°`,
      },
      {
        id: 'rad',
        label: { en: 'Radians', fa: 'رادیان' },
        tone: 'cyan',
        value: (s) => fixed(num(s, 'Angle') / DEG, 3),
      },
      {
        id: 'pi',
        label: { en: 'In terms of π', fa: 'بر حسب π' },
        tone: 'violet',
        value: (s) => `${fixed(num(s, 'Angle') / 180, 3)} π`,
      },
    ],
    checkpoint: {
      goal: {
        en: 'Set the angle to exactly one radian.',
        fa: 'زاویه را دقیقاً روی یک رادیان تنظیم کنید.',
      },
      hint: {
        en: 'Watch the radian readout, not the degrees. It lands near 57°.',
        fa: 'به عدد رادیان نگاه کنید، نه درجه. نزدیک 57 درجه می‌افتد.',
      },
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
    title: { en: 'The unit circle', fa: 'دایرهٔ واحد' },
    tagline: {
      en: 'Trigonometry escapes the triangle.',
      fa: 'مثلثات از مثلث بیرون می‌زند.',
    },
    body: [
      {
        en: 'Set the hypotenuse to 1 and pin it at the origin. Now the angle can keep going — past 90°, past 180°, past a full turn.',
        fa: 'وتر را برابر 1 بگذارید و آن را به مبدأ سنجاق کنید. حالا زاویه می‌تواند ادامه دهد — از 90 درجه، از 180 درجه، از یک دور کامل.',
      },
      {
        en: "The handle's height above the axis is sin θ. Its distance along the axis is cos θ. Always.",
        fa: 'ارتفاع دستگیره از محور، sin θ است و فاصله‌اش روی محور، cos θ. همیشه.',
      },
      {
        en: 'Past 90° the adjacent side points backwards and cos θ turns negative — a reading no right triangle can produce. That is the moment a triangle rule becomes a function you can feed any number at all.',
        fa: 'بعد از 90 درجه، ضلع مجاور به عقب برمی‌گردد و cos θ منفی می‌شود — عددی که هیچ مثلث قائم‌الزاویه‌ای نمی‌تواند بسازد. همین‌جاست که یک قاعدهٔ مثلثاتی به تابعی تبدیل می‌شود که هر عددی را می‌پذیرد.',
      },
    ],
    readouts: [
      {
        id: 'opp',
        label: { en: 'Opp — sin θ', fa: 'روبه‌رو — sin θ' },
        tone: 'amber',
        value: (s) => fixed(num(s, 'opp'), 2),
      },
      {
        id: 'adj',
        label: { en: 'Adj — cos θ', fa: 'مجاور — cos θ' },
        tone: 'mint',
        value: (s) => fixed(num(s, 'adj'), 2),
      },
      {
        id: 'hyp',
        label: { en: 'Hyp', fa: 'وتر' },
        tone: 'blue',
        value: () => '1.00',
      },
    ],
    actions: [
      {
        input: 'start',
        kind: 'trigger',
        label: { en: 'Spin it', fa: 'بچرخان' },
        tone: 'primary',
      },
      {
        input: 'reset',
        kind: 'trigger',
        label: { en: 'Reset', fa: 'از نو' },
        tone: 'ghost',
      },
    ],
    checkpoint: {
      goal: {
        en: 'Spin the circle and catch cos θ going negative — a reading no right triangle can produce.',
        fa: 'دایره را بچرخانید و لحظه‌ای را بگیرید که cos θ منفی می‌شود — عددی که هیچ مثلث قائم‌الزاویه‌ای نمی‌سازد.',
      },
      hint: {
        en: 'Press Spin it and watch the Adj readout once the arm passes the top of the circle.',
        fa: 'دکمهٔ بچرخان را بزنید و وقتی بازو از بالای دایره گذشت، عدد مجاور را تماشا کنید.',
      },
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
    title: { en: 'Unrolling the sine', fa: 'باز کردن سینوس' },
    tagline: {
      en: 'A wave is a circle, walked in a straight line.',
      fa: 'موج، همان دایره است که در خط راست راه رفته باشد.',
    },
    body: [
      {
        en: 'Keep the angle turning, and plot the height of the handle against the angle itself.',
        fa: 'زاویه را بچرخانید و ارتفاع دستگیره را در برابر خودِ زاویه رسم کنید.',
      },
      {
        en: "The circle's vertical position, stretched out along an axis, is the sine wave. There is nothing more mysterious in it than that.",
        fa: 'موقعیت عمودی دایره، وقتی روی یک محور کشیده شود، همان موج سینوسی است. رمز و رازی بیشتر از این در کار نیست.',
      },
      {
        en: 'Sweep past π and the wave crosses zero on the way down. Past 2π the whole thing repeats — that repeat is what periodic means.',
        fa: 'از π که بگذرید، موج رو به پایین از صفر رد می‌شود. از 2π که بگذرید، همه‌چیز تکرار می‌شود — معنی متناوب همین است.',
      },
    ],
    readouts: [
      {
        id: 'deg',
        label: { en: 'Angle', fa: 'زاویه' },
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'angle'), 0)}°`,
      },
      {
        id: 'rad',
        label: { en: 'Radians', fa: 'رادیان' },
        tone: 'violet',
        value: (s) => fixed(num(s, 'radian'), 2),
      },
      {
        id: 'sin',
        label: { en: 'sin θ', fa: 'sin θ' },
        tone: 'blue',
        value: (s) => fixed(Math.sin(num(s, 'radian')), 3),
      },
    ],
    checkpoint: {
      goal: {
        en: 'Sweep past a full turn — 2π — and watch the wave start over, identical.',
        fa: 'از یک دور کامل — 2π — بگذرید و ببینید موج، عیناً از نو شروع می‌شود.',
      },
      hint: {
        en: 'Drag the slider knob to roughly halfway; the axis is marked in multiples of π.',
        fa: 'دستگیرهٔ اسلایدر را تا حدود نیمه بکشید؛ محور بر حسب مضرب‌های π نشانه‌گذاری شده است.',
      },
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
    title: { en: 'Cosine, one quarter early', fa: 'کسینوس، یک‌چهارم جلوتر' },
    tagline: {
      en: 'Cosine is sine with a head start.',
      fa: 'کسینوس همان سینوس است، با یک سر و گردن جلوتر.',
    },
    body: [
      {
        en: 'Plot the horizontal position instead of the vertical one and the cosine wave falls out.',
        fa: 'به‌جای موقعیت عمودی، موقعیت افقی را رسم کنید؛ موج کسینوسی به دست می‌آید.',
      },
      {
        en: 'Same shape, same period. It simply starts at 1 instead of 0.',
        fa: 'همان شکل، همان دورهٔ تناوب. فقط به‌جای 0 از 1 شروع می‌کند.',
      },
      {
        en: 'That quarter-turn offset has a name: a phase shift. cos θ = sin(θ + π/2).',
        fa: 'این اختلافِ یک‌چهارم دور اسم دارد: اختلاف فاز. cos θ = sin(θ + π/2).',
      },
    ],
    readouts: [
      {
        id: 'deg',
        label: { en: 'Angle', fa: 'زاویه' },
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'angle'), 0)}°`,
      },
      {
        id: 'rad',
        label: { en: 'Radians', fa: 'رادیان' },
        tone: 'violet',
        value: (s) => fixed(num(s, 'radian'), 2),
      },
      {
        id: 'cos',
        label: { en: 'cos θ', fa: 'cos θ' },
        tone: 'amber',
        value: (s) => fixed(Math.cos(num(s, 'radian')), 3),
      },
    ],
    checkpoint: {
      goal: {
        en: 'Sweep a half turn, until cos θ bottoms out near −1.',
        fa: 'یک نیم‌دور پیش بروید، تا cos θ نزدیک −1 به کف برسد.',
      },
      hint: {
        en: 'Half a turn is π — the first mark on the axis.',
        fa: 'نیم‌دور یعنی π — اولین نشانه روی محور.',
      },
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
    title: { en: 'Tangent and its walls', fa: 'تانژانت و دیوارهایش' },
    tagline: {
      en: 'The ratio that runs off the page.',
      fa: 'نسبتی که از صفحه بیرون می‌زند.',
    },
    body: [
      {
        en: 'Tangent is sine over cosine — height divided by width.',
        fa: 'تانژانت یعنی سینوس تقسیم بر کسینوس؛ ارتفاع تقسیم بر عرض.',
      },
      {
        en: 'As the angle nears 90°, the width collapses toward zero while the height holds near 1. Dividing by almost nothing gives almost everything.',
        fa: 'هرچه زاویه به 90 درجه نزدیک می‌شود، عرض به صفر می‌رود و ارتفاع نزدیک 1 می‌ماند. تقسیم بر تقریباً هیچ، تقریباً همه‌چیز می‌دهد.',
      },
      {
        en: 'The wall the curve never touches is called an asymptote. Tangent has one every half turn, forever.',
        fa: 'دیواری که منحنی هرگز به آن نمی‌رسد، مجانب نام دارد. تانژانت هر نیم‌دور یکی از آن‌ها دارد، تا بی‌نهایت.',
      },
    ],
    readouts: [
      {
        id: 'deg',
        label: { en: 'Angle', fa: 'زاویه' },
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'angle'), 0)}°`,
      },
      {
        id: 'rad',
        label: { en: 'Radians', fa: 'رادیان' },
        tone: 'violet',
        value: (s) => fixed(num(s, 'radian'), 2),
      },
      {
        id: 'tan',
        label: { en: 'tan θ', fa: 'tan θ' },
        tone: 'rose',
        value: (s) => {
          const t = Math.tan(num(s, 'radian'))
          if (!Number.isFinite(t) || Math.abs(t) > 999) return '∞'
          return fixed(t, 2)
        },
      },
    ],
    checkpoint: {
      goal: {
        en: 'Sweep straight through 90° and watch tangent blow up, flip sign, and climb back.',
        fa: 'مستقیم از 90 درجه رد شوید و ببینید تانژانت منفجر می‌شود، علامتش عوض می‌شود و دوباره بالا می‌آید.',
      },
      hint: {
        en: 'Drag slowly through the first quarter turn — the interesting part is one degree wide.',
        fa: 'آرام از یک‌چهارم دورِ اول عبور کنید — بخش جذاب ماجرا یک درجه پهنا دارد.',
      },
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
    title: { en: 'Amplitude and frequency', fa: 'دامنه و بسامد' },
    tagline: {
      en: 'Two dials turn one wave into every wave.',
      fa: 'دو درجه‌بندی، یک موج را به همهٔ موج‌ها تبدیل می‌کند.',
    },
    body: [
      {
        en: 'y = A·sin(Bθ). A stretches the wave vertically; B squeezes it horizontally.',
        fa: 'y = A·sin(Bθ). حرف A موج را در ارتفاع می‌کشد و B آن را در طول فشرده می‌کند.',
      },
      {
        en: 'Amplitude is how loud. Frequency is how high the note. For sound, that is not a metaphor.',
        fa: 'دامنه یعنی چقدر بلند، بسامد یعنی چقدر زیر. دربارهٔ صدا، این اصلاً استعاره نیست.',
      },
      {
        en: 'Change A and the peaks move. Change B and the peaks multiply. The shape never stops being a sine.',
        fa: 'A را عوض کنید، قله‌ها جابه‌جا می‌شوند؛ B را عوض کنید، قله‌ها زیاد می‌شوند. اما شکل، هرگز از سینوس بودن دست نمی‌کشد.',
      },
    ],
    readouts: [
      {
        id: 'amp',
        label: { en: 'Amplitude — A', fa: 'دامنه — A' },
        tone: 'amber',
        value: (s) => fixed(amplitude(s), 2),
      },
      {
        id: 'frq',
        label: { en: 'Frequency — B', fa: 'بسامد — B' },
        tone: 'cyan',
        value: (s) => fixed(num(s, 'frqNum'), 0),
      },
    ],
    actions: [
      {
        input: 'start',
        kind: 'bool',
        label: { en: 'Animate', fa: 'پخش' },
        tone: 'primary',
      },
    ],
    checkpoint: {
      goal: {
        en: 'Push the amplitude to its maximum and set the frequency to 3.',
        fa: 'دامنه را تا بیشترین مقدار ببرید و بسامد را روی 3 بگذارید.',
      },
      hint: {
        en: 'Amplitude is the slider; frequency is the row of buttons.',
        fa: 'دامنه با اسلایدر، بسامد با ردیف دکمه‌ها.',
      },
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
    title: { en: 'Where the wave shows up', fa: 'موج کجا پیدایش می‌شود' },
    tagline: {
      en: 'A pendulum knows no trigonometry. It obeys it anyway.',
      fa: 'آونگ چیزی از مثلثات نمی‌داند، اما از آن پیروی می‌کند.',
    },
    body: [
      {
        en: 'Release the weight and track its horizontal position over time.',
        fa: 'وزنه را رها کنید و موقعیت افقی‌اش را در گذر زمان دنبال کنید.',
      },
      {
        en: 'The trace is a sine wave. So is a plucked string, an alternating current, a tide, and the brightness of one pixel in a radio signal.',
        fa: 'رد آن یک موج سینوسی است. سیم زخمه‌خورده، جریان متناوب، جزر و مد، و روشنایی یک نقطه در سیگنال رادیویی هم همین‌اند.',
      },
      {
        en: 'You did not learn a rule about triangles. You learned the shape of anything that repeats.',
        fa: 'شما یک قاعده دربارهٔ مثلث‌ها یاد نگرفتید؛ شکلِ هر چیزی را یاد گرفتید که تکرار می‌شود.',
      },
    ],
    readouts: [
      {
        id: 'theta',
        label: { en: 'Angle', fa: 'زاویه' },
        tone: 'cyan',
        value: (s) => `${fixed(num(s, 'AngleControl'), 1)}°`,
      },
      {
        id: 's',
        label: { en: 'Displacement', fa: 'جابه‌جایی' },
        tone: 'amber',
        value: (s) => fixed(num(s, 'OppSR'), 2),
      },
    ],
    actions: [
      {
        input: 'start',
        kind: 'trigger',
        label: { en: 'Release it', fa: 'رها کن' },
        tone: 'primary',
        completes: true,
      },
    ],
  },
]

export const lessonById = (id: string): Lesson | undefined =>
  lessons.find((l) => l.id === id)

export const lessonIndex = (id: string): number => lessons.findIndex((l) => l.id === id)
