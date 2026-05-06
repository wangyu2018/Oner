import React, { useState, useRef, useCallback } from 'react';
import { Palette, Upload, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useThemeContext } from '../App';
import { extractDominantColors } from '../utils/colorExtractor';
import { hslToHex } from '../utils/themeColors';

const PRESET_COLORS = [
  { hex: '#3b82f6', label: '蓝色' },
  { hex: '#8b5cf6', label: '紫色' },
  { hex: '#10b981', label: '绿色' },
  { hex: '#f59e0b', label: '橙色' },
  { hex: '#ef4444', label: '红色' },
  { hex: '#ec4899', label: '粉色' },
  { hex: '#06b6d4', label: '青色' },
  { hex: '#6366f1', label: '靛色' },
];

export default function ThemeCustomizer() {
  const { customTheme, isDark } = useThemeContext();
  const {
    config, setAccentColor, setAccentFromImage,
    setWallpaper, setApplyToSurfaces,
    setWallpaperBlur, setWallpaperOpacity, resetTheme,
  } = customTheme;

  const [extractedColors, setExtractedColors] = useState([]);
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const colors = await setAccentFromImage(file);
      setExtractedColors(colors || []);
    } catch (err) {
      console.error('Color extraction failed:', err);
    }
  }, [setAccentFromImage]);

  const handleWallpaperUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await setWallpaper(file);
      setWallpaperPreview(URL.createObjectURL(file));
    } catch (err) {
      console.error('Wallpaper upload failed:', err);
    }
  }, [setWallpaper]);

  const handleRemoveWallpaper = useCallback(async () => {
    await setWallpaper(null);
    setWallpaperPreview(null);
  }, [setWallpaper]);

  const handleReset = useCallback(() => {
    setExtractedColors([]);
    setWallpaperPreview(null);
    resetTheme();
  }, [resetTheme]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">外观设置</h2>

      {/* 预设色板 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          主题色
        </label>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => setAccentColor(color.hex)}
              className={`w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95 ${
                config.accentHex === color.hex
                  ? 'ring-2 ring-offset-2 ring-accent dark:ring-offset-gray-800'
                  : 'ring-1 ring-gray-300 dark:ring-gray-600'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* 自定义颜色 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          自定义颜色
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.accentHex}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {config.accentHex}
          </span>
        </div>
      </div>

      {/* 图片主题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          从图片提取主题色
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600
            rounded-xl p-6 text-center cursor-pointer
            hover:border-accent hover:bg-accent/5 transition-colors"
        >
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            点击上传图片，自动提取主色调
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* 提取的颜色预览 */}
        {extractedColors.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              点击色块应用
            </p>
            <div className="flex gap-2">
              {extractedColors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setAccentColor(color.hex)}
                  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                    config.accentHex === color.hex
                      ? 'ring-2 ring-offset-1 ring-accent dark:ring-offset-gray-800'
                      : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 应用到背景 */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">应用到背景和边框</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            将主题色应用到页面背景、卡片和边框
          </p>
        </div>
        <button
          onClick={() => setApplyToSurfaces(!config.applyToSurfaces)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.applyToSurfaces ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              config.applyToSurfaces ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* 背景壁纸 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            背景壁纸
          </label>
          {config.wallpaper && (
            <button
              onClick={handleRemoveWallpaper}
              className="text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              移除壁纸
            </button>
          )}
        </div>

        {!config.wallpaper ? (
          <div
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleWallpaperUpload({ target: { files: [file] } });
                }
              };
              input.click();
            }}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600
              rounded-xl p-4 text-center cursor-pointer
              hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <ImageIcon size={20} className="mx-auto mb-1 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">上传背景图片</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 壁纸滑块 */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                模糊度: {config.wallpaperBlur}px
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={config.wallpaperBlur}
                onChange={(e) => setWallpaperBlur(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">
                不透明度: {config.wallpaperOpacity}%
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={config.wallpaperOpacity}
                onChange={(e) => setWallpaperOpacity(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>
        )}
      </div>

      {/* 重置 */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5
          border border-gray-300 dark:border-gray-600 rounded-lg
          text-sm font-medium text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <RotateCcw size={16} />
        重置为默认主题
      </button>
    </div>
  );
}
