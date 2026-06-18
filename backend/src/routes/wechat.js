import { Router } from 'express';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { queryAll, queryOne, runQuery } from '../db/helpers.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 所有推送接口都需要登录
router.use(authMiddleware);

// POST /api/wechat/subscribe - 保存用户订阅记录
// body: { template_id, remind_type, openid }
router.post('/subscribe', (req, res) => {
  try {
    const { template_id, remind_type = 'todo_due', openid } = req.body;
    if (!template_id || !openid) {
      return res.status(400).json({
        success: false,
        error: '缺少 template_id 或 openid',
        code: 400
      });
    }

    // 检查是否已存在相同订阅
    const existing = queryOne(
      'SELECT id FROM wechat_subscriptions WHERE user_id = ? AND template_id = ? AND remind_type = ?',
      [req.user.id, template_id, remind_type]
    );

    if (existing) {
      // 已存在则启用
      runQuery('UPDATE wechat_subscriptions SET enabled = 1, openid = ? WHERE id = ?',
        [openid, existing.id]);
      return res.json({ success: true, data: { id: existing.id, status: '已启用' } });
    }

    // 创建新订阅
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    runQuery(
      'INSERT INTO wechat_subscriptions (id, user_id, template_id, openid, remind_type) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, template_id, openid, remind_type]
    );

    res.status(201).json({ success: true, data: { id, status: '已订阅' } });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ success: false, error: '订阅失败', code: 500 });
  }
});

// GET /api/wechat/subscriptions - 获取用户的所有订阅
router.get('/subscriptions', (req, res) => {
  try {
    const subs = queryAll(
      'SELECT id, template_id, remind_type, enabled, created_at, last_sent_at FROM wechat_subscriptions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: { subscriptions: subs } });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ success: false, error: '获取失败', code: 500 });
  }
});

// PUT /api/wechat/subscriptions/:id - 启用/关闭订阅
router.put('/subscriptions/:id', (req, res) => {
  try {
    const { enabled } = req.body;
    const sub = queryOne(
      'SELECT id FROM wechat_subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!sub) {
      return res.status(404).json({ success: false, error: '订阅不存在', code: 404 });
    }
    runQuery('UPDATE wechat_subscriptions SET enabled = ? WHERE id = ?',
      [enabled ? 1 : 0, req.params.id]);
    res.json({ success: true, data: { id: req.params.id, enabled: !!enabled } });
  } catch (err) {
    console.error('Update subscription error:', err);
    res.status(500).json({ success: false, error: '更新失败', code: 500 });
  }
});

// DELETE /api/wechat/subscriptions/:id - 取消订阅
router.delete('/subscriptions/:id', (req, res) => {
  try {
    const sub = queryOne(
      'SELECT id FROM wechat_subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!sub) {
      return res.status(404).json({ success: false, error: '订阅不存在', code: 404 });
    }
    runQuery('DELETE FROM wechat_subscriptions WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: { message: '已取消订阅' } });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ success: false, error: '取消订阅失败', code: 500 });
  }
});

// ========================================
// 小程序码生成（带参，用于邀请溯源）
// ========================================

// GET /api/wechat/qrcode - 获取用户专属小程序码
router.get('/qrcode', async (req, res) => {
  try {
    const accessToken = await getWxAccessToken();
    if (!accessToken) {
      // 开发模式：返回占位图
      return res.json({
        success: true,
        data: { qrCodeUrl: '', message: 'WX_APPID 未配置，请在生产环境使用' }
      });
    }

    // 确保上传目录存在
    const uploadsDir = path.resolve(process.env.UPLOAD_DIR || path.join(import.meta.dirname, '../../uploads'));
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `qrcode_${req.user.id}.png`;
    const filepath = path.join(uploadsDir, filename);

    // 如果已生成过且文件存在，直接返回
    if (fs.existsSync(filepath)) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      return res.json({
        success: true,
        data: { qrCodeUrl: `${baseUrl}/uploads/${filename}` }
      });
    }

    // 调用微信 API 生成无限期小程序码
    // scene 最多 32 字符，用 user_id 作为溯源参数
    const scene = `u=${req.user.id}`;
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

    const payload = JSON.stringify({
      scene,
      page: 'pages/index/index',
      check_path: false, // 开发阶段关闭路径校验
      env_version: process.env.NODE_ENV === 'production' ? 'release' : 'trial',
      width: 280,
      auto_color: false,
      line_color: { r: 99, g: 102, b: 241 }, // 品牌色 #6366f1
      is_hyaline: false,
    });

    const buffer = await new Promise((resolve, reject) => {
      const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          // 微信返回错误时会返回 JSON，正常返回是图片二进制
          try {
            const errJson = JSON.parse(buf.toString('utf-8'));
            if (errJson.errcode) {
              reject(new Error(errJson.errmsg || '生成小程序码失败'));
              return;
            }
          } catch {
            // 不是 JSON，是正常的图片数据
          }
          resolve(buf);
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    // 保存文件
    fs.writeFileSync(filepath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({
      success: true,
      data: { qrCodeUrl: `${baseUrl}/uploads/${filename}` }
    });
  } catch (err) {
    console.error('Generate QR code error:', err);
    res.status(500).json({ success: false, error: err.message || '生成小程序码失败', code: 500 });
  }
});

// ========================================
// 微信推送核心函数（供内部定时任务调用）
// ========================================

/**
 * 获取微信接口调用凭据（access_token）
 * 缓存以避免重复请求（有效期 7200s，提前 5 分钟刷新）
 */
let cachedToken = null;
let tokenExpiresAt = 0;

async function getWxAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const appid = process.env.WX_APPID;
  const secret = process.env.WX_APPSECRET;

  if (!appid || !secret) {
    console.warn('[WeChat] WX_APPID / WX_APPSECRET 未配置，跳过推送');
    return null;
  }

  try {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;

    const token = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.access_token) {
              resolve(json.access_token);
            } else {
              reject(new Error(json.errmsg || '获取 access_token 失败'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    cachedToken = token;
    tokenExpiresAt = now + 7000 * 1000; // 提前 200s 刷新
    return token;
  } catch (err) {
    console.error('[WeChat] 获取 access_token 失败:', err.message);
    return null;
  }
}

/**
 * 发送微信订阅消息
 * @param {string} openid - 用户 openid
 * @param {string} templateId - 模板消息 ID
 * @param {object} data - 模板消息数据 { keyword1: { value: 'xxx' }, ... }
 * @param {string} page - 点击后跳转的小程序页面路径
 */
export async function sendTemplateMessage(openid, templateId, data, page = 'pages/index/index') {
  const accessToken = await getWxAccessToken();
  if (!accessToken) {
    console.warn('[WeChat] 无 access_token，无法发送消息');
    return false;
  }

  try {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

    const payload = JSON.stringify({
      touser: openid,
      template_id: templateId,
      page,
      data,
      miniprogram_state: 'formal',
      lang: 'zh_CN'
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (result.errcode === 0) {
      return true;
    } else {
      console.warn('[WeChat] 发送订阅消息失败:', result.errmsg);
      return false;
    }
  } catch (err) {
    console.error('[WeChat] 发送消息异常:', err.message);
    return false;
  }
}

/**
 * 检查待办到期并发送推送
 * 可被定时任务（setInterval / cron）调用
 */
export async function checkAndSendReminders() {
  const appid = process.env.WX_APPID;
  if (!appid) {
    return; // 未配置微信，跳过
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // 查询今天到期的待办 + 已过期的待办（最多 3 天内）
  const dueNotes = queryAll(
    `SELECT n.id, n.title, n.due_date, n.priority, s.openid, s.template_id, s.id AS sub_id
     FROM notes n
     JOIN wechat_subscriptions s ON s.user_id = n.user_id AND s.remind_type = 'todo_due' AND s.enabled = 1
     WHERE n.deleted_at IS NULL
       AND n.status IN ('todo', 'in_progress')
       AND n.due_date IS NOT NULL
       AND n.due_date <= ?
       AND (s.last_sent_at IS NULL OR s.last_sent_at < n.updated_at)
     ORDER BY n.due_date ASC`,
    [today]
  );

  if (dueNotes.length === 0) return;

  console.log(`[WeChat] 发现 ${dueNotes.length} 条待办需要推送提醒`);

  let sentCount = 0;
  for (const note of dueNotes) {
    const isOverdue = note.due_date < today;
    const statusLabel = isOverdue ? '已过期' : '今天到期';

    const success = await sendTemplateMessage(
      note.openid,
      note.template_id,
      {
        thing1: { value: note.title?.substring(0, 20) || '未命名待办' },
        date2: { value: note.due_date },
        thing3: { value: statusLabel },
        thing4: { value: `优先级: ${note.priority || 'normal'}` }
      },
      'pages/notes/index'
    );

    if (success) {
      runQuery("UPDATE wechat_subscriptions SET last_sent_at = datetime('now') WHERE id = ?", [note.sub_id]);
      sentCount++;
    }
  }

  console.log(`[WeChat] 推送完成: 成功 ${sentCount}/${dueNotes.length}`);
}

/**
 * 备忘回执推送：当用户完成备忘时发送通知
 * @param {string} userId - 用户 ID
 * @param {string} memoTitle - 备忘标题
 */
export async function sendMemoReceipt(userId, memoTitle) {
  const appid = process.env.WX_APPID;
  if (!appid) return;

  // 查找订阅了 memo_done 类型的用户记录
  const subs = queryAll(
    `SELECT s.openid, s.template_id, s.id AS sub_id
     FROM wechat_subscriptions s
     WHERE s.user_id = ? AND s.remind_type = 'memo_done' AND s.enabled = 1`,
    [userId]
  );

  if (subs.length === 0) return;

  console.log(`[WeChat] 备忘回执推送: userId=${userId}, memo=${memoTitle}`);

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  for (const sub of subs) {
    const success = await sendTemplateMessage(
      sub.openid,
      sub.template_id,
      {
        thing1: { value: (memoTitle || '未命名备忘').substring(0, 20) },
        time2: { value: now },
        thing3: { value: '已完成' },
      },
      'pages/memos/index'
    );

    if (success) {
      runQuery("UPDATE wechat_subscriptions SET last_sent_at = datetime('now') WHERE id = ?", [sub.sub_id]);
    }
  }
}

/**
 * 每日汇总推送：每天推送用户今日统计
 * 在每天早上 9:00 由定时任务触发
 */
export async function checkAndSendDailySummary() {
  const appid = process.env.WX_APPID;
  if (!appid) return;

  const today = new Date().toISOString().slice(0, 10);

  // 查询订阅了 daily_summary 的用户
  const subs = queryAll(
    `SELECT s.id AS sub_id, s.openid, s.template_id, s.user_id
     FROM wechat_subscriptions s
     WHERE s.remind_type = 'daily_summary' AND s.enabled = 1`
  );

  if (subs.length === 0) return;

  console.log(`[WeChat] 每日汇总: 发现 ${subs.length} 位用户需要推送`);

  let sentCount = 0;
  for (const sub of subs) {
    // 统计用户今日数据
    const noteCount = queryOne(
      `SELECT COUNT(*) AS cnt FROM notes
       WHERE user_id = ? AND deleted_at IS NULL
         AND date(created_at) = ?`,
      [sub.user_id, today]
    )?.cnt || 0;

    const todoCount = queryOne(
      `SELECT COUNT(*) AS cnt FROM notes
       WHERE user_id = ? AND deleted_at IS NULL
         AND status IN ('todo', 'in_progress')`,
      [sub.user_id]
    )?.cnt || 0;

    const doneCount = queryOne(
      `SELECT COUNT(*) AS cnt FROM notes
       WHERE user_id = ? AND deleted_at IS NULL
         AND status = 'done'
         AND date(updated_at) = ?`,
      [sub.user_id, today]
    )?.cnt || 0;

    const summaryText = `今日新建${noteCount}篇，待办${todoCount}个，完成${doneCount}个`;

    const success = await sendTemplateMessage(
      sub.openid,
      sub.template_id,
      {
        date1: { value: today },
        thing2: { value: summaryText.substring(0, 20) },
        thing3: { value: '点击查看今日效率报告' },
      },
      'pages/index/index'
    );

    if (success) {
      runQuery("UPDATE wechat_subscriptions SET last_sent_at = datetime('now') WHERE id = ?", [sub.sub_id]);
      sentCount++;
    }
  }

  console.log(`[WeChat] 每日汇总推送完成: 成功 ${sentCount}/${subs.length}`);
}

export default router;
