import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { queryAll, queryOne, runQuery } from '../db/helpers.js';
import { chatCompletion, testConnection, getProviderList } from '../utils/aiProvider.js';
import { encryptVaultPassword, decryptVaultPassword } from '../utils/crypto.js';
import crypto from 'crypto';

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

const router = Router();
router.use(authMiddleware);

// 获取AI配置（解密API Key）
function getAIConfig(userId) {
  const row = queryOne('SELECT settings FROM user_settings WHERE user_id = ?', [userId]);
  if (!row) return null;
  try {
    const settings = JSON.parse(row.settings);
    const ai = settings.ai;
    if (!ai || !ai.apiKey) return null;
    return {
      provider: ai.provider || 'deepseek',
      apiKey: decryptVaultPassword(ai.apiKey) || ai.apiKey,
      model: ai.model || '',
      baseURL: ai.baseURL || '',
    };
  } catch { return null; }
}

// 构建笔记上下文prompt
function buildNoteContext(note) {
  return `当前笔记信息：
标题：${note.title || '无标题'}
内容：${note.content || ''}
状态：${note.status}
优先级：${note.priority}
标签：${note.tags || '无'}
分类：${note.category || '无'}`;
}

// 构建分类上下文prompt
function buildCategoryContext(userId, category) {
  const notes = queryAll(
    `SELECT title, content, status, priority, due_date, tags FROM notes
     WHERE user_id = ? AND deleted_at IS NULL AND category = ?
     ORDER BY updated_at DESC LIMIT 50`,
    [userId, category]
  );
  if (notes.length === 0) return `分类"${category}"下暂无笔记。`;
  return `分类"${category}"下的笔记（共${notes.length}条）：
${notes.map((n, i) => `${i+1}. [${n.status}] ${n.title || '无标题'} - ${(n.content || '').substring(0, 100)}${n.due_date ? ' (截止:' + n.due_date + ')' : ''}`).join('\n')}`;
}

// POST /api/ai/chat - 发送AI消息
router.post('/chat', async (req, res) => {
  try {
    const config = getAIConfig(req.user.id);
    if (!config) {
      return res.status(400).json({ success: false, error: '请先在设置中配置AI', code: 400 });
    }

    const { message, conversationId, contextType = 'global', contextId, stream = false } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: '消息不能为空', code: 400 });
    }

    // 加载或创建对话
    let conversation;
    let messages = [];
    if (conversationId) {
      conversation = queryOne('SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?', [conversationId, req.user.id]);
      if (conversation) messages = JSON.parse(conversation.messages);
    }

    // 构建system prompt
    let systemPrompt = '你是Oner智能助手，帮助用户管理待办和备忘。回复简洁实用，使用中文。';
    if (contextType === 'note' && contextId) {
      const note = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [contextId, req.user.id]);
      if (note) {
        note.tags = note.tags ? JSON.parse(note.tags).join(', ') : '';
        systemPrompt += '\n\n' + buildNoteContext(note);
      }
    } else if (contextType === 'category' && contextId) {
      systemPrompt += '\n\n' + buildCategoryContext(req.user.id, contextId);
    }

    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message },
    ];

    if (stream) {
      // 流式输出
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const aiStream = await chatCompletion({ ...config, messages: allMessages, stream: true });
      const reader = aiStream.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch {}
          }
        }
      } catch (streamErr) {
        console.error('Stream error:', streamErr.message);
      }

      res.write('data: [DONE]\n\n');
      res.end();

      // 保存对话
      messages.push({ role: 'user', content: message, timestamp: Date.now() });
      messages.push({ role: 'assistant', content: fullContent, timestamp: Date.now() });
      saveConversation(req.user.id, conversationId, contextType, contextId, messages, message);
    } else {
      // 非流式
      const reply = await chatCompletion({ ...config, messages: allMessages, stream: false });

      messages.push({ role: 'user', content: message, timestamp: Date.now() });
      messages.push({ role: 'assistant', content: reply, timestamp: Date.now() });
      const convId = saveConversation(req.user.id, conversationId, contextType, contextId, messages, message);

      res.json({ success: true, data: { reply, conversationId: convId } });
    }
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI请求失败', code: 500 });
  }
});

function saveConversation(userId, conversationId, contextType, contextId, messages, firstMessage) {
  const now = new Date().toISOString();
  if (conversationId) {
    runQuery(
      'UPDATE ai_conversations SET messages = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [JSON.stringify(messages), now, conversationId, userId]
    );
    return conversationId;
  } else {
    const id = generateId();
    const title = firstMessage.substring(0, 50);
    runQuery(
      'INSERT INTO ai_conversations (id, user_id, context_type, context_id, title, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, contextType, contextId || null, title, JSON.stringify(messages), now, now]
    );
    return id;
  }
}

// POST /api/ai/analyze - 分析笔记
router.post('/analyze', async (req, res) => {
  try {
    const config = getAIConfig(req.user.id);
    if (!config) return res.status(400).json({ success: false, error: '请先在设置中配置AI', code: 400 });

    const { noteId, action = 'decompose' } = req.body;
    const note = queryOne('SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [noteId, req.user.id]);
    if (!note) return res.status(404).json({ success: false, error: '笔记不存在', code: 404 });

    note.tags = note.tags ? JSON.parse(note.tags).join(', ') : '';

    const prompts = {
      decompose: `请分析以下笔记/待办，将其拆解为3-5个具体的可执行子任务。每个子任务用简洁的描述，适合直接创建为待办。

${buildNoteContext(note)}

请用JSON数组格式返回，每个元素包含 title 字段。只返回JSON，不要其他文字。`,
      recommend: `请分析以下笔记/待办，给出下一步行动建议。考虑截止日期、优先级、当前状态。

${buildNoteContext(note)}

请给出2-3条具体的行动建议，每条用一行说明。`,
      expand: `请根据以下笔记/待办的简要内容，帮我扩展完善。补充可能遗漏的要点、注意事项、所需资源等。

${buildNoteContext(note)}

请直接输出扩展后的内容（Markdown格式）。`,
    };

    const prompt = prompts[action] || prompts.decompose;
    const reply = await chatCompletion({
      ...config,
      messages: [
        { role: 'system', content: '你是Oner智能助手，帮助用户管理待办和备忘。回复简洁实用，使用中文。' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    });

    // 自动存储分析结果到对话历史
    try {
      const now = new Date().toISOString();
      const analyzeMessages = JSON.stringify([
        { role: 'user', content: `[${action}] 分析笔记: ${note.title || '无标题'}`, timestamp: Date.now() },
        { role: 'assistant', content: reply, timestamp: Date.now() },
      ]);
      const convId = generateId();
      const title = `[${action}] ${note.title?.substring(0, 30) || '笔记分析'}`;
      runQuery(
        'INSERT INTO ai_conversations (id, user_id, context_type, context_id, title, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [convId, req.user.id, 'note', noteId, title, analyzeMessages, now, now]
      );
    } catch (storeErr) {
      console.warn('Failed to store analyze result:', storeErr.message);
    }

    res.json({ success: true, data: { result: reply, action } });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI分析失败', code: 500 });
  }
});

// POST /api/ai/summarize - 总结分类
router.post('/summarize', async (req, res) => {
  try {
    const config = getAIConfig(req.user.id);
    if (!config) return res.status(400).json({ success: false, error: '请先在设置中配置AI', code: 400 });

    const { category } = req.body;
    if (!category) return res.status(400).json({ success: false, error: '请指定分类', code: 400 });

    const context = buildCategoryContext(req.user.id, category);

    const reply = await chatCompletion({
      ...config,
      messages: [
        { role: 'system', content: '你是Oner智能助手。请对用户的笔记/待办进行总结分析。使用中文，输出Markdown格式。' },
        { role: 'user', content: `请总结以下分类的笔记情况，包括：\n1. 整体概览\n2. 待办完成情况\n3. 关键信息提取\n4. 趋势或建议\n\n${context}` },
      ],
      stream: false,
    });

    res.json({ success: true, data: { summary: reply, category } });
  } catch (err) {
    console.error('AI summarize error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI总结失败', code: 500 });
  }
});

// POST /api/ai/classify - AI 自动分类
router.post('/classify', async (req, res) => {
  try {
    const config = getAIConfig(req.user.id);
    if (!config) return res.status(400).json({ success: false, error: '请先在设置中配置AI', code: 400 });

    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: '内容不能为空', code: 400 });

    // 获取用户所有分类
    const categories = queryAll(
      'SELECT name, color FROM categories WHERE user_id = ? ORDER BY position ASC, created_at ASC',
      [req.user.id]
    );

    const categoryNames = categories.map(c => c.name);
    if (categoryNames.length === 0) {
      return res.json({ success: true, data: { category: null, message: '暂无可用的分类' } });
    }

    const prompt = `请分析以下内容，从现有分类中选择最匹配的一个。

现有分类：${categoryNames.join('、')}

内容：${content}

请只返回分类名称（必须从现有分类中选择），如果无法匹配则返回"无匹配"。不要返回其他文字。`;

    const reply = await chatCompletion({
      ...config,
      messages: [
        { role: 'system', content: '你是一个智能分类助手。只返回分类名称，不要其他文字。' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    });

    const trimmed = reply.trim();
    const matched = categoryNames.includes(trimmed) ? trimmed : null;

    res.json({ success: true, data: { category: matched, raw: trimmed } });
  } catch (err) {
    console.error('AI classify error:', err);
    res.status(500).json({ success: false, error: err.message || 'AI分类失败', code: 500 });
  }
});

// GET /api/ai/conversations - 对话列表
router.get('/conversations', (req, res) => {
  const conversations = queryAll(
    'SELECT id, context_type, context_id, title, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json({ success: true, data: { conversations } });
});

// GET /api/ai/conversations/:id - 对话详情
router.get('/conversations/:id', (req, res) => {
  const conv = queryOne('SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!conv) return res.status(404).json({ success: false, error: '对话不存在', code: 404 });
  conv.messages = JSON.parse(conv.messages);
  res.json({ success: true, data: { conversation: conv } });
});

// DELETE /api/ai/conversations/:id - 删除对话
router.delete('/conversations/:id', (req, res) => {
  runQuery('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true, data: { deleted: true } });
});

// GET /api/ai/providers - 获取支持的提供商列表
router.get('/providers', (req, res) => {
  res.json({ success: true, data: { providers: getProviderList() } });
});

// POST /api/ai/test - 测试AI连接
router.post('/test', async (req, res) => {
  try {
    const { provider, apiKey, model, baseURL } = req.body;
    const result = await testConnection({ provider, apiKey, model, baseURL });
    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: true, data: { success: false, message: err.message } });
  }
});

export default router;
