# Weird Tall Canvas

Generate extreme aspect ratio canvases (e.g. 200x10000) for:
- scroll testing
- rendering experiments
- glitch art

## Usage

Open index.html or import:

\`\`\`js
import { createWeirdCanvas } from './src/generator.js';

createWeirdCanvas({
  width: 200,
  height: 10000,
  mode: 'canvas-noise'
});
\`\`\`

## Modes

- canvas-noise
- gradient
- stripes
- text
