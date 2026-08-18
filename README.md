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
- **the app reads the artboard's view model every frame**, but only to decide
  how close the learner is to the lesson's goal — not to reprint numbers the
  artboard is already showing (see [The lesson bar](#the-lesson-bar));
- **each lesson has a checkpoint** — a thing to *do* on the canvas. The app
  watches the view model until the learner reaches it, then marks the lesson
  complete.

That keeps the app a course shell rather than a second, competing UI, and it
means the lesson tasks are real manipulations instead of multiple-choice.

## The lesson bar

The whole screen is the artboard, edge to edge, with a fixed **180px** bar
under it. The bar's height never changes between the first two steps — every
row is reserved whether or not a lesson fills it — because the artboards'
sliders are dragged by thumb, and a canvas that resizes mid-drag moves the knob
out from under the finger.

```
 12  padding
 14  step name
  4  gap
 40  task, two lines reserved
  8  gap
 28  instrument slot
  8  gap
 54  action row (a 50px button and its 4px edge)
 12  padding
---
180  plus the bottom safe area
```

The third step ("why it works") opens the same bar into a panel, once, when the
lesson is solved. There is nothing to drag and no handle to find.

**What goes in the instrument slot is decided by what the artboards already
draw.** Rendering all ten showed that nine print their own numbers: `UnitCircle`
writes `Hyp / Opp / Adj` under the circle, `SecretRatios` carries a full SOH CAH
TOA table, the three wave artboards print θ in degrees and in radians beside the
plotted value, and `AmpFrqSin`'s slider carries its own 0.5–2.5 scale. Twenty-six
of the course's thirty-two readout tiles were copies of something already on the
canvas. So the rule is:

> The artboard says where you are. The bar says where you are going.

What survives is four tiles the file does not draw — the three ratios in lesson 2
and the radian in terms of π in lesson 4 — plus:

- an **aim bar** (`Checkpoint.target`), which shows the distance left to the
  checkpoint and never the reading itself;
- **condition pills** (`Lesson.conditions`), where a checkpoint has two halves
  and the learner needs to know which one is outstanding;
- nothing at all, for the lessons whose artboard says everything already.

### Putting the old sheet back

The previous bottom sheet is preserved whole in `src/components/LessonSheet.tsx`.
Add `?ui=sheet` anywhere in the address to switch a live deploy back to it, and
`?ui=bar` to return; the choice is remembered, since hash routing drops the query
on navigation. This is a review aid, not a user setting — it is not surfaced
anywhere in the UI. See `src/lib/uiMode.ts`.

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

Progress persists in `localStorage` and tracks the ten playable lessons;
numbering runs against all fifteen.

## Design

Everything the app draws comes from one token file, `src/styles/global.css`.
No rule in `src/styles/app.css` names a colour, a font size, a weight or a
radius directly — if you find yourself typing a hex, the system is missing a
role and the role is what should be added.

**Colour.** The palette is sampled from the Rive file, because the artwork
cannot change and so the shell is the thing that has to agree with it. Each of
the six accents is one hue in six roles:

| role | what it is |
| --- | --- |
| `--x` | the fill — chunky surfaces, banners, filled keys |
| `--x-edge` | the hard darker border drawn under the fill |
| `--x-on` | text and icons that ride **on** the fill |
| `--x-ink` | the accent used **as** text, on paper or on `--x-soft` |
| `--x-soft` | its tinted surface |
| `--x-line` | its tinted border |

The steps are measured, not eyeballed: `on` against `fill`, and `ink` against
both paper and `soft`, all clear 4.5:1. Amber is the one accent whose `on`
colour is ink rather than white — no step of amber that still reads as amber
can carry white text — so anything that sits on an amber fill inverts with it,
via the `--wash-*` tokens.

Each accent means one thing, everywhere:

- **blue** — the brand, and every interactive affordance;
- **green** — solved, correct, complete. The app's only success colour;
- **amber** — not built yet, held back, hinted at;
- **rose** — wrong answers, and the one destructive action;
- **violet, cyan** — chapter accents and canvas readouts.

A chapter picks one of them and republishes it as `--tone`/`--tone-edge`/
`--tone-on`/`--tone-ink`; nothing downstream of `.chapter--*` names an accent.

**Shape.** Every pressable thing in the app is the same object: a flat fill
riding on a hard darker edge (`--edge`), which sinks into that edge when
pressed. Nothing dims and nothing scales. Buttons, quiz options, number keys
and the hint key are all that one object at different sizes.

**Type.** One scale, `--t-micro` through `--t-display`, and four weights
(`--w-body` 500, `--w-mid` 700, `--w-bold` 800, `--w-black` 900). Only those
four are fetched from Google Fonts. **Nunito** carries the rounded, game-like
voice; **M PLUS Rounded 1c** backs it up and stands in for the file's
DIN Round Pro.

**The canvas.** The artboards are never restyled — the app owns the chrome
around them and nothing inside them. The two dark artboard themes are inverted
into the light one (`--invert-artboard`) so the whole product is a single white
surface; the field behind an inverted artboard carries `--field-inverted`, the
measured result of running the file's navy through that filter, so canvas and
page are one continuous surface rather than a tile on a backdrop.

## Rive integration notes

These were calibrated against the runtime and are worth knowing before editing
`src/data/curriculum.ts`.

**View models.** Three of the file's four view models are used:
`TriangleViewModel` (Ratio, SecretRatios, TheSwing), `ViewModel1` (UnitCircle,
AmpFrqSin), `ViewModel2` (CircletoSin/Cos/Tan) and `RadDegVM` (RadDeg). The
`Angle` artboard has **no** view model — binding one logs a runtime error, so
lessons declare `bindViewModel` explicitly.

**A square stage, and one surface.** Every artboard is 1:1 (`Ratio` alone is
500×538), so the stage is a square the width of the screen: `Contain` then lands
any artboard in it complete, edge to edge, with nothing cropped and nothing
letterboxed, at a size fixed by the viewport rather than by which step is open.
Where a phone is too short for a full-width square — only `Ratio`, which shares
the field with its two sliders — the square insets rather than crops.

The field around the square carries the artboard's own background: `--paper` for
the light artboards, and `#f6f9ff` for the dark ones, which is where `#0d1062`
lands after `--invert-artboard` (measured off the rendered canvas, not guessed).
So the canvas and the page are one continuous surface rather than a tile on a
backdrop.

**Controls that live in their own artboards.** `Ratio`'s two sliders were
authored as separate artboards — `Ratio/AngleSlider` and `Ratiop/ScaleSlider` —
rather than nested into the lesson artboard, so on its own that lesson draws a
triangle with nothing to touch and a checkpoint that cannot be reached. The app
draws them under it and hands them the lesson artboard's own view-model instance
(`bindViewModelInstance`), which reconnects them: dragging a slider moves
`AngleControl`/`ScaleControl` and the triangle follows. `Lesson.controls`
declares this; no other lesson needs it.

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

The canvas runtime rather than the WebGL one: `@rive-app/react-webgl` is pinned
at 4.27.3, which reads script bytecode versions 3–6, and this file's artboards
carry version 7 — on WebGL, lesson 3's tangent row renders as `Initial value`
over garbled digits. `@rive-app/react-canvas` is on 4.32.0 and reads it.

## Credits

Animation and artwork: **Lucid Paper Studios**, authored in
[Rive](https://rive.app). This repository is the course shell around that file.
