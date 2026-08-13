/**
 * The lesson graph.
 *
 * Every entry points at one artboard inside `public/trig101.riv`. The artboards
 * ship with their own sliders, toggles and buttons, so the canvas — not the
 * page — is the control surface. The app reads the artboard's view-model each
 * frame to mirror its state as instrument readouts and to decide when a
 * checkpoint has been met.
 *
 * All learner-facing copy is an `L10n` pair (English / Persian); screens pick
 * the current language with `useI18n().tr`.
 *
 * Property names and their ranges were calibrated against the runtime; see
 * README.md for the full map.
 */

import type { L10n, Lang } from '../lib/i18n'

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
  label: L10n
  tone: Tone
  value: (s: Sample, lang: Lang) => string
}

export interface Checkpoint {
  goal: L10n
  hint: L10n
  test: (s: Sample) => boolean
}

export interface LessonAction {
  /** State-machine input name. */
  input: string
  kind: 'trigger' | 'bool'
  label: L10n
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
  title: L10n
  tagline: L10n
  /** Step 1: what to touch. This is where the canvas is taught as a control. */
  watch: L10n
  body: L10n[]
  readouts: Readout[]
  actions?: LessonAction[]
  checkpoint?: Checkpoint
  /** Boolean state-machine inputs to mirror into `Sample.b`. */
  watchInputs?: string[]
}

/**
 * A lesson that is planned but has no artboard wired up yet. The course is
 * scoped at 15; these are the slots still to be authored, shown in the index
 * so the shape of the whole course is visible from day one.
 */
export interface UpcomingLesson {
  id: string
  chapter: number
  title: L10n
  tagline: L10n
  /** What it will cover once the artboard exists. */
  note: L10n
}

/** One multiple-choice item in a chapter review. */
export interface Question {
  prompt: L10n
  options: L10n[]
  /** Index into `options`. */
  answer: number
  /** Shown after answering, right or wrong. Teaches, never just confirms. */
  explain: L10n
}

export interface Chapter {
  id: number
  title: L10n
  blurb: L10n
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

/** An option whose text is identical in both languages (pure math). */
const same = (text: string): L10n => ({ en: text, fa: text })

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
      fa: 'جایی که نسبت‌ها از آن می‌آیند.',
    },
    review: [
      {
        prompt: {
          en: 'A right triangle has sides 3, 4 and 5. Standing at the angle opposite the side of length 4, what is sin of that angle?',
          fa: 'مثلثی قائم‌الزاویه ضلع‌هایی به طول ۳، ۴ و ۵ دارد. اگر در رأسِ زاویهٔ روبه‌روی ضلعِ ۴ ایستاده باشی، سینوس آن زاویه چقدر است؟',
        },
        options: [same('3/5'), same('4/5'), same('3/4'), same('4/3')],
        answer: 1,
        explain: {
          en: 'Sine is opposite over hypotenuse. The opposite side is 4, and the hypotenuse — always the longest — is 5.',
          fa: 'سینوس یعنی مقابل تقسیم بر وتر. ضلع مقابل ۴ است و وتر — که همیشه بلندترین ضلع است — ۵.',
        },
      },
      {
        prompt: {
          en: 'You double the length of every side. What happens to cos θ?',
          fa: 'طول همهٔ ضلع‌ها را دو برابر می‌کنی. چه بر سر cos θ می‌آید؟',
        },
        options: [
          { en: 'It doubles', fa: 'دو برابر می‌شود' },
          { en: 'It halves', fa: 'نصف می‌شود' },
          { en: 'It does not change', fa: 'تغییری نمی‌کند' },
          { en: 'It depends on the angle', fa: 'به زاویه بستگی دارد' },
        ],
        answer: 2,
        explain: {
          en: 'Both sides in the ratio grew by the same factor, so the fraction is untouched. Ratios track shape, not size.',
          fa: 'هر دو ضلعِ داخل نسبت با یک ضریب بزرگ شده‌اند، پس کسر دست‌نخورده می‌ماند. نسبت‌ها شکل را دنبال می‌کنند، نه اندازه را.',
        },
      },
      {
        prompt: {
          en: 'Why does tan θ have no value at exactly 90°?',
          fa: 'چرا tan θ در دقیقاً ۹۰ درجه هیچ مقداری ندارد؟',
        },
        options: [
          { en: 'The opposite side becomes zero', fa: 'ضلع مقابل صفر می‌شود' },
          {
            en: 'The adjacent side becomes zero, and nothing divides by zero',
            fa: 'ضلع مجاور صفر می‌شود و هیچ‌چیز بر صفر بخش‌پذیر نیست',
          },
          { en: 'The hypotenuse becomes infinite', fa: 'وتر بی‌نهایت می‌شود' },
          { en: 'It does have a value — it is 1', fa: 'مقدار دارد — برابر ۱ است' },
        ],
        answer: 1,
        explain: {
          en: 'tan θ is opposite ÷ adjacent. At 90° the adjacent side has collapsed to nothing, and the division is undefined.',
          fa: 'tan θ یعنی مقابل ÷ مجاور. در ۹۰ درجه ضلع مجاور به هیچ فروریخته و تقسیم تعریف‌نشده است.',
        },
      },
    ],
  },
  {
    id: 2,
    title: { en: 'The Circle', fa: 'دایره' },
    blurb: {
      en: 'Where the triangle stops being enough.',
      fa: 'جایی که مثلث دیگر کافی نیست.',
    },
    review: [
      {
        prompt: {
          en: 'One radian is the angle you have turned when…',
          fa: 'یک رادیان زاویه‌ای است که چرخیده‌ای، وقتی…',
        },
        options: [
          {
            en: 'you have gone a quarter of the way round',
            fa: 'یک‌چهارم دور را رفته باشی',
          },
          {
            en: 'the arc you travelled is as long as the radius',
            fa: 'کمانی که پیموده‌ای به اندازهٔ شعاع باشد',
          },
          {
            en: 'the arc you travelled is as long as the diameter',
            fa: 'کمانی که پیموده‌ای به اندازهٔ قطر باشد',
          },
          { en: 'you have turned exactly 60°', fa: 'دقیقاً ۶۰ درجه چرخیده باشی' },
        ],
        answer: 1,
        explain: {
          en: 'That is the whole definition, and it is why a half turn is π radians: a little over three radii laid around the rim.',
          fa: 'تعریف کامل همین است، و برای همین نیم‌دور π رادیان است: کمی بیش از سه شعاع که دور لبه چیده شده‌اند.',
        },
      },
      {
        prompt: {
          en: 'At which of these angles is cos θ negative?',
          fa: 'در کدام‌یک از این زاویه‌ها cos θ منفی است؟',
        },
        options: [same('30°'), same('45°'), same('89°'), same('120°')],
        answer: 3,
        explain: {
          en: 'Past 90° the adjacent side points backwards, so cosine goes negative — a reading a right triangle cannot produce.',
          fa: 'پس از ۹۰ درجه ضلع مجاور رو به عقب می‌رود و کسینوس منفی می‌شود — قرائتی که از هیچ مثلث قائم‌الزاویه‌ای برنمی‌آید.',
        },
      },
      {
        prompt: {
          en: 'A half turn is how many radians?',
          fa: 'نیم‌دور چند رادیان است؟',
        },
        options: [same('π/2'), same('π'), same('2π'), same('180')],
        answer: 1,
        explain: {
          en: 'A full turn is 2π, so half of it is π — roughly 3.14 radians.',
          fa: 'یک دور کامل 2π است، پس نیمِ آن π است — حدوداً ۳٫۱۴ رادیان.',
        },
      },
    ],
  },
  {
    id: 3,
    title: { en: 'The Wave', fa: 'موج' },
    blurb: {
      en: 'Where trigonometry meets the real world.',
      fa: 'جایی که مثلثات به دنیای واقعی می‌رسد.',
    },
    review: [
      {
        prompt: {
          en: 'After how much angle does the sine wave repeat exactly?',
          fa: 'موج سینوسی پس از چه مقدار زاویه دقیقاً تکرار می‌شود؟',
        },
        options: [
          same('π/2'),
          same('π'),
          same('2π'),
          { en: 'It never repeats', fa: 'هرگز تکرار نمی‌شود' },
        ],
        answer: 2,
        explain: {
          en: 'One full turn of the circle is one full cycle of the wave. That repeat is what periodic means.',
          fa: 'یک دور کامل دایره یعنی یک چرخهٔ کامل موج. همین تکرار است که معنای «متناوب» است.',
        },
      },
      {
        prompt: {
          en: 'In y = A·sin(Bθ), what does raising B do?',
          fa: 'در y = A·sin(Bθ)، بزرگ‌کردن B چه می‌کند؟',
        },
        options: [
          { en: 'Makes the peaks taller', fa: 'قله‌ها را بلندتر می‌کند' },
          {
            en: 'Squeezes the wave so more cycles fit in the same span',
            fa: 'موج را می‌فشرد تا چرخه‌های بیشتری در همان بازه جا شود',
          },
          { en: 'Shifts the wave sideways', fa: 'موج را به کنار می‌سراند' },
          { en: 'Flips the wave upside down', fa: 'موج را وارونه می‌کند' },
        ],
        answer: 1,
        explain: {
          en: 'A sets the height, B sets how many cycles fit. Louder versus higher-pitched, if the wave is a sound.',
          fa: 'A بلندی را تعیین می‌کند و B تعداد چرخه‌ها را. اگر موج یک صدا باشد: بلندتر در برابر زیرتر.',
        },
      },
      {
        prompt: {
          en: 'How does the cosine wave differ from the sine wave?',
          fa: 'موج کسینوس چه فرقی با موج سینوس دارد؟',
        },
        options: [
          { en: 'It is taller', fa: 'بلندتر است' },
          { en: 'It repeats twice as often', fa: 'دو برابر بیشتر تکرار می‌شود' },
          {
            en: 'It is the same wave, shifted a quarter turn',
            fa: 'همان موج است، یک‌چهارم دور جابه‌جا شده',
          },
          { en: 'It is upside down', fa: 'وارونه است' },
        ],
        answer: 2,
        explain: {
          en: 'Same shape, same period, started a quarter turn early: cos θ = sin(θ + π/2). That offset is a phase shift.',
          fa: 'همان شکل، همان دوره؛ فقط یک‌چهارم دور زودتر شروع شده: cos θ = sin(θ + π/2). این جابه‌جایی «انتقال فاز» نام دارد.',
        },
      },
    ],
  },
  {
    id: 4,
    title: { en: 'Coming Next', fa: 'در ادامه' },
    blurb: {
      en: 'Planned lessons — artboards still to be authored.',
      fa: 'درس‌های برنامه‌ریزی‌شده — آرت‌بردهایشان هنوز ساخته نشده.',
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
      fa: '«مقابل» و «مجاور» عنوان شغل‌اند، نه اسم.',
    },
    watch: {
      en: 'Under the triangle is a switch — everything on the canvas responds to your finger. Flip it.',
      fa: 'زیر مثلث یک کلید هست — همه‌چیزِ روی بوم به انگشتت پاسخ می‌دهد. کلید را بزن.',
    },
    body: [
      {
        en: 'Every right triangle has one side whose name never changes: the hypotenuse. Always across from the right angle, always the longest.',
        fa: 'هر مثلث قائم‌الزاویه یک ضلع دارد که نامش هرگز عوض نمی‌شود: وتر. همیشه روبه‌روی زاویهٔ قائمه، همیشه بلندترین.',
      },
      {
        en: 'The other two swap. Which one is opposite and which is adjacent depends entirely on the angle you are standing at.',
        fa: 'آن دو ضلع دیگر جایشان را عوض می‌کنند. اینکه کدام «مقابل» است و کدام «مجاور»، تماماً به زاویه‌ای بستگی دارد که در آن ایستاده‌ای.',
      },
      {
        en: 'Flip the focus between angle A and angle B. The triangle never moves — only the labels do.',
        fa: 'تمرکز را بین زاویهٔ A و زاویهٔ B جابه‌جا کن. مثلث هرگز تکان نمی‌خورد — فقط برچسب‌ها جابه‌جا می‌شوند.',
      },
    ],
    // `Angle` carries no view model, so these come from the state machine's
    // own boolean instead. Only the focus is live data — the side letters are
    // derived from it, never numbers copied out of the artboard.
    readouts: [
      {
        id: 'focus',
        label: { en: 'Focus', fa: 'تمرکز' },
        tone: 'cyan',
        value: (s, lang) =>
          s.b['Boolean 1']
            ? lang === 'fa'
              ? 'زاویهٔ A'
              : 'Angle A'
            : lang === 'fa'
              ? 'زاویهٔ B'
              : 'Angle B',
      },
      {
        id: 'opp',
        label: { en: 'Opposite', fa: 'مقابل' },
        tone: 'amber',
        value: (s) => (s.b['Boolean 1'] ? 'BC' : 'AC'),
      },
      {
        id: 'adj',
        label: { en: 'Adjacent', fa: 'مجاور' },
        tone: 'mint',
        value: (s) => (s.b['Boolean 1'] ? 'AC' : 'BC'),
      },
      {
        id: 'hyp',
        label: { en: 'Hypotenuse', fa: 'وتر' },
        tone: 'violet',
        value: () => 'AB',
      },
    ],
    checkpoint: {
      goal: {
        en: 'Move the focus onto angle B and watch the two labels trade places.',
        fa: 'تمرکز را روی زاویهٔ B بگذار و تماشا کن که دو برچسب جایشان را عوض می‌کنند.',
      },
      hint: { en: 'The switch sits under the triangle.', fa: 'کلید زیر مثلث است.' },
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
      fa: 'مثلث را بزرگ کن؛ نسبت‌ها زیر بار تغییر نمی‌روند.',
    },
    watch: {
      en: 'Two sliders sit under the triangle: Angle and Scale. Drag either one and watch the panel.',
      fa: 'دو اسلایدر زیر مثلث است: زاویه و مقیاس. هرکدام را کشیدی، پنل را تماشا کن.',
    },
    body: [
      {
        en: 'Two triangles with the same angles are one shape at two sizes. Mathematicians call them similar.',
        fa: 'دو مثلث با زاویه‌های یکسان، یک شکل‌اند در دو اندازه. ریاضی‌دان‌ها به آن‌ها «متشابه» می‌گویند.',
      },
      {
        en: 'Similar triangles share their side ratios exactly. That is the hinge the entire subject swings on.',
        fa: 'مثلث‌های متشابه نسبت ضلع‌هایشان دقیقاً یکی است. تمام این علم روی همین لولا می‌چرخد.',
      },
      {
        en: 'Drag Scale end to end: Opposite, Adjacent and Hypotenuse all move. The three ratios below them do not.',
        fa: 'مقیاس را از این سر تا آن سر بکش: مقابل، مجاور و وتر همه تغییر می‌کنند. سه نسبتِ زیرشان نه.',
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
      // The artboard already prints Opposite, Adjacent and Hypotenuse next to
      // the sides themselves. Repeating them here cost eight tiles, filled the
      // sheet, and squeezed the artwork. Show only the invariant — which is
      // the entire point of the lesson.
      {
        id: 'oh',
        label: { en: 'Opp ÷ Hyp', fa: 'مقابل ÷ وتر' },
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
        label: { en: 'Opp ÷ Adj', fa: 'مقابل ÷ مجاور' },
        tone: 'rose',
        value: (s) => fixed(num(s, 'TanRatio'), 3),
      },
    ],
    checkpoint: {
      goal: {
        en: 'Hold the angle at 60°, then push Scale past 160 — and keep an eye on the three ratios.',
        fa: 'زاویه را روی ۶۰ درجه نگه دار، بعد مقیاس را از ۱۶۰ بگذران — و چشمت به سه نسبت باشد.',
      },
      hint: {
        en: 'Set the angle first, then the scale. Neither slider disturbs the other.',
        fa: 'اول زاویه را تنظیم کن، بعد مقیاس را. هیچ‌کدام از دو اسلایدر دیگری را به‌هم نمی‌زند.',
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
    title: same('SOH CAH TOA'),
    tagline: {
      en: 'Three ratios, three names. That is the whole vocabulary.',
      fa: 'سه نسبت، سه نام. کل واژگان همین است.',
    },
    watch: {
      en: 'One slider under the circle sets the angle. Drag it and watch all three ratios at once.',
      fa: 'یک اسلایدر زیر دایره زاویه را تعیین می‌کند. آن را بکش و هر سه نسبت را هم‌زمان تماشا کن.',
    },
    body: [
      {
        en: 'Shrink the hypotenuse to exactly 1 and the ratios stop being fractions — they become the sides themselves.',
        fa: 'وتر را به دقیقاً ۱ برسان تا نسبت‌ها دیگر کسر نباشند — خودِ ضلع‌ها بشوند.',
      },
      {
        en: 'sin θ is the opposite side. cos θ is the adjacent side. tan θ is one divided by the other.',
        fa: 'sin θ همان ضلع مقابل است. cos θ همان ضلع مجاور است. tan θ یکی تقسیم بر دیگری.',
      },
      {
        en: 'Sweep from 0° to 90° and watch sine climb while cosine falls. At the very end tangent gives up entirely.',
        fa: 'از ۰ تا ۹۰ درجه جارو کن و ببین سینوس بالا می‌رود و کسینوس پایین می‌آید. در انتها تانژانت به‌کلی جا می‌زند.',
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
        label: same('sin θ'),
        tone: 'blue',
        value: (s) => fixed(num(s, 'OppSR'), 3),
      },
      {
        id: 'cos',
        label: same('cos θ'),
        tone: 'amber',
        value: (s) => fixed(num(s, 'AdjSR'), 3),
      },
      {
        id: 'tan',
        label: same('tan θ'),
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
        fa: 'زاویه را پایین بیاور تا sin θ عدد 0.50 را نشان بدهد.',
      },
      hint: {
        en: 'Sine hits exactly one half at a famous angle: 30°.',
        fa: 'سینوس در یک زاویهٔ معروف دقیقاً یک‌دوم می‌شود: ۳۰ درجه.',
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
      fa: 'درجه یک قرارداد است. رادیان یک اندازه‌گیری.',
    },
    watch: {
      en: 'Drag the slider at the bottom. Both dials turn together — one counts degrees, one counts radii.',
      fa: 'اسلایدر پایین را بکش. هر دو صفحه با هم می‌چرخند — یکی درجه می‌شمارد، یکی شعاع.',
    },
    body: [
      {
        en: '360 is a number inherited from Babylonian astronomers. Nothing about a circle requires it.',
        fa: '۳۶۰ عددی است به‌ارث‌رسیده از منجمان بابلی. هیچ‌چیزِ دایره آن را ایجاب نمی‌کند.',
      },
      {
        en: 'A radian is honest: it is the angle you have turned when the arc you walked is exactly as long as the radius.',
        fa: 'رادیان روراست است: زاویه‌ای است که چرخیده‌ای، وقتی کمانی که پیموده‌ای دقیقاً به اندازهٔ شعاع است.',
      },
      {
        en: 'So a half turn is π radians — a little over three radii laid around the rim.',
        fa: 'پس نیم‌دور π رادیان است — کمی بیش از سه شعاع که دور لبه چیده شده‌اند.',
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
        label: { en: 'In terms of π', fa: 'برحسب π' },
        tone: 'violet',
        value: (s) => `${fixed(num(s, 'Angle') / 180, 3)} π`,
      },
    ],
    checkpoint: {
      goal: {
        en: 'Set the angle to exactly one radian.',
        fa: 'زاویه را دقیقاً روی یک رادیان بگذار.',
      },
      hint: {
        en: 'Watch the radian readout, not the degrees. It lands near 57°.',
        fa: 'به قرائت رادیان نگاه کن، نه درجه. نزدیک ۵۷ درجه می‌نشیند.',
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
      fa: 'مثلثات از مثلث می‌گریزد.',
    },
    watch: {
      en: 'Press Spin it below, then watch Opp and Adj as the arm goes all the way round.',
      fa: 'پایین، «بچرخانش» را بزن و وقتی بازو دور کامل می‌زند، «مقابل» و «مجاور» را تماشا کن.',
    },
    body: [
      {
        en: 'Set the hypotenuse to 1 and pin it at the origin. Now the angle can keep going — past 90°, past 180°, past a full turn.',
        fa: 'وتر را ۱ بگیر و در مبدأ سنجاقش کن. حالا زاویه می‌تواند ادامه بدهد — از ۹۰ درجه بگذرد، از ۱۸۰ درجه، از یک دور کامل.',
      },
      {
        en: "The handle's height above the axis is sin θ. Its distance along the axis is cos θ. Always.",
        fa: 'ارتفاع دستگیره از محور، sin θ است. فاصله‌اش در امتداد محور، cos θ. همیشه.',
      },
      {
        en: 'Past 90° the adjacent side points backwards and cos θ turns negative — a reading no right triangle can produce. That is the moment a triangle rule becomes a function you can feed any number at all.',
        fa: 'پس از ۹۰ درجه ضلع مجاور رو به عقب می‌رود و cos θ منفی می‌شود — قرائتی که از هیچ مثلث قائم‌الزاویه‌ای برنمی‌آید. این همان لحظه‌ای است که یک قاعدهٔ مثلثی به تابعی بدل می‌شود که هر عددی را می‌پذیرد.',
      },
    ],
    readouts: [
      {
        id: 'opp',
        label: { en: 'Opp — sin θ', fa: 'مقابل — sin θ' },
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
        label: { en: 'Spin it', fa: 'بچرخانش' },
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
        fa: 'دایره را بچرخان و لحظه‌ای را شکار کن که cos θ منفی می‌شود — قرائتی که از هیچ مثلث قائم‌الزاویه‌ای برنمی‌آید.',
      },
      hint: {
        en: 'Press Spin it and watch the Adj readout once the arm passes the top of the circle.',
        fa: '«بچرخانش» را بزن و وقتی بازو از بالای دایره گذشت، قرائت «مجاور» را تماشا کن.',
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
      fa: 'موج، دایره‌ای است که در خط راست قدم زده.',
    },
    watch: {
      en: 'Drag the slider along the bottom to unroll the circle into the wave.',
      fa: 'اسلایدر پایین را بکش تا دایره به موج باز شود.',
    },
    body: [
      {
        en: 'Keep the angle turning, and plot the height of the handle against the angle itself.',
        fa: 'بگذار زاویه بچرخد، و ارتفاع دستگیره را در برابر خودِ زاویه رسم کن.',
      },
      {
        en: "The circle's vertical position, stretched out along an axis, is the sine wave. There is nothing more mysterious in it than that.",
        fa: 'جای عمودیِ نقطه روی دایره، وقتی در امتداد یک محور کش بیاید، همان موج سینوسی است. رازی بیش از این در کار نیست.',
      },
      {
        en: 'Sweep past π and the wave crosses zero on the way down. Past 2π the whole thing repeats — that repeat is what periodic means.',
        fa: 'از π بگذر تا موج در راهِ پایین از صفر رد شود. پس از 2π همه‌چیز از نو تکرار می‌شود — همین تکرار معنای «متناوب» است.',
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
        label: same('sin θ'),
        tone: 'blue',
        value: (s) => fixed(Math.sin(num(s, 'radian')), 3),
      },
    ],
    checkpoint: {
      goal: {
        en: 'Sweep past a full turn — 2π — and watch the wave start over, identical.',
        fa: 'از یک دور کامل — 2π — بگذر و ببین موج از نو و بی‌کم‌وکاست شروع می‌شود.',
      },
      hint: {
        en: 'Drag the slider knob to roughly halfway; the axis is marked in multiples of π.',
        fa: 'دستگیرهٔ اسلایدر را تا حدود نیمه بکش؛ محور با مضرب‌های π نشانه‌گذاری شده.',
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
    title: { en: 'Cosine, one quarter early', fa: 'کسینوس، یک‌چهارم زودتر' },
    tagline: {
      en: 'Cosine is sine with a head start.',
      fa: 'کسینوس همان سینوس است، با یک شروع زودهنگام.',
    },
    watch: {
      en: 'The same slider as before — but now it plots the horizontal position instead of the vertical.',
      fa: 'همان اسلایدر قبلی — اما این بار به‌جای جای عمودی، جای افقی را رسم می‌کند.',
    },
    body: [
      {
        en: 'Plot the horizontal position instead of the vertical one and the cosine wave falls out.',
        fa: 'به‌جای جای عمودی، جای افقی را رسم کن تا موج کسینوس بیرون بیفتد.',
      },
      {
        en: 'Same shape, same period. It simply starts at 1 instead of 0.',
        fa: 'همان شکل، همان دوره. فقط از ۱ شروع می‌شود، نه از ۰.',
      },
      {
        en: 'That quarter-turn offset has a name: a phase shift. cos θ = sin(θ + π/2).',
        fa: 'آن جابه‌جاییِ یک‌چهارم دور اسمی دارد: انتقال فاز. cos θ = sin(θ + π/2).',
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
        label: same('cos θ'),
        tone: 'amber',
        value: (s) => fixed(Math.cos(num(s, 'radian')), 3),
      },
    ],
    checkpoint: {
      goal: {
        en: 'Sweep a half turn, until cos θ bottoms out near −1.',
        fa: 'نیم‌دور جلو برو، تا cos θ نزدیک ‎−1 به کف برسد.',
      },
      hint: {
        en: 'Half a turn is π — the first mark on the axis.',
        fa: 'نیم‌دور یعنی π — نخستین نشانه روی محور.',
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
    watch: {
      en: 'Drag slowly through the first quarter turn. The interesting part is only a degree wide.',
      fa: 'در یک‌چهارمِ اول آهسته بکش. بخش جذاب فقط یک درجه پهنا دارد.',
    },
    body: [
      {
        en: 'Tangent is sine over cosine — height divided by width.',
        fa: 'تانژانت یعنی سینوس تقسیم بر کسینوس — ارتفاع تقسیم بر پهنا.',
      },
      {
        en: 'As the angle nears 90°, the width collapses toward zero while the height holds near 1. Dividing by almost nothing gives almost everything.',
        fa: 'وقتی زاویه به ۹۰ درجه نزدیک می‌شود، پهنا به‌سوی صفر فرومی‌ریزد در حالی که ارتفاع نزدیک ۱ می‌ماند. تقسیم بر تقریباً هیچ، تقریباً همه‌چیز می‌دهد.',
      },
      {
        en: 'The wall the curve never touches is called an asymptote. Tangent has one every half turn, forever.',
        fa: 'دیواری که منحنی هرگز به آن نمی‌رسد «مجانب» نام دارد. تانژانت هر نیم‌دور یکی دارد، تا ابد.',
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
        label: same('tan θ'),
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
        fa: 'یک‌راست از ۹۰ درجه رد شو و ببین تانژانت منفجر می‌شود، علامت عوض می‌کند و دوباره بالا می‌خزد.',
      },
      hint: {
        en: 'Drag slowly through the first quarter turn — the interesting part is one degree wide.',
        fa: 'در یک‌چهارمِ اول آهسته بکش — بخش جذاب یک درجه پهنا دارد.',
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
      fa: 'دو پیچ، یک موج را به همهٔ موج‌ها بدل می‌کند.',
    },
    watch: {
      en: 'A slider for amplitude, three buttons for frequency. Try them in any order.',
      fa: 'یک اسلایدر برای دامنه، سه دکمه برای بسامد. به هر ترتیبی امتحانشان کن.',
    },
    body: [
      {
        en: 'y = A·sin(Bθ). A stretches the wave vertically; B squeezes it horizontally.',
        fa: 'y = A·sin(Bθ). حرف A موج را عمودی می‌کشد؛ B آن را افقی می‌فشرد.',
      },
      {
        en: 'Amplitude is how loud. Frequency is how high the note. For sound, that is not a metaphor.',
        fa: 'دامنه یعنی چقدر بلند. بسامد یعنی نُت چقدر زیر. برای صدا، این استعاره نیست.',
      },
      {
        en: 'Change A and the peaks move. Change B and the peaks multiply. The shape never stops being a sine.',
        fa: 'A را عوض کن تا قله‌ها جابه‌جا شوند. B را عوض کن تا قله‌ها چند برابر شوند. شکل هیچ‌وقت از سینوس بودن دست نمی‌کشد.',
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
        label: { en: 'Animate', fa: 'پویانمایی' },
        tone: 'primary',
      },
    ],
    checkpoint: {
      goal: {
        en: 'Push the amplitude to its maximum and set the frequency to 3.',
        fa: 'دامنه را به بیشینه برسان و بسامد را روی ۳ بگذار.',
      },
      hint: {
        en: 'Amplitude is the slider; frequency is the row of buttons.',
        fa: 'دامنه همان اسلایدر است؛ بسامد ردیف دکمه‌ها.',
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
      fa: 'آونگ مثلثات نمی‌داند؛ با این حال از آن فرمان می‌برد.',
    },
    watch: {
      en: 'Press Release it below and follow the weight as it traces its path.',
      fa: 'پایین، «رهایش کن» را بزن و وزنه را دنبال کن تا مسیرش را رسم کند.',
    },
    body: [
      {
        en: 'Release the weight and track its horizontal position over time.',
        fa: 'وزنه را رها کن و جای افقی‌اش را در طول زمان دنبال کن.',
      },
      {
        en: 'The trace is a sine wave. So is a plucked string, an alternating current, a tide, and the brightness of one pixel in a radio signal.',
        fa: 'ردِ آن یک موج سینوسی است. سیمِ رهاشدهٔ ساز هم همین‌طور، جریان متناوب، جزر و مد، و روشناییِ یک پیکسل در یک سیگنال رادیویی.',
      },
      {
        en: 'You did not learn a rule about triangles. You learned the shape of anything that repeats.',
        fa: 'قاعده‌ای دربارهٔ مثلث‌ها یاد نگرفتی. شکلِ هر چیزی را یاد گرفتی که تکرار می‌شود.',
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
        label: { en: 'Release it', fa: 'رهایش کن' },
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
    title: { en: 'Phase shift', fa: 'انتقال فاز' },
    tagline: {
      en: 'Sliding a wave sideways without changing it.',
      fa: 'سراندن موج به پهلو، بی‌آنکه تغییر کند.',
    },
    note: {
      en: 'y = A·sin(Bθ + C) — the third dial, and why two identical waves can cancel each other out.',
      fa: 'y = A·sin(Bθ + C) — پیچ سوم، و اینکه چرا دو موج یکسان می‌توانند یکدیگر را خنثی کنند.',
    },
  },
  {
    id: 'identity',
    chapter: 4,
    title: { en: 'The Pythagorean identity', fa: 'اتحاد فیثاغورسی' },
    tagline: {
      en: 'sin²θ + cos²θ = 1, and why it cannot be otherwise.',
      fa: 'sin²θ + cos²θ = 1، و اینکه چرا جز این نمی‌تواند باشد.',
    },
    note: {
      en: 'The unit circle has radius 1. Pythagoras does the rest — no memorisation required.',
      fa: 'دایرهٔ واحد شعاع ۱ دارد. باقی را فیثاغورس انجام می‌دهد — بی‌نیاز از حفظ کردن.',
    },
  },
  {
    id: 'inverse',
    chapter: 4,
    title: { en: 'Going backwards', fa: 'راهِ برگشت' },
    tagline: {
      en: 'You know the ratio. What was the angle?',
      fa: 'نسبت را می‌دانی. زاویه چه بود؟',
    },
    note: {
      en: 'arcsin, arccos and arctan — and why a calculator has to pick just one of infinitely many answers.',
      fa: 'arcsin و arccos و arctan — و اینکه چرا ماشین‌حساب باید از بی‌شمار پاسخ فقط یکی را برگزیند.',
    },
  },
  {
    id: 'solving',
    chapter: 4,
    title: { en: 'Measuring the unreachable', fa: 'اندازه‌گیریِ دست‌نیافتنی' },
    tagline: {
      en: 'One angle and one distance is enough for a tower.',
      fa: 'برای یک برج، یک زاویه و یک فاصله کافی است.',
    },
    note: {
      en: 'Solving right triangles in the field: heights, slopes, and how surveyors actually work.',
      fa: 'حل مثلث قائم‌الزاویه در میدان: ارتفاع‌ها، شیب‌ها، و روش واقعی کار نقشه‌بردارها.',
    },
  },
  {
    id: 'signals',
    chapter: 4,
    title: { en: 'Everything is waves', fa: 'همه‌چیز موج است' },
    tagline: {
      en: 'Stack enough sines and you can draw anything.',
      fa: 'به‌قدر کافی سینوس روی هم بگذار تا هر چیزی را بکشی.',
    },
    note: {
      en: 'A first look at Fourier: sound, light and every signal as a sum of the waves you already know.',
      fa: 'نگاه نخست به فوریه: صدا، نور و هر سیگنال به‌صورت جمعِ موج‌هایی که از پیش می‌شناسی.',
    },
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
