// model.js - API interactions and token helpers (ES module)
import { showPopup } from './utils.js';

export function numberOrDefault(v, d) { const n = parseFloat(v); return Number.isFinite(n) ? n : d; }

export async function apiLogin(email, password) {
  const res = await axios.post('/api/login', { email, password });
  return res.data;
}

export async function apiRegister(email, password) {
  const res = await axios.post('/api/register', { email, password });
  return res.data;
}

export async function apiGetSummary() {
  const res = await axios.get('/api/summary');
  return res.data;
}

export async function apiGetAlerts() {
  const res = await axios.get('/api/alerts');
  return res.data;
}

export async function apiGetMetrics() {
  const res = await axios.get('/api/metrics');
  return res.data;
}

export async function apiGetThresholds() {
  const res = await axios.get('/api/thresholds');
  return res.data;
}

export async function apiSaveThresholds(body) {
  const res = await axios.post('/api/thresholds', body);
  return res.data;
}

// small token helpers used by controller
export function saveTokenLocal(t) {
  localStorage.setItem('obs_token', t);
  axios.defaults.headers.common['x-session-token'] = t;
}

export function clearTokenLocal() {
  localStorage.removeItem('obs_token');
  delete axios.defaults.headers.common['x-session-token'];
}

// expose a safe show error helper
export function showError(msg) {
  showPopup(msg, 'Error', { type: 'error' });
}
