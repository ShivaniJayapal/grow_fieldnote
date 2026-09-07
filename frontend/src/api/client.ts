import {
  WatchlistSummary,
  WatchlistSymbolLive,
  WatchlistDiffItem,
  CreateWatchlistPayload,
  AddSymbolPayload,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'fieldnote_auth_v1';

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    createdAt?: string;
  };
}

export function getStoredAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuthSession : null;
  } catch {
    return null;
  }
}

export function storeAuth(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const session = getStoredAuth();
  if (authenticated && session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || body?.message || `Request failed (${response.status})`);
  }

  return body as T;
}

interface AuthApiResponse {
  success: boolean;
  data: AuthSession;
}

export const apiClient = {
  async login(email: string, password: string): Promise<AuthSession> {
    const response = await request<AuthApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
    storeAuth(response.data);
    return response.data;
  },

  async register(email: string, password: string): Promise<AuthSession> {
    const response = await request<AuthApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
    storeAuth(response.data);
    return response.data;
  },

  async getWatchlists(): Promise<WatchlistSummary[]> {
    return request<WatchlistSummary[]>('/watchlists');
  },

  async getWatchlistLive(watchlistId: string): Promise<WatchlistSymbolLive[]> {
    return request<WatchlistSymbolLive[]>(`/watchlists/${watchlistId}/live`);
  },

  async getWatchlistDiff(watchlistId: string): Promise<WatchlistDiffItem[]> {
    return request<WatchlistDiffItem[]>(`/watchlists/${watchlistId}/diff`);
  },

  async markWatchlistChecked(watchlistId: string): Promise<{ lastCheckedAt: string; symbolCount: number }> {
    return request(`/watchlists/${watchlistId}/diff/mark-checked`, { method: 'POST' });
  },

  async createWatchlist(payload: CreateWatchlistPayload): Promise<WatchlistSummary> {
    return request<WatchlistSummary>('/watchlists', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async addSymbol(watchlistId: string, payload: AddSymbolPayload): Promise<WatchlistSymbolLive> {
    return request<WatchlistSymbolLive>(`/watchlists/${watchlistId}/symbols`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async removeSymbol(watchlistId: string, symbol: string): Promise<void> {
    await request(`/watchlists/${watchlistId}/symbols/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
  },
};
