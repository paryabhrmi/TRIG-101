# Trig 101 design system

Source of truth: [`trigDesignSystem.pdf`](./trigDesignSystem.pdf). The tokens
below are implemented as CSS custom properties in `src/styles/global.css`
(`--ds-*`) and applied in `src/styles/app.css`.

## Type — DIN Round Pro

DIN Round Pro ships with the app, self-hosted as woff2 in
`src/assets/fonts/` and declared in `src/styles/fonts.css` (Light 300,
Regular 400, Medium 500, Bold 600–700, Black 800–900). The faces are
licensed FSI FontShop material — see `src/assets/fonts/COPYRIGHT.txt`.

| Role                    | Weight | Size |
| ----------------------- | ------ | ---- |
| App bar title           | Black  | 24   |
| App bar subtitle        | Medium | 20   |
| Chapter label           | Black  | 16   |
| Chapter title           | Black  | 24   |
| Lesson number badge     | Black  | 20   |
| Lesson title            | Bold   | 20   |
| Chapter review / button | Black  | 24   |

## Color tokens

Four-step accent ramps — light → base → dark → deep. Light is for chapter
titles and review badges, base for fills and lesson numbers, dark for pressed
fills and bottom strokes, deep for chapter labels and the header's bottom edge.

| Ramp   | light     | base      | dark      | deep      |
| ------ | --------- | --------- | --------- | --------- |
| Blue   | `#55bff9` | `#2baff7` | `#228cc6` | `#1a6994` |
| Gold   | `#eda733` | `#e89100` | `#ba7400` | `#8b5700` |
| Violet | `#9d70c6` | `#854db8` | `#6a3d93` | `#4f2e6e` |
| Red    | `#ff6f6f` | `#ff4b4b` | `#cc3c3c` | `#992d2d` |

Grays: `#4b4b4b` (body text) · `#777777` (secondary text) · `#afafaf`
(badge strokes) · `#e5e5e5` (card strokes, dividers) · `#f7f7f7` (badge fill).

Chapter accents: 1 → blue, 2 → gold, 3 → violet, 4 → red (the `accent`
field on `Chapter` in `src/data/curriculum.ts`).

## Shape and strokes

- Corner radius: **16** everywhere (cards, badges, buttons).
- App bar: `#2baff7` fill with a **4px** `#1a6994` bottom edge.
- Chapter card: **2px** `#e5e5e5` stroke, rows divided by **1px** lines.
- Number badge: **2px** `#afafaf` stroke, **4px** along the bottom.

## Main button

Fill `#2baff7`, label `#ffffff`, bezel `#228cc6` at **1px top / 2px sides /
4px bottom**. Pressed: fill `#228cc6` and the bezel settles to an even
**2px**, sinking the button. Spacing rhythm: 8 / 16 / 24 / 32.
