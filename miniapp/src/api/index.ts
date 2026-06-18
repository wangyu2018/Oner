// 与主项目同一套后端 API
// 通过环境变量 TARO_APP_API_BASE 配置生产地址，确保编译时注入
const API_BASE = process.env.TARO_APP_API_BASE || 'https://your-api-domain.com/api';

let token = '';

export function setToken(t: string) {
  token = t;
}

export function getToken(): string {
  return token;
}

export function clearToken() {
  token = '';
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    Taro.request({
      url: `${API_BASE}${url}`,
      method: method as any,
      header: finalHeaders,
      data: body,
      success: (res) => {
        if (res.statusCode === 401) {
          clearToken();
          Taro.redirectTo({ url: '/pages/index/index' });
          reject(new Error('登录已过期'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(new Error((res.data as any)?.error || `HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'));
      },
    });
  });
}

// ========================================
// API 接口（与主项目 frontend/src/utils/api.js 保持一致）
// ========================================

export const api = {
  auth: {
    // 小程序登录：用 wx.login code 换后端 token
    miniLogin: (code: string) =>
      request<{ token: string; user: any }>('/auth/mini-login', {
        method: 'POST',
        body: { code },
      }),
    me: () => request<any>('/auth/me'),
  },

  notes: {
    list: (params: Record<string, any> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.set(k, String(v));
      });
      const qs = query.toString();
      return request<any>(`/notes${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<any>(`/notes/${id}`),
  },

  categories: {
    list: () => request<any>('/categories'),
  },

  ai: {
    conversations: () => request<any>('/ai/conversations'),
  },

  passwords: {
    list: (params: Record<string, any> = {}) => {
      const query = new URLSearchParams(params);
      return request<any>(`/passwords?${query}`);
    },
  },

  plugins: {
    // 启动同步：拉取用户插件状态
    sync: () => request<{ data: { plugins: any[]; updated_at: string } }>('/plugins/sync'),
  },

  wechat: {
    // 保存订阅记录
    subscribe: (templateId: string, remindType: string, openid: string) =>
      request<any>('/wechat/subscribe', {
        method: 'POST',
        body: { template_id: templateId, remind_type: remindType, openid },
      }),
    // 获取用户所有订阅
    subscriptions: () =>
      request<{ subscriptions: any[] }>('/wechat/subscriptions'),
    // 切换订阅开关
    toggle: (id: string, enabled: boolean) =>
      request<any>(`/wechat/subscriptions/${id}`, {
        method: 'PUT',
        body: { enabled },
      }),
    // 取消订阅
    remove: (id: string) =>
      request<any>(`/wechat/subscriptions/${id}`, {
        method: 'DELETE',
      }),
    // 获取用户专属小程序码（带参数，用于邀请溯源）
    getQrCode: () =>
      request<{ qrCodeUrl: string }>('/wechat/qrcode'),
  },
};
