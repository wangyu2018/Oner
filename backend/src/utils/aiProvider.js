// AI Provider 统一抽象层
// 所有支持的AI提供商都走 OpenAI 兼容的 /v1/chat/completions 格式

const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  mimo: {
    name: 'MiMo',
    baseURL: 'https://api.xiaomi.com/v1',
    models: ['MiMo-7B-RL', 'mimo-vl-7b'],
    defaultModel: 'MiMo-7B-RL',
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  custom: {
    name: '自定义',
    baseURL: '',
    models: [],
    defaultModel: '',
  },
};

export function getProviderDefaults(provider) {
  return PROVIDERS[provider] || PROVIDERS.custom;
}

export function getProviderList() {
  return Object.entries(PROVIDERS).map(([key, val]) => ({
    id: key,
    name: val.name,
    models: val.models,
    defaultModel: val.defaultModel,
  }));
}

/**
 * 调用AI Chat Completion
 * @param {Object} options
 * @param {string} options.provider - 提供商ID
 * @param {string} options.apiKey - API密钥
 * @param {string} options.model - 模型名称
 * @param {string} options.baseURL - 自定义base URL
 * @param {Array} options.messages - 消息数组 [{role, content}]
 * @param {boolean} options.stream - 是否流式
 * @returns {Promise<string>|ReadableStream}
 */
export async function chatCompletion({ provider, apiKey, model, baseURL, messages, stream = false }) {
  const defaults = getProviderDefaults(provider);
  const url = (baseURL || defaults.baseURL) + '/chat/completions';
  const modelName = model || defaults.defaultModel;

  const body = {
    model: modelName,
    messages,
    stream,
    temperature: 0.7,
    max_tokens: 2000,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  if (stream) {
    return response.body;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 测试AI连接
 */
export async function testConnection({ provider, apiKey, model, baseURL }) {
  try {
    const result = await chatCompletion({
      provider, apiKey, model, baseURL,
      messages: [{ role: 'user', content: 'Hi, reply with OK.' }],
      stream: false,
    });
    return { success: true, message: result.substring(0, 100) };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
