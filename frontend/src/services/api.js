const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'alur-bumbu-token';

let unauthorizedHandler = null;

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage tidak tersedia (mis. mode private ketat).
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    return { success: false, message: 'Tidak dapat terhubung ke server: ' + err.message };
  }

  const contentType = res.headers.get('content-type') || '';
  let payload = null;

  if (contentType.includes('application/json')) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  } else {
    payload = await res.text();
  }

  if (res.status === 401) {
    setToken(null);
    if (unauthorizedHandler) unauthorizedHandler();
    return {
      success: false,
      unauthorized: true,
      status: 401,
      message: (payload && payload.message) || 'Sesi berakhir. Silakan login kembali.'
    };
  }

  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      message: (payload && payload.message) || `Permintaan gagal (${res.status}).`
    };
  }

  return payload;
}

export const api = {
  // Auth
  login: async (username, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  getCurrentUser: async () => {
    return request('/auth/me');
  },
  logout: async () => {
    return request('/auth/logout', { method: 'POST' });
  },

  // Products & Batches
  getProducts: async () => {
    return request('/products');
  },
  getProductById: async (id) => {
    return request(`/products/${id}`);
  },
  addProduct: async (data) => {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  recordGoodsIn: async (data) => {
    return request('/products/goods-in', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  adjustStockOpname: async (data) => {
    return request('/products/adjust-stock', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getAllBatches: async () => {
    return request('/products/batches/all');
  },

  // Orders
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? '?' + query : ''}`);
  },
  getOrderById: async (id) => {
    return request(`/orders/${id}`);
  },
  createOrder: async (data) => {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  prepareOrder: async (id, data) => {
    return request(`/orders/${id}/prepare`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  reportOrderIssue: async (id, data) => {
    return request(`/orders/${id}/report-issue`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  packOrder: async (id, data) => {
    return request(`/orders/${id}/pack`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  shipOrder: async (id, data) => {
    return request(`/orders/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  completeOrder: async (id, data) => {
    return request(`/orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  recordCODPayment: async (id, data) => {
    return request(`/orders/${id}/pay-cod`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  cancelOrder: async (id, data) => {
    return request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  returnOrder: async (id, data) => {
    return request(`/orders/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Notifications
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notifications/whatsapp${query ? '?' + query : ''}`);
  },
  getSettings: async () => {
    return request('/notifications/settings');
  },
  updateSettings: async (data) => {
    return request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  sendDailySummary: async () => {
    return request('/notifications/whatsapp/daily-summary', {
      method: 'POST'
    });
  },

  // Reports
  getDashboardData: async () => {
    return request('/reports/dashboard');
  },
  getStockLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/stock-logs${query ? '?' + query : ''}`);
  },
  downloadExport: async (type, format = 'xlsx') => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reports/export/${type}?format=${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!res.ok) {
      let message = `Gagal mengunduh laporan (${res.status}).`;
      try {
        const payload = await res.json();
        if (payload && payload.message) message = payload.message;
      } catch {
        // Abaikan body non-JSON.
      }

      if (res.status === 401) {
        setToken(null);
        if (unauthorizedHandler) unauthorizedHandler();
      }

      throw new Error(message);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : `AlurBumbu_${type}.${format}`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
};

export default api;
