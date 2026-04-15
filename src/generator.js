const SUPPORTED_MODES = new Set([
  'canvas-noise',
  'gradient',
  'stripes',
  'checkerboard',
  'diagonal-lines',
  'dots',
  'grid',
  'text',
  'plain-color'
]);
const MAX_SAFE_CANVAS_EDGE = 32767;
const MAX_SAFE_CANVAS_PIXELS = 36_000_000;
const DEFAULT_COLOR = '#5b8cff';

function clampPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function resolveMount(mount) {
  if (mount instanceof HTMLElement) {
    return mount;
  }
  return document.body;
}

function createBaseCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return canvas;
}

function attachRenderMeta(element, meta) {
  element.dataset.weirdCanvasMeta = JSON.stringify(meta);
}

function readRenderMeta(element) {
  if (!element || !element.dataset || !element.dataset.weirdCanvasMeta) {
    return null;
  }
  try {
    return JSON.parse(element.dataset.weirdCanvasMeta);
  } catch {
    return null;
  }
}

function shouldUseLightweightSurface(width, height) {
  return width > MAX_SAFE_CANVAS_EDGE || height > MAX_SAFE_CANVAS_EDGE || width * height > MAX_SAFE_CANVAS_PIXELS;
}

function get2DContext(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create 2D canvas context.');
  }
  return ctx;
}

function renderNoise(ctx, width, height) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(Math.random() * 256);
    data[i + 1] = Math.floor(Math.random() * 256);
    data[i + 2] = Math.floor(Math.random() * 256);
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

function renderGradient(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (let i = 0; i < 10; i += 1) {
    const color = `hsl(${Math.floor(Math.random() * 360)} 95% 55%)`;
    gradient.addColorStop(i / 9, color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function renderStripes(ctx, width, height) {
  const stripeHeight = 16;
  for (let y = 0; y < height; y += stripeHeight) {
    const isDark = Math.floor(y / stripeHeight) % 2 === 0;
    ctx.fillStyle = isDark ? '#000000' : '#ffffff';
    ctx.fillRect(0, y, width, stripeHeight);
  }
}

function renderCheckerboard(ctx, width, height) {
  const size = 20;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const even = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
      ctx.fillStyle = even ? '#111111' : '#f5f5f5';
      ctx.fillRect(x, y, size, size);
    }
  }
}

function renderDiagonalLines(ctx, width, height) {
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#7ce7ff';
  ctx.lineWidth = 3;
  const gap = 18;
  for (let x = -height; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
}

function renderDots(ctx, width, height) {
  ctx.fillStyle = '#0d1020';
  ctx.fillRect(0, 0, width, height);
  const spacing = 16;
  for (let y = 8; y < height; y += spacing) {
    for (let x = 8; x < width; x += spacing) {
      ctx.fillStyle = (Math.floor(x / spacing) + Math.floor(y / spacing)) % 2 === 0 ? '#ff4d9a' : '#ffe066';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderGrid(ctx, width, height) {
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#2ed573';
  ctx.lineWidth = 1;
  const gap = 20;
  for (let x = 0; x <= width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function renderText(ctx, width, height) {
  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#6eff6e';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textBaseline = 'top';

  const lineHeight = 12;
  const rowCount = Math.max(1, Math.floor(height / lineHeight));
  for (let row = 0; row < rowCount; row += 1) {
    const text = `row-${String(row).padStart(4, '0')} ${Math.random().toString(36).slice(2, 18)}`;
    ctx.fillText(text, 2, row * lineHeight);
  }
}

function renderPlainColor(ctx, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function createLightweightStrip(width, height, mode, color) {
  const el = document.createElement('div');
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style.display = 'block';
  el.dataset.weirdCanvasLightweight = 'true';

  if (mode === 'plain-color') {
    el.style.background = color;
  } else if (mode === 'stripes') {
    el.style.background = 'repeating-linear-gradient(to bottom, #000 0 8px, #fff 8px 16px)';
  } else if (mode === 'checkerboard') {
    el.style.background =
      'conic-gradient(#f5f5f5 25%, #111 0 50%, #f5f5f5 0 75%, #111 0) 0 0 / 20px 20px';
  } else if (mode === 'diagonal-lines') {
    el.style.background =
      'repeating-linear-gradient(45deg, #0f0f0f 0 8px, #7ce7ff 8px 11px, #0f0f0f 11px 20px)';
  } else if (mode === 'dots') {
    el.style.background =
      'radial-gradient(circle at 6px 6px, #ff4d9a 0 3px, transparent 3px), radial-gradient(circle at 14px 14px, #ffe066 0 3px, transparent 3px), #0d1020';
    el.style.backgroundSize = '20px 20px, 20px 20px, auto';
  } else if (mode === 'grid') {
    el.style.background =
      'linear-gradient(#2ed573 1px, transparent 1px), linear-gradient(90deg, #2ed573 1px, transparent 1px), #121212';
    el.style.backgroundSize = '20px 20px, 20px 20px, auto';
  } else if (mode === 'gradient') {
    el.style.background = 'linear-gradient(to bottom, #ff4d9a, #ff9f43, #ffe066, #2ed573, #1e90ff, #8e44ad)';
  } else {
    // canvas-noise and text are very expensive at extreme sizes; fallback intentionally stays lightweight.
    el.style.background = color;
  }

  return el;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderModeToCanvas({ width, height, mode, color }) {
  const canvas = createBaseCanvas(width, height);
  const ctx = get2DContext(canvas);

  if (mode === 'canvas-noise') {
    renderNoise(ctx, width, height);
  } else if (mode === 'gradient') {
    renderGradient(ctx, width, height);
  } else if (mode === 'stripes') {
    renderStripes(ctx, width, height);
  } else if (mode === 'checkerboard') {
    renderCheckerboard(ctx, width, height);
  } else if (mode === 'diagonal-lines') {
    renderDiagonalLines(ctx, width, height);
  } else if (mode === 'dots') {
    renderDots(ctx, width, height);
  } else if (mode === 'grid') {
    renderGrid(ctx, width, height);
  } else if (mode === 'text') {
    renderText(ctx, width, height);
  } else if (mode === 'plain-color') {
    renderPlainColor(ctx, width, height, color);
  }

  return canvas;
}

function renderModeToOffscreenCanvas({ width, height, mode, color }) {
  if (typeof OffscreenCanvas === 'undefined') {
    return null;
  }

  const offscreen = new OffscreenCanvas(width, height);
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create 2D context for OffscreenCanvas.');
  }

  if (mode === 'canvas-noise') {
    renderNoise(ctx, width, height);
  } else if (mode === 'gradient') {
    renderGradient(ctx, width, height);
  } else if (mode === 'stripes') {
    renderStripes(ctx, width, height);
  } else if (mode === 'checkerboard') {
    renderCheckerboard(ctx, width, height);
  } else if (mode === 'diagonal-lines') {
    renderDiagonalLines(ctx, width, height);
  } else if (mode === 'dots') {
    renderDots(ctx, width, height);
  } else if (mode === 'grid') {
    renderGrid(ctx, width, height);
  } else if (mode === 'text') {
    renderText(ctx, width, height);
  } else if (mode === 'plain-color') {
    renderPlainColor(ctx, width, height, color);
  }

  return offscreen;
}

function canvasToBlobOrThrow(canvas, type, quality, failureMessage) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(failureMessage));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

export function createWeirdCanvas(options = {}) {
  const width = clampPositiveInt(options.width, 300);
  const height = clampPositiveInt(options.height, 10000);
  const mode = options.mode ?? 'canvas-noise';
  const color = typeof options.color === 'string' && options.color.trim() ? options.color : DEFAULT_COLOR;
  const mount = resolveMount(options.mount);

  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(
      `Unsupported mode "${mode}". Expected one of: ${Array.from(SUPPORTED_MODES).join(', ')}`
    );
  }

  if (shouldUseLightweightSurface(width, height)) {
    const lightweight = createLightweightStrip(width, height, mode, color);
    attachRenderMeta(lightweight, { width, height, mode, color, outputKind: 'lightweight' });
    mount.appendChild(lightweight);
    return lightweight;
  }

  const canvas = createBaseCanvas(width, height);
  const ctx = get2DContext(canvas);

  if (mode === 'canvas-noise') {
    renderNoise(ctx, width, height);
  } else if (mode === 'gradient') {
    renderGradient(ctx, width, height);
  } else if (mode === 'stripes') {
    renderStripes(ctx, width, height);
  } else if (mode === 'checkerboard') {
    renderCheckerboard(ctx, width, height);
  } else if (mode === 'diagonal-lines') {
    renderDiagonalLines(ctx, width, height);
  } else if (mode === 'dots') {
    renderDots(ctx, width, height);
  } else if (mode === 'grid') {
    renderGrid(ctx, width, height);
  } else if (mode === 'text') {
    renderText(ctx, width, height);
  } else if (mode === 'plain-color') {
    renderPlainColor(ctx, width, height, color);
  }

  attachRenderMeta(canvas, { width, height, mode, color, outputKind: 'canvas' });
  mount.appendChild(canvas);
  return canvas;
}

export async function downloadWeirdCanvasImage(
  element,
  { filename = 'weird-tall-canvas.jpg', type = 'image/jpeg', quality = 0.85 } = {}
) {
  const meta = readRenderMeta(element);
  if (!meta) {
    throw new Error('Element is missing render metadata. Re-render before exporting.');
  }

  if (element instanceof HTMLCanvasElement) {
    const blob = await canvasToBlobOrThrow(
      element,
      type,
      quality,
      'Failed to encode canvas to JPG blob.'
    );
    triggerBlobDownload(blob, filename);
    return;
  }

  try {
    const rasterCanvas = renderModeToCanvas({
      width: meta.width,
      height: meta.height,
      mode: meta.mode,
      color: meta.color ?? DEFAULT_COLOR
    });
    const blob = await canvasToBlobOrThrow(
      rasterCanvas,
      type,
      quality,
      `Failed to generate full-size JPG blob at ${meta.width}x${meta.height}.`
    );
    triggerBlobDownload(blob, filename);
  } catch (canvasError) {
    const offscreen = renderModeToOffscreenCanvas({
      width: meta.width,
      height: meta.height,
      mode: meta.mode,
      color: meta.color ?? DEFAULT_COLOR
    });
    if (!offscreen) {
      throw new Error(
        `Unable to export exact ${meta.width}x${meta.height} JPG in this browser/device memory budget.`
      );
    }
    try {
      const blob = await offscreen.convertToBlob({ type, quality });
      if (!blob) {
        throw new Error('Empty offscreen blob.');
      }
      triggerBlobDownload(blob, filename);
    } catch {
      throw new Error(
        `Unable to export exact ${meta.width}x${meta.height} JPG in this browser/device memory budget.`
      );
    }
  }
}

export function isWeirdCanvasDownloadable(element) {
  return Boolean(readRenderMeta(element));
}
