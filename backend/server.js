import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb, saveDb } from './src/db/index.js';
import { migrate } from './src/db/migrate.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { limiter } from './src/middleware/rateLimiter.js';
import notesRouter from './src/routes/notes.js';
import backupRouter from './src/routes/backup.js';
import authRouter from './src/routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/backup', backupRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
async function start() {
  try {
    await initDb();
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

start();
