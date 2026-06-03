import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { queryOne, runQuery } from '../db/helpers.js';
import { encryptVaultPassword, decryptVaultPassword } from '../utils/crypto.js';

const router = Router();

router.use(authMiddleware);

// GET /api/settings - 获取当前用户的所有设置
router.get('/', (req, res) => {
  try {
    const row = queryOne(
      'SELECT settings FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );
    const settings = row ? JSON.parse(row.settings) : {};

    // AI API Key不返回明文，只返回是否有key
    if (settings.ai) {
      settings.ai = {
        ...settings.ai,
        hasKey: !!settings.ai.apiKey,
        apiKey: undefined,
      };
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, error: '获取设置失败', code: 500 });
  }
});

// PUT /api/settings - 更新设置
router.put('/', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: '设置格式无效', code: 400 });
    }

    // AI API Key加密存储
    if (settings.ai?.apiKey && typeof settings.ai.apiKey === 'string' && settings.ai.apiKey !== '********') {
      settings.ai.apiKey = encryptVaultPassword(settings.ai.apiKey);
    }
    // apiKey为undefined时表示不更新，保持原值
    if (settings.ai && settings.ai.apiKey === undefined) {
      delete settings.ai.apiKey;
    }

    // 获取现有设置并合并
    const existing = queryOne(
      'SELECT settings FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );
    const merged = existing
      ? { ...JSON.parse(existing.settings), ...settings }
      : settings;

    // 深合并AI设置
    if (settings.ai && existing) {
      const existingSettings = JSON.parse(existing.settings);
      if (existingSettings.ai) {
        merged.ai = { ...existingSettings.ai, ...settings.ai };
      }
    }

    runQuery(
      `INSERT INTO user_settings (user_id, settings, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET settings = ?, updated_at = datetime('now')`,
      [req.user.id, JSON.stringify(merged), JSON.stringify(merged)]
    );

    // 返回时隐藏API Key
    if (merged.ai) {
      merged.ai = { ...merged.ai, hasKey: !!merged.ai.apiKey, apiKey: undefined };
    }

    res.json({ success: true, data: merged });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ success: false, error: '更新设置失败', code: 500 });
  }
});

export default router;
