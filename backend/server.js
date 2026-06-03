import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { initDb, closeDb } from './src/db/index.js';
import { migrate } from './src/db/migrate.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { limiter } from './src/middleware/rateLimiter.js';
import notesRouter from './src/routes/notes.js';
import backupRouter from './src/routes/backup.js';
import authRouter from './src/routes/auth.js';
import remindersRouter from './src/routes/reminders.js';
import categoriesRouter from './src/routes/categories.js';
import searchRouter from './src/routes/search.js';
import settingsRouter from './src/routes/settings.js';
import passwordsRouter from './src/routes/passwords.js';
import filesRouter from './src/routes/files.js';

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(limiter);

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

// 静态文件服务（上传文件访问）
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || path.join(import.meta.dirname, 'uploads'));
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
function start() {
  try {
    initDb();
    migrate();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Oner backend running on port ${PORT}`);
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
