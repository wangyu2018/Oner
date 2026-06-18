import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';
import path from 'path';
import { initDb, closeDb, getDb } from './src/db/index.js';
import { migrate } from './src/db/migrate.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { limiter } from './src/middleware/rateLimiter.js';
import BackendPluginLoader from './src/utils/pluginLoader.js';
import notesRouter from './src/routes/notes.js';
import backupRouter from './src/routes/backup.js';
import authRouter from './src/routes/auth.js';
import remindersRouter from './src/routes/reminders.js';
import categoriesRouter from './src/routes/categories.js';
import searchRouter from './src/routes/search.js';
import settingsRouter from './src/routes/settings.js';
import passwordsRouter from './src/routes/passwords.js';
import filesRouter from './src/routes/files.js';
import aiRouter from './src/routes/ai.js';
import wechatRouter, { checkAndSendReminders, checkAndSendDailySummary, sendMemoReceipt } from './src/routes/wechat.js';
import createPluginsRouter from './src/routes/plugins.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 插件加载器（提前声明，start() 中注入 db）
const pluginLoader = new BackendPluginLoader(app, null);

// 验证 JWT_SECRET 是否已设置（拒绝空值和已知的默认值）
const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_SECRET = 'oner-secret-key-change-in-production';
if (!JWT_SECRET) {
  console.error('❌  JWT_SECRET 环境变量未设置，服务无法启动');
  console.error('   请设置一个强密码作为 JWT_SECRET，例如：');
  console.error(`   node -e "require('crypto').randomBytes(32).toString('hex').then(console.log)"`);
  process.exit(1);
}
if (JWT_SECRET === DEFAULT_SECRET) {
  console.error('❌  JWT_SECRET 使用了已知的默认值，此值不安全！');
  console.error('   请修改 JWT_SECRET 为一个随机生成的强密码');
  process.exit(1);
}
console.log('✅  JWT_SECRET 已配置');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(compression()); // gzip 压缩（大 payload 减少 60-80% 传输量）
app.use(limiter);

// 请求日志
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: (req) => req.url === '/api/health' || req.url.startsWith('/uploads/')
}));

// Trust proxy (for rate limiting behind nginx/reverse proxy)
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/backup', backupRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/search', searchRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/passwords', passwordsRouter);
app.use('/api/files', filesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/wechat', wechatRouter);
app.use('/api/plugins', createPluginsRouter(pluginLoader)); // 插件市场 API

// 静态文件服务（上传文件访问，强制下载防止内联执行）
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || path.join(import.meta.dirname, 'uploads'));
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 插件状态 API（动态列表）
app.get('/api/plugins', (req, res) => {
  res.json({
    plugins: pluginLoader.getInstalled(),
    kernel: {
      version: '1.0.0',
      eventBus: true,
      pluginRouter: true,
      pluginShell: true,
      commandBar: true,
    }
  });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function start() {
  try {
    initDb();
    migrate();
    console.log('Database initialized');

    // 初始化插件系统
    pluginLoader.db = getDb();
    const pluginCount = await pluginLoader.loadAll();
    console.log(`\u{1F50C} Plugin system ready: ${pluginCount} plugins loaded`);

    app.listen(PORT, () => {
      console.log(`Oner backend running on port ${PORT}`);

      // 启动微信推送定时任务（使用 node-cron，支持时区 + 错误隔离）
      if (process.env.WX_APPID) {
        // 每 10 分钟检查待办提醒
        cron.schedule('*/10 * * * *', () => {
          checkAndSendReminders().catch(err =>
            console.error('[Cron] 待办提醒任务失败:', err.message)
          );
        }, { timezone: 'Asia/Shanghai' });
        console.log('\u{23F0} WeChat reminder scheduler started (cron: */10 * * * *, TZ: Asia/Shanghai)');

        // 每天 9:00 推送汇总
        cron.schedule('0 9 * * *', () => {
          checkAndSendDailySummary().catch(err =>
            console.error('[Cron] 每日汇总任务失败:', err.message)
          );
        }, { timezone: 'Asia/Shanghai' });
        console.log('\u{1F4CA} WeChat daily summary scheduler started (cron: 0 9 * * *, TZ: Asia/Shanghai)');

        // 启动后立即执行一次
        setTimeout(() => checkAndSendReminders().catch(console.error), 5000);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => { console.log('\nShutting down...'); closeDb(); process.exit(); });
process.on('SIGTERM', () => { closeDb(); process.exit(); });

start();
