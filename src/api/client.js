import * as tokenStore from '../lib/tokenStore';
import Constants from 'expo-constants';

// Where the API lives, in order of precedence:
//   1. EXPO_PUBLIC_API_BASE_URL — .env locally, eas.json `env` for a build.
//   2. expo.extra.apiBaseUrl in app.json — committed, so a build always has a
//      value even if the env plumbing is missed.
//   3. localhost, DEV ONLY.
//
// Step 3 is gated on __DEV__ deliberately. It used to apply everywhere, and
// because .env is gitignored, release builds silently fell through to
// http://localhost:5000 — which Android release blocks as cleartext, surfacing
// as an opaque "UnknownServiceException" instead of "the API URL is not set".
const configured =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  null;

if (!configured && !__DEV__) {
  console.error(
    '[KB_Expense] No API base URL configured for this build. Set ' +
    'EXPO_PUBLIC_API_BASE_URL in eas.json, or expo.extra.apiBaseUrl in app.json.',
  );
}

// Android and iOS both block cleartext HTTP in release builds, so an http:// URL
// here cannot work in production — say so plainly rather than letting it fail as
// a network error at the first request.
if (configured && !__DEV__ && configured.startsWith('http://')) {
  console.error(
    `[KB_Expense] API base URL "${configured}" uses plain HTTP. Release builds ` +
    'block cleartext traffic — this must be an https:// URL.',
  );
}

// Point this at your machine's LAN IP when testing on a device — localhost is
// the phone's own loopback, not your dev machine.
const BASE_URL = configured || 'http://localhost:5000/api';

const ACCESS_KEY = 'kb_access_token';
const REFRESH_KEY = 'kb_refresh_token';

export const tokens = {
  get: (k) => tokenStore.getItem(k),
  getAccess: () => tokenStore.getItem(ACCESS_KEY),
  getRefresh: () => tokenStore.getItem(REFRESH_KEY),
  async save({ accessToken, refreshToken }) {
    const writes = [];
    if (accessToken) writes.push(tokenStore.setItem(ACCESS_KEY, accessToken));
    if (refreshToken) writes.push(tokenStore.setItem(REFRESH_KEY, refreshToken));
    await Promise.all(writes);
  },
  async clear() {
    await Promise.all([
      tokenStore.removeItem(ACCESS_KEY),
      tokenStore.removeItem(REFRESH_KEY),
    ]);
  },
};

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Set by the auth provider so a failed refresh can bounce the user to sign-in.
let onAuthFailure = null;
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

async function parse(res) {
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  if (!res.ok) {
    throw new ApiError(body?.message || `Request failed (${res.status})`, res.status, body);
  }
  return body;
}

// Single-flight refresh: concurrent 401s wait on one refresh call rather than
// each firing their own and racing to overwrite the stored tokens.
let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await tokens.getRefresh();
    if (!refreshToken) throw new ApiError('No refresh token', 401);

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await parse(res);
    await tokens.save({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
    });
    return data.accessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function request(path, { method = 'GET', body, auth = true, _retry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await tokens.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth && !_retry) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, auth, _retry: true });
    } catch {
      await tokens.clear();
      onAuthFailure?.();
      throw new ApiError('Session expired. Please sign in again.', 401);
    }
  }

  return parse(res);
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(Object.fromEntries(entries))}` : '';
};

export const api = {
  // ── Auth ──
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials, auth: false }),
  register: (user) => request('/auth/register', { method: 'POST', body: user, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
  changePassword: (payload) => request('/auth/change-password', { method: 'PUT', body: payload }),

  // ── Expenses ──
  getExpenses: (params) => request(`/expenses${qs(params)}`),
  getExpenseSummary: (params) => request(`/expenses/summary${qs(params)}`),
  addExpense: (expense) => request('/expenses', { method: 'POST', body: expense }),
  updateExpense: (id, expense) => request(`/expenses/${id}`, { method: 'PUT', body: expense }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // ── Income ──
  getIncome: (params) => request(`/income${qs(params)}`),
  getIncomeSummary: (params) => request(`/income/summary${qs(params)}`),
  addIncome: (item) => request('/income', { method: 'POST', body: item }),
  updateIncome: (id, item) => request(`/income/${id}`, { method: 'PUT', body: item }),
  deleteIncome: (id) => request(`/income/${id}`, { method: 'DELETE' }),

  // ── Budget ──
  getBudget: () => request('/budget'),
  updateBudget: (budget) => request('/budget', { method: 'PUT', body: budget }),
  resetBudget: () => request('/budget', { method: 'DELETE' }),

  // ── Recurring ──
  getRecurring: () => request('/recurring'),
  addRecurring: (item) => request('/recurring', { method: 'POST', body: item }),
  updateRecurring: (id, item) => request(`/recurring/${id}`, { method: 'PUT', body: item }),
  deleteRecurring: (id) => request(`/recurring/${id}`, { method: 'DELETE' }),
  applyRecurring: (id) => request(`/recurring/${id}/apply`, { method: 'POST' }),
  applyDueRecurring: () => request('/recurring/apply-due', { method: 'POST' }),

  // ── Analytics (server-side; the web client never used these) ──
  analytics: {
    overview: (params) => request(`/analytics/overview${qs(params)}`),
    monthly: (params) => request(`/analytics/monthly${qs(params)}`),
    weekly: (params) => request(`/analytics/weekly${qs(params)}`),
    daily: (params) => request(`/analytics/daily${qs(params)}`),
    categories: (params) => request(`/analytics/categories${qs(params)}`),
    insights: (params) => request(`/analytics/insights${qs(params)}`),
    cashflow: (params) => request(`/analytics/cashflow${qs(params)}`),
  },
};

export { BASE_URL };
export default api;
