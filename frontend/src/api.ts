import type {
  AuthResponse,
  HealthResponse,
  ImportSummary,
  ResearchReport,
  SavedReportDetail,
  SavedReportSummary,
  SaveReportPayload,
  StockDetail,
  StocksSearchResponse,
  User
} from './types';

const API_BASE = '/api';
const TOKEN_KEY = 'equiagentic_auth_token';
const USER_KEY = 'equiagentic_auth_user';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ============================================================================
// TOKEN & AUTH SESSION HELPERS
// ============================================================================

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Non-json response
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json() as Promise<T>;
}

// ============================================================================
// AUTHENTICATION APIS
// ============================================================================

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<AuthResponse>(res);
  setAuthSession(data.token, data.user);
  return data;
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await handleResponse<AuthResponse>(res);
  setAuthSession(data.token, data.user);
  return data;
}

export async function googleAuth(data: { email: string; name: string; picture?: string; credential?: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const authData = await handleResponse<AuthResponse>(res);
  setAuthSession(authData.token, authData.user);
  return authData;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  const user = await handleResponse<User>(res);
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  return user;
}

// ============================================================================
// REPORT HISTORY APIS
// ============================================================================

export async function fetchReportHistory(): Promise<SavedReportSummary[]> {
  const res = await fetch(`${API_BASE}/reports/history`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SavedReportSummary[]>(res);
}

export async function fetchSavedReportDetail(reportId: number): Promise<SavedReportDetail> {
  const res = await fetch(`${API_BASE}/reports/history/${reportId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SavedReportDetail>(res);
}

export async function deleteSavedReport(reportId: number): Promise<{ status: string; id: number }> {
  const res = await fetch(`${API_BASE}/reports/history/${reportId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<{ status: string; id: number }>(res);
}

export async function saveReportToHistory(payload: SaveReportPayload): Promise<{ status: string; id: number }> {
  const res = await fetch(`${API_BASE}/reports/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ status: string; id: number }>(res);
}

// ============================================================================
// STOCKS & HEALTH APIS
// ============================================================================

export async function checkBackendHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthResponse>(res);
}

export async function searchStocks(
  query: string = '',
  exchange?: string,
  page: number = 1,
  limit: number = 18
): Promise<StocksSearchResponse> {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set('q', query.trim());
  }
  if (exchange && exchange.trim()) {
    params.set('exchange', exchange.trim());
  }
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  const res = await fetch(`${API_BASE}/stocks?${params.toString()}`);
  return handleResponse<StocksSearchResponse>(res);
}

export async function getStockDetail(symbol: string, exchange?: string): Promise<StockDetail> {
  const params = new URLSearchParams();
  if (exchange && exchange.trim()) {
    params.set('exchange', exchange.trim());
  }
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}${queryStr}`);
  return handleResponse<StockDetail>(res);
}

export async function generateReport(symbol: string, exchange?: string): Promise<ResearchReport> {
  const params = new URLSearchParams();
  if (exchange && exchange.trim()) {
    params.set('exchange', exchange.trim());
  }
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(symbol)}${queryStr}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<ResearchReport>(res);
}

export async function uploadCatalogFile(exchange: 'NSE' | 'BSE', file: File): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/catalog/import?exchange=${exchange}`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ImportSummary>(res);
}
