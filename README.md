# Trigonometry 101

An interactive, mobile-first course that teaches sine, cosine and tangent by
letting you drag them. Fifteen lessons planned, ten built, one Rive file doing
the heavy lifting.

**Live:** https://paryabhrmi.github.io/TRIG-101/ (published by
`.github/workflows/deploy.yml` — see [Deploying](#deploying))

> **Desktop is intentionally gated in this MVP.** Every lesson is a thumb-drag
> on a canvas laid out for a phone, so wide viewports get an honest "open this
> on your phone" screen with a QR code rather than a stretched-out layout. A
> phone-frame preview is available on that screen for review purposes — it runs
> the same mobile build at phone dimensions, it is not a desktop layout.

---

## The idea

The course is built around one Rive file (`public/trig101.riv`, 44 artboards)
authored by AYNE Studio. Those artboards ship with their own sliders,
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

Copy is English only. Progress persists in `localStorage` and tracks the ten
playable lessons; numbering runs against all fifteen and is the same on the
index as it is inside a lesson.

## Design

The shell is one light surface end to end, so the artwork — not the chrome —
is the thing on screen:

- paper white throughout. The eight artboards drawn light-on-navy are inverted
  into it with a CSS filter (`--invert-artboard`), which is why there is no
  dark theme to switch to and no navy chrome left;
- flat fills riding on a hard darker "edge", so buttons, keys and rows read as
  chunky pressable pieces;
- one accent per chapter, cycling in course order;
- readout labels take the colour of the side they mirror on the canvas;
- **Nunito** carries the rounded, game-like voice, with M PLUS Rounded 1c
  behind it.

Every colour that carries text clears WCAG AA (4.5:1, or 3:1 at large sizes),
and every control is at least a 44 px target. Both are checked against the
running app rather than by eye — the chapter accents in particular are
saturated rather than pastel because white text on the pastel versions sat at
2.1–2.6:1.

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

## Known asset issues

All three are in the `.riv` file and none can be patched from the app side.

**Script bytecode is ahead of the runtime.** The file's scripts are compiled at
bytecode version 7; `@rive-app/react-webgl` 4.27.3 — the latest published
runtime — accepts 3 to 6, so they refuse to run:

```
[string "TriangleCalculator"]: bytecode version mismatch (expected [3..6], got 7)
```

Every value that script derives then reads as zero, in the artboard's own panel
as well as in the app's readouts. On `SecretRatios` at the default 45° that
means `sin θ 0.000`, `cos θ 0.000`, `tan θ ∞`, and because lesson 3's
checkpoint tests `OppSR` against 0.5, **that lesson cannot be completed**.
Lesson 2's three ratios are wrong for the same reason. Fix: re-export from a
Rive editor whose runtime is released, or drop the checkpoint's dependency on
script-derived values.

**`Ratio` overflows its canvas.** The artboard carries its own responsive
layout rather than a fixed size, so `Fit.Contain` does not letterbox it: the
bottom of the Scale slider and the whole third ratio tile are cut off at every
phone size, including on a viewport tall enough to hold them. Fix: export at a
fixed size, or shorten the panel.

**Missing theta glyph.** Several artboards render `θ` as a missing-glyph box
(`□ = 45.0°`) — the character is absent from the font subset embedded in the
file.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
```

The desktop gate kicks in at ≥900 px wide *and* `pointer: fine` — the lessons
need a thumb, not a narrow window, so a landscape tablet gets the course and a
narrowed desktop window still gets the gate. To see the course on a laptop, use
the phone-frame preview on the gate.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages at https://paryabhrmi.github.io/TRIG-101/.

No manual setup is needed: the workflow passes `enablement: true` to
`configure-pages`, so a fresh fork or a renamed repository provisions its own
Pages site on the first run.

One caveat worth knowing if this repo ever goes private: GitHub Pages on a
private repository requires a paid plan. On Free, `configure-pages` fails
with `Resource not accessible by integration` until the repo is public again.

`vite.config.ts` sets `base: '/TRIG-101/'` for production builds. If the
repository is ever renamed, that value has to change with it.

## Stack

React 19 · TypeScript · Vite 8 · `@rive-app/react-canvas` · hash routing (no
server rewrites needed) · no CSS framework.

## Credits

Animation and artwork: **AYNE Studio**, authored in
[Rive](https://rive.app). This repository is the course shell around that file.
