# 图标生成指南

## 需要的图标格式

1. **icon.png** - 512x512 像素 PNG 格式
2. **icon.ico** - Windows ICO 格式（包含 16x16, 32x32, 48x48, 256x256）
3. **icon.icns** - macOS ICNS 格式

## 快速生成方法

### 方法一：使用在线工具（推荐）

1. 准备一个 512x512 的 PNG 图标
2. 访问 https://www.icoconverter.com/
   - 上传 PNG 文件
   - 选择 "ICO for Windows 7, 8, 10 and above"
   - 勾选所有尺寸
   - 点击 "Convert"
   - 下载生成的 ICO 文件

3. 访问 https://cloudconvert.com/png-to-icns
   - 上传 PNG 文件
   - 转换为 ICNS 格式
   - 下载生成的 ICNS 文件

### 方法二：使用 Node.js 脚本

```bash
# 安装图标生成工具
npm install -g electron-icon-maker

# 从 PNG 生成所有格式
electron-icon-maker --input=./your-icon.png --output=./icons
```

## 图标设计建议

- 使用简洁的设计，易于识别
- 确保在小尺寸（16x16）下仍然清晰
- 使用与应用主题一致的颜色
- 避免过多细节

## 临时图标

如果暂时没有图标，可以：
1. 使用系统默认图标
2. 从 https://icons8.com/ 下载免费图标
3. 使用文字作为图标（如 "O"）

## 文件放置位置

将生成的图标文件放在 `electron/icons/` 目录下：

```
electron/
└── icons/
    ├── icon.png
    ├── icon.ico
    └── icon.icns
```
