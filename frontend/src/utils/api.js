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

  const data = await response.json();

  // 处理 401 错误（Token 过期或未登录）
  if (response.status === 401) {
    // 如果不在登录页，跳转到登录页
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
  },

  // 备份相关
  backup: {
    exportZip: () => {
      const token = getToken();
      window.location.href = `${API_BASE}/backup/export?token=${token}`;
    },
    downloadDb: () => {
      const token = getToken();
      window.location.href = `${API_BASE}/backup/download-db?token=${token}`;
    },
  },
};

export { getToken, setToken, clearToken };
