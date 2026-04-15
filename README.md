# Weird Tall Canvas

Tiny utility for generating extreme aspect ratio visual strips (for example `300 x 10000`) to test browser scroll behavior and rendering limits.

## Use Cases

- scroll testing
- rendering experiments
- glitch/procedural visuals
- embed and iframe tests

## Project Structure

```txt
weird-tall-canvas/
├── index.html
├── src/
│   ├── generator.js
│   └── presets.js
└── README.md
```

## Core API

```js
import { createWeirdCanvas } from './src/generator.js';

createWeirdCanvas({
  width: 300,
  height: 10000,
  mode: 'canvas-noise',
  color: '#5b8cff',
  mount: document.body
});
```

## Modes

- `canvas-noise`: pixel-by-pixel randomized canvas fill
- `gradient`: randomized vertical gradient strip
- `stripes`: high-contrast alternating bands
- `checkerboard`: alternating tile blocks
- `diagonal-lines`: slanted line pattern
- `dots`: dense dot matrix pattern
- `grid`: debug-style grid lines
- `text`: text-heavy canvas rows for render stress testing
- `plain-color`: single solid color fill (uses `color`)

All modes now render to canvas, so all modes are downloadable.
The demo UI also includes clickable pattern samples for quick visual picking.

For extreme sizes, the generator automatically switches to a lightweight DOM fallback to avoid canvas crashes or freezes. In that fallback, export attempts a full-size JPG image (which may fail on some browsers/devices due to memory limits).

## Minimal Demo

```html
<!DOCTYPE html>
<html>
<body style="margin:0; background:#111;">
<script type="module">
import { createWeirdCanvas } from './src/generator.js';

createWeirdCanvas({
  width: 300,
  height: 10000,
  mode: 'stripes'
});
</script>
</body>
</html>
```

## Expected Behavior

- a thin vertical strip appears
- the page becomes scrollable
- changing modes produces clearly different output

## Common Issues

- nothing renders: verify module import path
- no scroll: ensure output is appended to a visible mount node
- visual appears blank: use `stripes` mode to quickly verify rendering
- lag: expected with very large heights, especially in `text` mode

## Presets

`src/presets.js` includes ready-made presets (`glitch`, `static`, `barcode`, `domStress`, `solid`) you can spread into `createWeirdCanvas(...)`.

## Future Extensions

- deterministic `seed` support
- `export()` helper returning `canvas.toDataURL()`
- `autoMode` based on dimensions/perf target
- infinite/append mode while scrolling
- single-file embeddable IIFE build
