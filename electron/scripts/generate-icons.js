const fs = require('fs');
const path = require('path');

// 创建一个简单的 SVG 图标
function createSVGIcon(size) {
  const padding = size * 0.15;
  const borderRadius = size * 0.2;
  const fontSize = size * 0.45;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00000033"/>
    </filter>
  </defs>

  <!-- 背景圆角矩形 -->
  <rect
    x="${padding}"
    y="${padding}"
    width="${size - padding * 2}"
    height="${size - padding * 2}"
    rx="${borderRadius}"
    ry="${borderRadius}"
    fill="url(#grad)"
    filter="url(#shadow)"
  />

  <!-- 文字 "O" -->
  <text
    x="${size / 2}"
    y="${size / 2}"
    font-family="Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
  >O</text>

  <!-- 装饰线条 -->
  <line
    x1="${size * 0.3}"
    y1="${size * 0.7}"
    x2="${size * 0.7}"
    y2="${size * 0.7}"
    stroke="white"
    stroke-width="2"
    stroke-linecap="round"
    opacity="0.6"
  />
</svg>`;
}

// 将 SVG 转换为 PNG（需要 canvas 库，这里生成 SVG 作为占位）
function generateIcons() {
  const iconsDir = path.join(__dirname, '../icons');

  // 确保目录存在
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 生成不同尺寸的 SVG
  const sizes = [16, 32, 48, 64, 128, 256, 512];

  sizes.forEach(size => {
    const svg = createSVGIcon(size);
    const filename = `icon-${size}.svg`;
    fs.writeFileSync(path.join(iconsDir, filename), svg);
    console.log(`Generated: ${filename}`);
  });

  // 生成主图标
  const mainSvg = createSVGIcon(512);
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), mainSvg);
  console.log('Generated: icon.svg');

  // 生成 favicon
  const faviconSvg = createSVGIcon(32);
  fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg);
  console.log('Generated: favicon.svg');

  console.log('\n图标生成完成！');
  console.log('\n注意：');
  console.log('1. SVG 文件已生成在 electron/icons/ 目录');
  console.log('2. 如需 ICO/ICNS 格式，请使用在线转换工具：');
  console.log('   - https://www.icoconverter.com/');
  console.log('   - https://cloudconvert.com/svg-to-icns');
  console.log('3. 或安装 sharp 库自动转换：npm install sharp');
}

generateIcons();
