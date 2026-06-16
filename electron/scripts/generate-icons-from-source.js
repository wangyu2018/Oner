/**
 * Oner 图标生成脚本
 * 从源图生成全平台图标 (PWA + Electron)
 * 用法: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 源图路径
const SOURCE = process.argv[2] || path.join(__dirname, '..', '..', '..', 'tmp', 'AI-Migration', 'AI-Projects-Code', '套图er', 'Oner项目设计需求.png');

// 输出目录
const FRONTEND_ICONS = path.join(__dirname, '..', '..', 'frontend', 'public', 'icons');
const ELECTRON_ICONS = path.join(__dirname, '..', 'icons');

async function generateIcons() {
  console.log(`源图: ${SOURCE}`);

  if (!fs.existsSync(SOURCE)) {
    console.error('❌ 源图不存在:', SOURCE);
    process.exit(1);
  }

  // 读取源图元数据
  const meta = await sharp(SOURCE).metadata();
  console.log(`源图尺寸: ${meta.width}x${meta.height}`);

  // 裁剪底部水印区域 (约 15% 高度)
  const cropHeight = Math.floor(meta.height * 0.85);
  const cropWidth = meta.width;

  // 先提取无水印区域，再取正方形
  const minSide = Math.min(cropWidth, cropHeight);
  const offsetX = Math.floor((cropWidth - minSide) / 2);

  const square = sharp(SOURCE).extract({ left: offsetX, top: 0, width: minSide, height: minSide });

  // 确保输出目录存在
  [FRONTEND_ICONS, ELECTRON_ICONS].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // PWA 图标 (192, 512)
  const pwaSizes = [192, 512];
  for (const s of pwaSizes) {
    const outPath = path.join(FRONTEND_ICONS, `icon-${s}.png`);
    await square.clone().resize(s, s).png().toFile(outPath);
    console.log(`✅ PWA: ${outPath}`);
  }

  // Electron 图标 (16, 32, 48, 64, 128, 256, 512)
  const electronSizes = [16, 32, 48, 64, 128, 256, 512];
  for (const s of electronSizes) {
    const outPath = path.join(ELECTRON_ICONS, `icon-${s}.png`);
    await square.clone().resize(s, s).png().toFile(outPath);
    console.log(`✅ Electron: ${outPath}`);
  }

  // favicon.png (32x32)
  const faviconPng = path.join(ELECTRON_ICONS, 'favicon.png');
  await square.clone().resize(32, 32).png().toFile(faviconPng);
  console.log(`✅ favicon: ${faviconPng}`);

  // icon.png (512x512, 主图标)
  const mainPng = path.join(ELECTRON_ICONS, 'icon.png');
  await square.clone().resize(512, 512).png().toFile(mainPng);
  console.log(`✅ main: ${mainPng}`);

  console.log('\n🎉 全部图标生成完成！');
}

generateIcons().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});
