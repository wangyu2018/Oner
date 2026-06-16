import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProviderList } from '../../src/utils/aiProvider.js';

// 由于 aiProvider 使用 fetch，需要在加载前 mock
const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
});

describe('aiProvider.js', () => {
  describe('getProviderList', () => {
    it('AI-01: getProviderList 返回所有提供商', () => {
      const list = getProviderList();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      // 应该包含 deepseek
      const deepseek = list.find(p => p.id === 'deepseek');
      expect(deepseek).toBeDefined();
      expect(deepseek.name).toBeDefined();
    });
  });

  describe('testConnection (via mock)', () => {
    it('AI-02: testConnection 成功场景', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });

      const { testConnection } = await import('../../src/utils/aiProvider.js');
      const result = await testConnection({
        provider: 'openai',
        apiKey: 'sk-test',
        model: 'gpt-3.5-turbo',
        baseURL: 'https://api.openai.com/v1',
      });

      expect(result.success).toBe(true);
    });

    it('AI-03: testConnection 认证失败场景', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const { testConnection } = await import('../../src/utils/aiProvider.js');
      const result = await testConnection({
        provider: 'openai',
        apiKey: 'sk-wrong',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('chatCompletion (via mock)', () => {
    it('AI-05: chatCompletion 非流式调用返回内容', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Mocked response' } }],
        }),
      });

      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      const result = await chatCompletion({
        provider: 'openai',
        apiKey: 'sk-test',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });

      expect(result).toBe('Mocked response');
    });

    it('AI-07: chatCompletion API 返回错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { chatCompletion } = await import('../../src/utils/aiProvider.js');
      await expect(chatCompletion({
        provider: 'openai',
        apiKey: 'sk-test',
        messages: [],
        stream: false,
      })).rejects.toThrow('Network error');
    });
  });
});
