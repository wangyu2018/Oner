/**
 * API 客户端 — 统一封装 fetch
 */

const BASE_URL = '/api';

class ApiClient {
  constructor(baseURL = BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(path, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}${path}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    const res = await fetch(url, config);

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
      err.response = res;
      throw err;
    }

    return res.json();
  }

  get(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(path + qs, { method: 'GET' });
  }

  post(path, body) {
    return this.request(path, { method: 'POST', body });
  }

  put(path, body) {
    return this.request(path, { method: 'PUT', body });
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export { ApiClient };
