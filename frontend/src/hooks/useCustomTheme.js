import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DEFAULT_ACCENT,
  hexToHsl,
  generateAccentPalette,
  generateSurfaceColors,
} from '../utils/themeColors';
import { extractDominantColors, imageToDataUrl } from '../utils/colorExtractor';

const STORAGE_KEY = 'custom-theme';

/**
 * Read initial config from localStorage.
 */
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Build default config based on whether user has set a custom theme before.
 */
function defaultConfig() {
  return {
    accentHex: DEFAULT_ACCENT.hex,
    accentH: DEFAULT_ACCENT.h,
    accentS: DEFAULT_ACCENT.s,
    accentL: DEFAULT_ACCENT.l,
    accentPalette: generateAccentPalette(
      DEFAULT_ACCENT.h, DEFAULT_ACCENT.s, DEFAULT_ACCENT.l
    ),
    source: 'default',
    applyToSurfaces: false,
    wallpaper: false,
    wallpaperBlur: 20,
    wallpaperOpacity: 30,
  };
}

/**
 * Apply CSS variables to document root from a config object.
 */
function applyThemeVars(config, isDark) {
  const root = document.documentElement;
  const palette = config.accentPalette;

  // Accent shades
  for (const [shade, value] of Object.entries(palette)) {
    root.style.setProperty(`--accent-${shade}`, value);
  }

  // Surface colors (if enabled)
  if (config.applyToSurfaces) {
    const surfaces = generateSurfaceColors(
      config.accentH, config.accentS, config.accentL, isDark
    );
    // We could set surface bg/border vars here if needed
  }

  // Wallpaper
  const wallpaperKey = 'custom-theme-wallpaper';
  if (config.wallpaper) {
    try {
      const img = localStorage.getItem(wallpaperKey);
      if (img) {
        root.dataset.wallpaper = 'true';
        root.style.setProperty('--wallpaper', `url(${img})`);
        root.style.setProperty('--wallpaper-blur', `${config.wallpaperBlur}px`);
        root.style.setProperty('--wallpaper-opacity', String(config.wallpaperOpacity / 100));
      }
    } catch {}
  } else {
    delete root.dataset.wallpaper;
    root.style.removeProperty('--wallpaper');
  }
}

export function useCustomTheme(isDark) {
  const [config, setConfig] = useState(() => {
    return loadConfig() || defaultConfig();
  });
  const prevConfigRef = useRef(null);

  // Apply CSS vars whenever config or dark mode changes
  useEffect(() => {
    const prev = prevConfigRef.current;
    const changed =
      JSON.stringify(prev) !== JSON.stringify(config) ||
      prev?.isDark !== isDark;
    if (changed) {
      applyThemeVars(config, isDark);
      prevConfigRef.current = { ...config, isDark };
    }
  }, [config, isDark]);

  // Persist to localStorage
  useEffect(() => {
    const toSave = { ...config };
    delete toSave.wallpaper; // wallpaper handles separately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [config]);

  const setAccentColor = useCallback((hex) => {
    const { h, s, l } = hexToHsl(hex);
    const palette = generateAccentPalette(h, s, l);
    setConfig(prev => ({
      ...prev,
      accentHex: hex,
      accentH: h,
      accentS: s,
      accentL: l,
      accentPalette: palette,
      source: 'color',
    }));
  }, []);

  const setAccentFromImage = useCallback(async (file) => {
    const colors = await extractDominantColors(file, 5);
    if (colors.length > 0) {
      const { h, s, l, hex } = colors[0];
      const palette = generateAccentPalette(h, s, l);
      setConfig(prev => ({
        ...prev,
        accentHex: hex,
        accentH: h,
        accentS: s,
        accentL: l,
        accentPalette: palette,
        source: 'image',
      }));
    }
    return colors; // return all extracted colors for UI preview
  }, []);

  const setWallpaper = useCallback(async (file) => {
    if (!file) {
      localStorage.removeItem('custom-theme-wallpaper');
      setConfig(prev => ({ ...prev, wallpaper: false }));
      return;
    }
    const dataUrl = await imageToDataUrl(file);
    localStorage.setItem('custom-theme-wallpaper', dataUrl);
    setConfig(prev => ({ ...prev, wallpaper: true }));
  }, []);

  const setApplyToSurfaces = useCallback((val) => {
    setConfig(prev => ({ ...prev, applyToSurfaces: val }));
  }, []);

  const setWallpaperBlur = useCallback((val) => {
    setConfig(prev => ({ ...prev, wallpaperBlur: val }));
  }, []);

  const setWallpaperOpacity = useCallback((val) => {
    setConfig(prev => ({ ...prev, wallpaperOpacity: val }));
  }, []);

  const resetTheme = useCallback(() => {
    localStorage.removeItem('custom-theme-wallpaper');
    setConfig(defaultConfig());
  }, []);

  return {
    config,
    setAccentColor,
    setAccentFromImage,
    setWallpaper,
    setApplyToSurfaces,
    setWallpaperBlur,
    setWallpaperOpacity,
    resetTheme,
  };
}
