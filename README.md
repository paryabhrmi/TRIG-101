# Trigonometry 101

An interactive, mobile-first course that teaches sine, cosine and tangent by
letting you drag them. Fifteen lessons planned, ten built, one Rive file doing
the heavy lifting.

**Live:** https://trig101.vercel.app (project name is claimed on first
deploy — see [Deploying](#deploying))

> **Desktop is intentionally gated in this MVP.** Every lesson is a thumb-drag
> on a canvas laid out for a phone, so wide viewports get an honest "open this
> on your phone" screen with a QR code rather than a stretched-out layout. A
> phone-frame preview is available on that screen for review purposes — it runs
> the same mobile build at phone dimensions, it is not a desktop layout.

---

## The idea

The course is built around one Rive file (`public/trig101.riv`, 44 artboards)
authored by Lucid Paper Studios. Those artboards ship with their own sliders,
toggles and buttons and are fully interactive on their own.

So the app does not re-implement the controls. Instead:

- **the canvas is the input surface** — you drag what you see;
- **the app reads the artboard's view model every frame** and mirrors it as
  live instrument readouts;
- **each lesson has a checkpoint** — a thing to *do* on the canvas. The app
  watches the view model until the learner reaches it, then marks the lesson
  complete.

That keeps the app a course shell rather than a second, competing UI, and it
means the lesson tasks are real manipulations instead of multiple-choice.

## Curriculum

| # | Lesson | Artboard | Checkpoint |
|---|--------|----------|------------|
| 1 | Naming the sides | `Angle` | Flip the focus to angle B |
| 2 | Shape, not size | `Ratio` | Hold 60°, push Scale past 160 |
| 3 | SOH CAH TOA | `SecretRatios` | Bring sin θ to 0.50 |
| 4 | Radians | `RadDeg` | Set the angle to one radian |
| 5 | The unit circle | `UnitCircle` | Spin until cos θ goes negative |
| 6 | Unrolling the sine | `CircletoSin` | Sweep past 2π |
| 7 | Cosine, one quarter early | `CircletoCos` | Sweep until cos θ bottoms out |
| 8 | Tangent and its walls | `CircletoTan` | Sweep through the 90° asymptote |
| 9 | Amplitude and frequency | `AmpFrqSin` | Max amplitude, frequency 3 |
| 10 | Where the wave shows up | `TheSwing` | Release the pendulum |

Slots 11–15 (`upcoming` in `src/data/curriculum.ts`) are placeholders: they
appear in the index with a SOON badge and open a screen naming what they will
cover. Titles are provisional — rename them freely, and move an entry from
`upcoming` into `lessons` once its artboard exists.

Copy is bilingual (English / Persian) with full RTL support; the switch is in
the app bar. Progress persists in `localStorage` and tracks the ten playable
lessons; numbering runs against all fifteen.

## Design

The app chrome deliberately borrows the file's own visual language so the
canvas does not look pasted into someone else's UI:

- the navy `#0D1062` and the blueprint grid come from the `Cover` artboard;
- panels are drawn like the `Ratio` panel — dark navy inside a thin steel-blue
  rule, with a teal-to-navy header wash;
- buttons reproduce the glossy silver-edged pills from the `Frequency (B)` row;
- readout labels take accent colours the way the ratio panel colours its terms;
- **DIN Round Pro** is self-hosted (woff2 in `src/assets/fonts/`, declared in
  `src/styles/fonts.css`).

Light-themed artboards (`Angle`, `SecretRatios`) sit on a white card; the dark
ones blend straight into the page.

## Rive integration notes

These were calibrated against the runtime and are worth knowing before editing
`src/data/curriculum.ts`.

**View models.** Three of the file's four view models are used:
`TriangleViewModel` (Ratio, SecretRatios, TheSwing), `ViewModel1` (UnitCircle,
AmpFrqSin), `ViewModel2` (CircletoSin/Cos/Tan) and `RadDegVM` (RadDeg). The
`Angle` artboard has **no** view model — binding one logs a runtime error, so
lessons declare `bindViewModel` explicitly.

**Reads, not writes.** Property writes only stick *after* the state machine's
first advance; before that, initialisation overwrites them. More importantly,
the nested slider artboards own their values, and writing a property moves the
geometry while leaving the on-canvas knob behind. The app therefore only ever
reads. `src/lib/useInstruments.ts` exposes the view model as a proxy, so a
lesson formatter can name any property and get the current frame's value
without a watch list.

**Derived values are free.** `AngleControl`, `OppSR`/`AdjSR`/`TanSR`,
`Adj`/`Opp`/`Hyp` and the ratio properties are computed inside Rive, so the
readouts show the file's own arithmetic rather than a second implementation
that could drift from it.

**Defaults are not neutral.** `SecretRatios` opens at 45°, where sin and cos
already match, and the `Angle` artboard's `Boolean 1` input defaults to `true`.
Checkpoints have to avoid states that are already satisfied at load — the
boolean case is handled by comparing against a baseline captured on load
(`Sample.b0`).

**Slider feel.** The artboards' sliders track the knob, and a fast drag can
outrun it. Grab the knob and it follows; users re-grab to continue. Checkpoint
tolerances are set for thumb precision (roughly ±4–10 px of travel) rather than
for exact values.

**Self-hosted WASM.** By default the Rive runtime fetches its WASM from
jsDelivr, which would tie an otherwise static site to a third party and fail
closed if that CDN is blocked. `src/lib/riveRuntime.ts` repoints the loader at
the bundled copy, so the deploy is self-contained.

## Known asset issue

Several artboards render `θ` as a missing-glyph box (`□ = 45.0°`). The theta
character is absent from the font subset embedded in the `.riv` file, so it has
to be fixed in Rive and re-exported — it cannot be patched from the app side.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
```

The desktop gate kicks in at ≥900 px wide. To see the course on a laptop,
either narrow the window or use the phone-frame preview on the gate.

## Deploying

The site deploys on [Vercel](https://vercel.com), connected to this GitHub
repository. One-time setup: on vercel.com, **Add New → Project**, import
`paryabhrmi/TRIG-101`, and accept the auto-detected Vite settings
(`npm run build`, output `dist`). Name the project `trig101` to get the
`trig101.vercel.app` URL (first come, first served — pick another name if
it's taken).

After that, every push to the production branch deploys automatically, and
every other branch gets its own preview URL on push. No workflow file or
config is needed; Vercel detects Vite on its own.

The app builds with the default `/` base and hash routing, so it needs no
rewrites and would also work unchanged behind a custom domain added in the
Vercel dashboard later.

## Stack

React 19 · TypeScript · Vite 8 · `@rive-app/react-canvas` · hash routing (no
server rewrites needed) · no CSS framework.

## Credits

Animation and artwork: **Lucid Paper Studios**, authored in
[Rive](https://rive.app). This repository is the course shell around that file.
