const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let accessToken = null;
let refreshToken = null;
let onAuthExpired = null;

export function setAuthCallback(cb) {
  onAuthExpired = cb;
}

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function isAuthenticated() {
  return !!accessToken;
}

async function tryRefresh() {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    accessToken = json.data.access_token;
    refreshToken = json.data.refresh_token;
    return true;
  } catch {
    return false;
  }
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      onAuthExpired?.();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || `Erro ${res.status}`);
  }
  return json;
}

// Auth
export async function register(name, email, password, businessName) {
  const json = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, business_name: businessName }),
  });
  setTokens(json.data.access_token, json.data.refresh_token);
  return json.data.user;
}

export async function login(email, password) {
  const json = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(json.data.access_token, json.data.refresh_token);
  return json.data.user;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

// Sales
export async function uploadCSV(csvText, fileName) {
  const params = fileName ? `?file_name=${encodeURIComponent(fileName)}` : '';
  const json = await request(`/sales/upload${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: csvText,
  });
  return json.data;
}

export async function listBatches() {
  const json = await request('/sales/batches');
  return json.data;
}

export async function deleteBatch(batchId) {
  const json = await request(`/sales/batch/${batchId}`, { method: 'DELETE' });
  return json.data;
}

// Analytics
export async function getSummary(dateFrom, dateTo) {
  const json = await request(`/analytics/summary?date_from=${dateFrom}&date_to=${dateTo}`);
  return json.data;
}

// AI
export async function analyzeAI(dateFrom, dateTo, forceRefresh = false) {
  const json = await request('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ date_from: dateFrom, date_to: dateTo, force_refresh: forceRefresh }),
  });
  return json.data;
}
