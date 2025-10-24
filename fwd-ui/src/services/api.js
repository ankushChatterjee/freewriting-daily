const API_URL = import.meta.env.VITE_API_URL;

class ApiService {
  constructor() {
    this.baseURL = API_URL;
  }

  getToken() {
    return localStorage.getItem('fwd_token');
  }

  setToken(token) {
    localStorage.setItem('fwd_token', token);
  }

  clearToken() {
    localStorage.removeItem('fwd_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
    this.setToken(data.token);
    return data;
  }

  async signup(username, password) {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.clearToken();
  }

  // Document endpoints
  async getTodayDoc() {
    try {
      return await this.request('/api/docs/today');
    } catch (error) {
      if (error.message === 'No document for today') {
        return null;
      }
      throw error;
    }
  }

  async saveDoc(content) {
    return await this.request('/api/docs', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getDocByDate(date) {
    return await this.request(`/api/docs/${date}`);
  }

  async getHistory(page = 1, limit = 30) {
    return await this.request(`/api/docs/history?page=${page}&limit=${limit}`);
  }

  // Stats endpoint
  async getStats(days = 30) {
    return await this.request(`/api/stats?days=${days}`);
  }
}

export default new ApiService();

