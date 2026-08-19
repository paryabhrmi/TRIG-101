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

The course is built around one Rive file (`public/trig101.riv`, 43 artboards,
currently the V4 export). Those artboards ship with their own sliders, toggles
and buttons, are fully interactive on their own, and start playing the moment
they load — nothing has to be pressed to bring one to life.

So the app does not re-implement the controls. Instead:

- **the canvas is the input surface** — you drag what you see;
- **the app reads the artboard's view model every frame**, but only to decide
  how close the learner is to the lesson's goal — not to reprint numbers the
  artboard is already showing (see [The bottom sheet](#the-bottom-sheet));
- **each lesson has a checkpoint** — a thing to *do* on the canvas. The app
  watches the view model until the learner reaches it, then marks the lesson
  complete.

That keeps the app a course shell rather than a second, competing UI, and it
means the lesson tasks are real manipulations instead of multiple-choice.

## The bottom sheet

The screen is two bands. The artboard takes the top one at the **full width of
the phone in its own aspect ratio**, so it lands edge to edge with nothing
cropped and nothing letterboxed. The **bottom sheet** takes everything below
it, right down to the bottom of the screen: rounded top corners, a grabber
line, and the action row pinned under a scrolling body.

Its height is fixed for the whole lesson — the artboard states its height
first and the sheet takes the remainder (`flex: 1 1 0`, so the sheet's own
content never bids for the split). That matters because the artboards' sliders
are dragged by thumb, and a canvas that resizes mid-drag moves the knob out
from under the finger. **A step with more to say scrolls inside the sheet**
rather than growing it.

**What goes in the instrument slot is decided by what the artboards already
draw.** Rendering all ten shows that every one of them prints its own numbers:
`UnitCircle` writes `Hyp / Opp / Adj` under the circle, `SecretRatios` carries
a full SOH CAH TOA table, `Ratio` now carries the three ratios it used to leave
out, the three wave artboards print θ in degrees and in radians beside the
plotted value, and `AmpFrqSin`'s slider carries its own 0.5–2.5 scale. So the
rule is:

> The artboard says where you are. The sheet says where you are going.

What survives is the one reading the file does not draw — the radian in terms
of π in lesson 4 — plus:

- an **aim bar** (`Checkpoint.target`), which shows the distance left to the
  checkpoint and never the reading itself;
- **condition pills** (`Lesson.conditions`), where a checkpoint has two halves
  and the learner needs to know which one is outstanding;
- nothing at all, for the lessons whose artboard says everything already.

## Curriculum

| # | Lesson | Artboard | Checkpoint |
|---|--------|----------|------------|
| 1 | Naming the sides | `Angle` | Flip the focus to angle B |
| 2 | Shape, not size | `Ratio` | Hold 60°, push Scale past 160 |
| 3 | SOH CAH TOA | `SecretRatios` | Bring sin θ to 0.50 |
| 4 | Radians | `RadDeg` | Set the angle to one radian |
| 5 | The unit circle | `UnitCircle` | Catch cos θ going negative |
| 6 | Unrolling the sine | `CircletoSin` | Sweep past 2π |
| 7 | Cosine, one quarter early | `CircletoCos` | Sweep until cos θ bottoms out |
| 8 | Tangent and its walls | `CircletoTan` | Sweep through the 90° asymptote |
| 9 | Amplitude and frequency | `AmpFrqSin` | Max amplitude, frequency 3 |
| 10 | Where the wave shows up | `TheSwing` | Watch the trace draw itself |

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
- **M PLUS Rounded 1c** stands in for the file's DIN Round Pro.

Every artboard in the V4 file is drawn light on transparent paper, so all ten
sit straight on the page with no card and no inversion filter — the earlier
navy artboards are gone and `--invert-artboard` with them.

## Rive integration notes

These were calibrated against the runtime and are worth knowing before editing
`src/data/curriculum.ts`.

**View models.** Three of the file's four view models are used:
`TriangleViewModel` (Ratio, SecretRatios, TheSwing), `ViewModel1` (UnitCircle,
AmpFrqSin), `ViewModel2` (CircletoSin/Cos/Tan) and `RadDegVM` (RadDeg). The
`Angle` artboard has **no** view model — binding one logs a runtime error, so
lessons declare `bindViewModel` explicitly.

**Fit, and why it is `Contain` rather than `None`.** `RiveStage` reads the
artboard's bounds on load and gives its box that aspect ratio, so `Contain`
inside it is an exact width fit: no scale-down, no bars, no crop. Most
artboards are 1:1; `Ratio` is 500×570 and the wave artboards are 1000×1000,
and each gets its own shape rather than being pillarboxed inside a shared
square.

`Fit.None` was measured as the alternative and does not survive contact with
this file. It pins the artboard to one artboard-unit per **device** pixel while
the runtime maps touches in **CSS** pixels (`registerTouchInteractions`
computes its matrix from `getBoundingClientRect()`), so the two disagree by the
device-pixel ratio. On a 390px screen, a drag across the `SecretRatios` slider
moved the angle **23.9° where the pointer asked for 30.7°** — exactly the
390/500 error, and enough to walk the knob out from under the thumb. It also
caps the drawing surface at the artboard's own 500px where the phone wants
1170. Since every lesson here is a thumb-drag, that trade is not available.

**Controls now live in their lesson's artboard.** In earlier exports `Ratio`'s
two sliders were separate artboards (`Ratio/AngleSlider`, `Ratiop/ScaleSlider`)
that had to be drawn underneath and reconnected by sharing a view-model
instance. V4 nests them, along with the three ratio cards, so the lesson is one
artboard again and `Lesson.controls` is gone.

**Nothing needs starting.** `UnitCircle` spins, `AmpFrqSin` draws and
`TheSwing` swings from the moment they load, so the app fires no state-machine
input and no lesson carries a button. Two consequences worth knowing: the
checkpoint is only armed on the task step (`useInstruments(..., armed)`), since
a self-running artboard would otherwise satisfy it while the learner is still
reading what it is; and `TheSwing` puts nothing on its view model while it
plays, so its checkpoint is `autoSolveMs` — the time the trace takes to draw.

**Reads, not writes.** Property writes only stick *after* the state machine's
first advance; before that, initialisation overwrites them. More importantly,
the artboards' sliders own their values, and writing a property moves the
geometry while leaving the on-canvas knob behind. The app therefore only ever
reads. `src/lib/useInstruments.ts` exposes the view model as a proxy, so a
lesson formatter can name any property and get the current frame's value
without a watch list.

**Derived values are free.** `AngleControl`, `OppSR`/`AdjSR`/`TanSR`,
`Adj`/`Opp`/`Hyp` and the ratio properties are computed inside Rive, so the
readouts show the file's own arithmetic rather than a second implementation
that could drift from it.

**Defaults are not neutral.** `SecretRatios` opens near 47°, close enough to
45° that sin and cos are almost matched, and the `Angle` artboard's `Boolean 1`
input defaults to `true`.
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

**The θ glyph is still missing.** Several artboards render `θ` as a
missing-glyph box (`Angle □ = 45.0°`), and the three wave artboards are the
worst hit — `□ = sin(□)`, `□ = 0.00 rad`. The theta character is absent from
the font subset embedded in the `.riv` file, so it has to be fixed in Rive and
re-exported — it cannot be patched from the app side. This one survived the V4
re-export.

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

The canvas runtime rather than the WebGL one, and deliberately so:
`@rive-app/react-webgl` is pinned at 4.27.3, which reads script bytecode
versions 3–6, and this file's artboards carry version 7 — on WebGL, lesson 3's
tangent row renders as `Initial value` over garbled digits.
`@rive-app/react-canvas` is on 4.32.0 and reads it.

Verified rather than assumed: instrumenting `HTMLCanvasElement.getContext`
across all ten lessons shows the on-screen canvas taking a **`2d`** context via
`makeRenderer`, which is the render path. A single `webgl2` context is also
taken, once, on an off-DOM 300×150 canvas during the WASM module's boot — that
is Emscripten probing for image-mesh support, not a render surface, and this
file draws no image meshes. There is no way to decline the probe short of
monkey-patching a global browser API, which would be a worse defect than the
one it removes.

## Credits

Animation and artwork: **AYNE Studio**, authored in
[Rive](https://rive.app). This repository is the course shell around that file.
