export interface WatchlistSummary {
  id: string;
  name: string;
  symbolCount: number;
  flaggedCount?: number;
  lastUpdated?: string;
}

export interface WatchlistSymbolLive {
  symbol: string;
  companyName: string;
  price: number;
  changePct: number;
  volumeRatio: number; // vs 20-day average (e.g. 2.4 = 240% of normal volume)
  attentionScore: number; // 0 to 100
  why: string;
  tags: string[]; // e.g. ["Volume", "Earnings", "Breakout", "Guidance", "Downgrade"]
  dataStatus: 'live' | 'delayed';
  updatedAt?: string;
  sinceLastCheckedPct?: number;
  sinceLastCheckedWhy?: string;
  sinceLastCheckedFlagged?: boolean;
  sparkline?: number[]; // intraday trajectory points
  prevPrice?: number;
  marketCap?: string;
  high52w?: number;
  low52w?: number;
}

export interface WatchlistDiffItem {
  symbol: string;
  changePct: number;
  why: string;
  flagged: boolean;
  companyName?: string;
  priceAtLastCheck?: number | null;
  priceNow?: number;
  changeAbs?: number;
  lastCheckedAt?: string | null;
  attentionScore?: number;
  dataStatus?: 'live' | 'delayed';
  price?: number;
  tags?: string[];
}

export interface CreateWatchlistPayload {
  name: string;
  description?: string;
}

export interface AddSymbolPayload {
  symbol: string;
  companyName?: string;
  why?: string;
  tags?: string[];
}

