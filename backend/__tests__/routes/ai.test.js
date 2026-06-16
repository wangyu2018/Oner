// Mock AI provider before any imports
vi.mock('../../src/utils/aiProvider.js', () => ({
  chatCompletion: vi.fn(),
  testConnection: vi.fn(),
  getProviderList: () => [
    { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat'], defaultModel: 'deepseek-chat' },
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o'], defaultModel: 'gpt-4o-mini' },
    { id: 'ollama', name: 'Ollama (\u672c\u5730)', models: ['qwen2.5'], defaultModel: 'qwen2.5' },
    { id: 'lmstudio', name: 'LM Studio (\u672c\u5730)', models: [], defaultModel: 'llama-3.2-3b' },
    { id: 'custom', name: '\u81ea\u5b9a\u4e49', models: [], defaultModel: '' },
  ],
  getProviderDefaults: () => ({ baseURL: '', defaultModel: '' }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDb, teardownTestDb, createTestUser } from '../helpers/db.js';

describe('AI Routes', () => {
  let app;
  let testUser;
  let testToken;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
    process.env.PASSWORD_VAULT_KEY = 'test-vault-key-for-testing-only';
    setupTestDb();
    app = express();
    app.use(express.json());
    const { default: aiRouter } = await import('../../src/routes/ai.js');
    app.use('/api/ai', aiRouter);

    vi.clearAllMocks();

    const result = await createTestUser({ username: 'aiuser' });
    testUser = result.user;
    testToken = result.token;
  });

  afterEach(() => {
    teardownTestDb();
  });

  function auth() {
    return { Authorization: `Bearer ${testToken}` };
  }

  /** 为测试用户配置 AI 设置 */
  async function setupAIConfig(userId) {
    const { runQuery } = await import('../../src/db/helpers.js');
    const { encryptVaultPassword } = await import('../../src/utils/crypto.js');
    const encryptedKey = encryptVaultPassword('sk-test-key');
    runQuery(
      "INSERT INTO user_settings (user_id, settings) VALUES (?, ?)",
      [userId, JSON.stringify({ ai: { provider: 'deepseek', apiKey: encryptedKey, model: 'deepseek-chat' } })]
    );
  }

  describe('POST /api/ai/chat', () => {
    it('AI-01: 未配置AI返回 400', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set(auth())
        .send({ message: '你好' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('配置');
    });

    it('AI-02: 消息为空返回 400', async () => {
      await setupAIConfig(testUser.id);
      const res = await request(app)
        .post('/api/ai/chat')
        .set(auth())
        .send({ message: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('不能为空');
    });

    it('AI-03: 非流式聊天成功', async () => {
      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      chatCompletion.mockResolvedValue('你好！我是AI助手，有什么可以帮助你的吗？');

      await setupAIConfig(testUser.id);
      const res = await request(app)
        .post('/api/ai/chat')
        .set(auth())
        .send({ message: '你好', stream: false });
      expect(res.status).toBe(200);
      expect(res.body.data.reply).toContain('你好');
      expect(res.body.data.conversationId).toBeDefined();
    });

    it('AI-04: 使用已有 conversationId', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      chatCompletion.mockResolvedValue('回复消息');

      await setupAIConfig(testUser.id);
      runQuery(
        "INSERT INTO ai_conversations (id, user_id, title, messages) VALUES ('conv1', ?, '测试对话', '[]')",
        [testUser.id]
      );

      const res = await request(app)
        .post('/api/ai/chat')
        .set(auth())
        .send({ message: '继续', conversationId: 'conv1', stream: false });
      expect(res.status).toBe(200);
      expect(res.body.data.conversationId).toBe('conv1');
    });
  });

  describe('POST /api/ai/analyze', () => {
    it('AI-05: 未配置AI返回 400', async () => {
      const res = await request(app)
        .post('/api/ai/analyze')
        .set(auth())
        .send({ noteId: 'n1' });
      expect(res.status).toBe(400);
    });

    it('AI-06: 笔记不存在返回 404', async () => {
      await setupAIConfig(testUser.id);
      const res = await request(app)
        .post('/api/ai/analyze')
        .set(auth())
        .send({ noteId: 'nonexistent' });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('不存在');
    });

    it('AI-07: 分析笔记成功', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      chatCompletion.mockResolvedValue('[{"title":"子任务1"},{"title":"子任务2"}]');

      await setupAIConfig(testUser.id);
      runQuery("INSERT INTO notes (id, user_id, title, content, status) VALUES ('n1', ?, '测试笔记', '内容描述', 'todo')", [testUser.id]);

      const res = await request(app)
        .post('/api/ai/analyze')
        .set(auth())
        .send({ noteId: 'n1', action: 'decompose' });
      expect(res.status).toBe(200);
      expect(res.body.data.action).toBe('decompose');
    });
  });

  describe('POST /api/ai/summarize', () => {
    it('AI-08: 未指定分类返回 400', async () => {
      await setupAIConfig(testUser.id);
      const res = await request(app)
        .post('/api/ai/summarize')
        .set(auth())
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('分类');
    });

    it('AI-09: 总结分类成功', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      chatCompletion.mockResolvedValue('**总结报告**\n该分类共有3条笔记...');

      await setupAIConfig(testUser.id);
      runQuery("INSERT INTO notes (id, user_id, title, content, status, category) VALUES ('n1', ?, '笔记1', '内容1', 'todo', '工作')", [testUser.id]);

      const res = await request(app)
        .post('/api/ai/summarize')
        .set(auth())
        .send({ category: '工作' });
      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.category).toBe('工作');
    });
  });

  describe('POST /api/ai/classify', () => {
    it('AI-10: 内容为空返回 400', async () => {
      await setupAIConfig(testUser.id);
      const res = await request(app)
        .post('/api/ai/classify')
        .set(auth())
        .send({ content: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('不能为空');
    });

    it('AI-11: 无可用分类时返回 null', async () => {
      await setupAIConfig(testUser.id);
      const res = await request(app)
        .post('/api/ai/classify')
        .set(auth())
        .send({ content: '这是一段测试内容' });
      expect(res.status).toBe(200);
      expect(res.body.data.category).toBeNull();
    });

    it('AI-12: 有可用分类时返回匹配结果', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      chatCompletion.mockResolvedValue('工作');

      await setupAIConfig(testUser.id);
      runQuery("INSERT INTO categories (id, user_id, name, color) VALUES ('c1', ?, '工作', '#ef4444')", [testUser.id]);
      runQuery("INSERT INTO categories (id, user_id, name, color) VALUES ('c2', ?, '学习', '#3b82f6')", [testUser.id]);

      const res = await request(app)
        .post('/api/ai/classify')
        .set(auth())
        .send({ content: '需要完成项目报告' });
      expect(res.status).toBe(200);
      expect(res.body.data.category).toBe('工作');
    });
  });

  describe('GET /api/ai/conversations', () => {
    it('AI-13: 对话列表为空', async () => {
      const res = await request(app).get('/api/ai/conversations').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toEqual([]);
    });

    it('AI-14: 返回对话列表', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      runQuery(
        "INSERT INTO ai_conversations (id, user_id, title, messages) VALUES ('c1', ?, '对话1', '[]')",
        [testUser.id]
      );
      runQuery(
        "INSERT INTO ai_conversations (id, user_id, title, messages) VALUES ('c2', ?, '对话2', '[]')",
        [testUser.id]
      );

      const res = await request(app).get('/api/ai/conversations').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toHaveLength(2);
    });
  });

  describe('GET /api/ai/conversations/:id', () => {
    it('AI-15: 对话不存在返回 404', async () => {
      const res = await request(app).get('/api/ai/conversations/nonexistent').set(auth());
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('不存在');
    });
  });

  describe('DELETE /api/ai/conversations/:id', () => {
    it('AI-16: 删除对话成功', async () => {
      const { runQuery } = await import('../../src/db/helpers.js');
      runQuery(
        "INSERT INTO ai_conversations (id, user_id, title, messages) VALUES ('c1', ?, '待删除', '[]')",
        [testUser.id]
      );

      const res = await request(app).delete('/api/ai/conversations/c1').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('GET /api/ai/providers', () => {
    it('AI-17: 返回提供商列表', async () => {
      const res = await request(app).get('/api/ai/providers').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBeGreaterThanOrEqual(5);
      expect(res.body.data.providers[0].id).toBeDefined();
    });
  });
});
