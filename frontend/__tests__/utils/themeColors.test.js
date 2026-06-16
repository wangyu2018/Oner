import { describe, it, expect } from 'vitest';
import { hexToHsl, hslToHex, generateAccentPalette, generateSurfaceColors, paletteToCssVars, DEFAULT_ACCENT } from '../../src/utils/themeColors';

describe('themeColors', () => {
  it('TC-01: hexToHsl 转换 #6366f1', () => {
    const hsl = hexToHsl('#6366f1');
    expect(hsl.h).toBe(239);
    expect(hsl.l).toBe(67);
  });

  it('TC-02: hslToHex 返回有效 hex 格式', () => {
    const hex = hslToHex(239, 84, 67);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('TC-03: 生成完整调色板', () => {
    const palette = generateAccentPalette(239, 81, 67);
    expect(palette['50']).toBeDefined();
    expect(palette['500']).toBeDefined();
    expect(palette['900']).toBeDefined();
    expect(Object.keys(palette).length).toBe(10);
  });

  it('TC-04: 生成亮色主题表面颜色', () => {
    const surfaces = generateSurfaceColors(239, 81, 67, false);
    expect(surfaces.bg).toContain('97%');
    expect(surfaces.border).toContain('88%');
  });

  it('TC-05: 生成暗色主题表面颜色', () => {
    const surfaces = generateSurfaceColors(239, 81, 67, true);
    expect(surfaces.bg).toContain('5%');
    expect(surfaces.border).toContain('22%');
  });

  it('TC-06: paletteToCssVars 转换为 CSS 变量', () => {
    const palette = generateAccentPalette(239, 81, 67);
    const vars = paletteToCssVars(palette);
    expect(vars['--accent-500']).toBe('239 81% 67%');
    expect(vars['--accent-50']).toBeDefined();
  });
});
