/**
 * Color conversion and palette generation utilities.
 * All functions work with HSL values as {h, s, l} where:
 *   h: 0-360, s: 0-100, l: 0-100
 */

export const DEFAULT_ACCENT = { h: 240, s: 81, l: 67, hex: '#6366f1' };

/**
 * Lightness targets for each accent shade (50–900).
 * These map to the standard Tailwind blue palette.
 */
const LIGHTNESS_MAP = {
  50: 97, 100: 93, 200: 85, 300: 75, 400: 65,
  500: null, // base lightness (dynamic)
  600: -8,   // offset from base
  700: -16,
  800: -24,
  900: -32,
};

export function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  } else {
    s = 0;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generate complete accent palette (50–900) from a base HSL color.
 * Returns a record of shade -> "H S% L%" for CSS variables.
 */
export function generateAccentPalette(h, s, l) {
  const palette = {};
  const safeS = s < 10 ? 40 : s; // boost weak saturation

  for (const [shade, target] of Object.entries(LIGHTNESS_MAP)) {
    let lightness;
    if (shade === '500') {
      lightness = l;
    } else if (target > 50) {
      // Fixed lightness for light shades
      lightness = target;
    } else {
      // Offset from base for dark shades
      lightness = Math.max(5, l + target);
    }
    palette[shade] = `${h} ${safeS}% ${lightness}%`;
  }
  return palette;
}

/**
 * Generate surface/border colors derived from the accent.
 */
export function generateSurfaceColors(h, s, l, isDark) {
  if (isDark) {
    return {
      bg:   `${h} 8% 5%`,
      surface: `${h} 10% 13%`,
      border:  `${h} 10% 22%`,
    };
  }
  return {
    bg:   `${h} 10% 97%`,
    surface: `${h} 12% 99%`,
    border:  `${h} 10% 88%`,
  };
}

/**
 * Convert a palette record to CSS variable entries.
 * Useful for applying theme via script.
 */
export function paletteToCssVars(palette) {
  const vars = {};
  for (const [shade, value] of Object.entries(palette)) {
    vars[`--accent-${shade}`] = value;
  }
  return vars;
}
