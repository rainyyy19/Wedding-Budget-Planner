const API_BASE_URL = '/api';

export function getAuthToken() {
  return localStorage.getItem('aura_vow_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('aura_vow_token', token);
  } else {
    localStorage.removeItem('aura_vow_token');
  }
}

export function removeAuthToken() {
  localStorage.removeItem('aura_vow_token');
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If unauthorized, clear token so user is redirected or prompted
    removeAuthToken();
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

// Currency formatting utility
export function formatCurrency(amount, currencyCode = 'INR', currencySymbol = '₹') {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currencySymbol}0`;
  }

  const num = Number(amount);
  
  if (currencyCode === 'INR') {
    // Indian formatting with commas: e.g. 25,00,000
    const parts = num.toFixed(0).split('.');
    let integerPart = parts[0];
    const isNegative = integerPart.startsWith('-');
    if (isNegative) integerPart = integerPart.substring(1);

    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formatted = (isNegative ? '-' : '') + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `${currencySymbol}${formatted}`;
  } else {
    // Western standard formatting
    return `${currencySymbol}${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

// Compact currency for chart tooltips or small cards
export function formatCompactCurrency(amount, currencySymbol = '₹') {
  if (!amount || isNaN(amount)) return `${currencySymbol}0`;
  const num = Math.abs(Number(amount));
  const sign = Number(amount) < 0 ? '-' : '';

  if (currencySymbol === '₹') {
    if (num >= 10000000) {
      return `${sign}${currencySymbol}${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `${sign}${currencySymbol}${(num / 100000).toFixed(2)} L`;
    }
    if (num >= 1000) {
      return `${sign}${currencySymbol}${(num / 1000).toFixed(1)}k`;
    }
  } else {
    if (num >= 1000000) {
      return `${sign}${currencySymbol}${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${sign}${currencySymbol}${(num / 1000).toFixed(1)}k`;
    }
  }
  return `${sign}${currencySymbol}${num.toFixed(0)}`;
}

// Date formatter
export function formatDate(dateString) {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export const api = {
  // Auth
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  loginDemo: () => request('/auth/demo', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Setup & Profile
  getSetup: () => request('/setup'),
  updateSetup: (data) => request('/setup', { method: 'PUT', body: JSON.stringify(data) }),

  // Contributions
  getContributions: () => request('/contributions'),
  addContribution: (data) => request('/contributions', { method: 'POST', body: JSON.stringify(data) }),
  updateContribution: (id, data) => request(`/contributions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContribution: (id) => request(`/contributions/${id}`, { method: 'DELETE' }),

  // Categories & Allocations
  getCategories: () => request('/categories'),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Budget
  getBudgetSummary: () => request('/budget/summary'),
  quickUpdateBudget: (data) => request('/budget/quick-update', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    return request(`/expenses${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Vendors
  getVendors: () => request('/vendors'),
  createVendor: (data) => request('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id, data) => request(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id) => request(`/vendors/${id}`, { method: 'DELETE' }),

  // Payments & Reminders
  getPayments: () => request('/payments'),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  markPaymentPaid: (id, data) => request(`/payments/${id}/mark-paid`, { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id) => request(`/payments/${id}`, { method: 'DELETE' }),
  getPaymentReminders: () => request('/payments/reminders'),

  // Insights
  getInsights: () => request('/insights'),

  // Tasks / Checklist
  getTasks: () => request('/tasks'),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: 'POST' }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // CSV Export
  downloadCsv: async () => {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/export/csv`, { headers });
    if (!res.ok) throw new Error('Failed to generate CSV export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Wedding_Budget_Aura_Vow.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
