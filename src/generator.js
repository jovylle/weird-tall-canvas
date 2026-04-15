export function createWeirdCanvas(opts = {}) {
  const {
    width = 200,
    height = 10000,
    mode = 'noise',
    mount = document.body
  } = opts;

  if (mode === 'canvas-noise') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = \`rgb(\${Math.random()*255},\${Math.random()*255},\${Math.random()*255})\`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    mount.appendChild(canvas);
    return canvas;
  }

  const el = document.createElement('div');
  el.style.width = width + 'px';
  el.style.height = height + 'px';

  if (mode === 'gradient') {
    let gradient = 'linear-gradient(to bottom';
    for (let i = 0; i < 50; i++) {
      const color = \`hsl(\${Math.random()*360},100%,50%)\`;
      const pos = Math.random()*100;
      gradient += \`, \${color} \${pos}%\`;
    }
    gradient += ')';
    el.style.background = gradient;
  }

  if (mode === 'stripes') {
    el.style.background = \`
      repeating-linear-gradient(
        to bottom,
        black 0px,
        black 5px,
        white 5px,
        white 10px
      )
    \`;
  }

  if (mode === 'text') {
    for (let i = 0; i < 1000; i++) {
      const p = document.createElement('div');
      p.textContent = Math.random().toString(36);
      p.style.fontSize = '10px';
      p.style.color = 'lime';
      el.appendChild(p);
    }
  }

  mount.appendChild(el);
  return el;
}
