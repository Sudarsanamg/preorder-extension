// utils/color.ts
export function hsbToHex({ hue, saturation, brightness }: { hue: number; saturation: number; brightness: number }) {
  const chroma = brightness * saturation;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0, g = 0, b = 0;

  if (0 <= huePrime && huePrime < 1) {
    r = chroma; g = x; b = 0;
  } else if (1 <= huePrime && huePrime < 2) {
    r = x; g = chroma; b = 0;
  } else if (2 <= huePrime && huePrime < 3) {
    r = 0; g = chroma; b = x;
  } else if (3 <= huePrime && huePrime < 4) {
    r = 0; g = x; b = chroma;
  } else if (4 <= huePrime && huePrime < 5) {
    r = x; g = 0; b = chroma;
  } else if (5 <= huePrime && huePrime < 6) {
    r = chroma; g = 0; b = x;
  }

  const m = brightness - chroma;
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function hexToHsb(hex: string) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : delta / max;
  const brightness = max;

  return { hue, saturation, brightness };
}
