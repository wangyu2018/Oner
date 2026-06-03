const API_BASE = '/api';

// 获取 Token
function getToken() {
  return localStorage.getItem('oner_token');
}

// 设置 Token
function setToken(token) {
  localStorage.setItem('oner_token', token);
}

// 清除 Token
function clearToken() {
  localStorage.removeItem('oner_token');
}

export async function fetchJSON(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });

  // 处理文件下载（返回 blob 而非 JSON）
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '下载失败' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.blob();
  }

  const data = await response.json();

  // 处理 401 错误（Token 过期或未登录）
  if (response.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      clearToken();
      window.location.href = '/login';
    }
    throw new Error(data.error || '未登录或登录已过期');
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

// 触发文件下载（使用 Authorization header 而非 URL 参数）
async function downloadFile(url, filename) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '下载失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export const api = {
  // 认证相关
  auth: {
    register: (userData) => fetchJSON('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    login: (credentials) => fetchJSON('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    logout: () => fetchJSON('/auth/logout', {
      method: 'POST',
    }),
    me: () => fetchJSON('/auth/me'),
    getSessions: () => fetchJSON('/auth/sessions'),
    deleteSession: (id) => fetchJSON(`/auth/sessions/${id}`, {
      method: 'DELETE',
    }),
    updateProfile: (data) => fetchJSON('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    verifyVaultPin: (pin) => fetchJSON('/auth/verify-vault-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  },

  // 笔记相关
  notes: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.tag) query.set('tag', params.tag);
      if (params.status) query.set('status', params.status);
      if (params.priority) query.set('priority', params.priority);
      if (params.sort) query.set('sort', params.sort);
      if (params.order) query.set('order', params.order);
      if (params.cursor) query.set('cursor', params.cursor);
      if (params.limit) query.set('limit', params.limit);
      if (params.parent_id) query.set('parent_id', params.parent_id);
      if (params.category) query.set('category', params.category);
      if (params.include_subtasks) query.set('include_subtasks', 'true');

      const queryStr = query.toString();
      return fetchJSON(`/notes${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id) => fetchJSON(`/notes/${id}`),
    create: (note) => fetchJSON('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),
    update: (id, note) => fetchJSON(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    }),
    delete: (id) => fetchJSON(`/notes/${id}`, {
      method: 'DELETE',
    }),
    // 子任务
    getSubtasks: (id) => fetchJSON(`/notes/${id}/subtasks`),
    addSubtask: (id, data) => fetchJSON(`/notes/${id}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // 提醒
  reminders: {
    list: () => fetchJSON('/reminders'),
  },

  // 备份相关（使用 Authorization header 而非 URL 参数）
  backup: {
    async exportZip() {
      const date = new Date().toISOString().slice(0, 10);
      await downloadFile('/backup/export', `oner-backup-${date}.zip`);
    },
    async downloadDb() {
      await downloadFile('/backup/download-db', 'oner.db');
    },
  },

  // 分类
  categories: {
    list: () => fetchJSON('/categories'),
    create: (data) => fetchJSON('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => fetchJSON(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => fetchJSON(`/categories/${id}`, {
      method: 'DELETE',
    }),
  },

  // 搜索
  search: {
    query: (q, params = {}) => {
      const query = new URLSearchParams({ q, ...params });
      return fetchJSON(`/search?${query}`);
    },
  },

  // 密码备忘
  passwords: {
    list: (params = {}) => {
      const query = new URLSearchParams(params);
      return fetchJSON(`/passwords?${query}`);
    },
    get: (id) => fetchJSON(`/passwords/${id}`),
    create: (data) => fetchJSON('/passwords', {
      method: 'POST', body: JSON.stringify(data),
    }),
    update: (id, data) => fetchJSON(`/passwords/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
    delete: (id) => fetchJSON(`/passwords/${id}`, {
      method: 'DELETE',
    }),
    decrypt: (id) => fetchJSON(`/passwords/${id}/decrypt`),
    updateSettings: (id, data) => fetchJSON(`/passwords/${id}/settings`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  },

  // 文件上传
  files: {
    list: (noteId) => fetchJSON(`/files?note_id=${noteId || ''}`),
    async upload(noteId, file) {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/files/upload?note_id=${noteId || ''}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '上传失败' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      return response.json();
    },
    download: (id) => downloadFile(`/files/${id}/download`, 'file'),
    delete: (id) => fetchJSON(`/files/${id}`, { method: 'DELETE' }),
  },

  // 设置
  settings: {
    get: () => fetchJSON('/settings'),
    update: (data) => fetchJSON('/settings', {
      method: 'PUT', body: JSON.stringify(data),
    }),
  },

  // AI
  ai: {
    chat: (data) => fetchJSON('/ai/chat', {
      method: 'POST', body: JSON.stringify(data),
    }),
    chatStream: async (data, onChunk, onDone) => {
      const token = getToken();
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...data, stream: true }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const d = line.slice(6).trim();
          if (d === '[DONE]') { onDone?.(); return; }
          try {
            const parsed = JSON.parse(d);
            if (parsed.content) onChunk(parsed.content);
          } catch {}
        }
      }
      onDone?.();
    },
    analyze: (data) => fetchJSON('/ai/analyze', {
      method: 'POST', body: JSON.stringify(data),
    }),
    summarize: (data) => fetchJSON('/ai/summarize', {
      method: 'POST', body: JSON.stringify(data),
    }),
    conversations: () => fetchJSON('/ai/conversations'),
    getConversation: (id) => fetchJSON(`/ai/conversations/${id}`),
    deleteConversation: (id) => fetchJSON(`/ai/conversations/${id}`, { method: 'DELETE' }),
    providers: () => fetchJSON('/ai/providers'),
    testConnection: (data) => fetchJSON('/ai/test', {
      method: 'POST', body: JSON.stringify(data),
    }),
  },
};

export { getToken, setToken, clearToken };
