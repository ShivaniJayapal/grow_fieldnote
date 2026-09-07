import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import {
  WatchlistSummary,
  WatchlistSymbolLive,
  WatchlistDiffItem,
  CreateWatchlistPayload,
  AddSymbolPayload,
} from './types';

// Query Keys
export const queryKeys = {
  watchlists: ['watchlists'] as const,
  watchlistLive: (id: string) => ['watchlists', id, 'live'] as const,
  watchlistDiff: (id: string) => ['watchlists', id, 'diff'] as const,
};

// GET /watchlists
export function useWatchlists() {
  return useQuery<WatchlistSummary[]>({
    queryKey: queryKeys.watchlists,
    queryFn: () => apiClient.getWatchlists(),
    staleTime: 1000 * 30, // 30s
  });
}

// GET /watchlists/:id/live
export function useWatchlistLive(watchlistId: string) {
  return useQuery<WatchlistSymbolLive[]>({
    queryKey: queryKeys.watchlistLive(watchlistId),
    queryFn: () => apiClient.getWatchlistLive(watchlistId),
    enabled: Boolean(watchlistId),
    staleTime: 1000 * 10,
  });
}

// GET /watchlists/:id/diff
export function useWatchlistDiff(watchlistId: string) {
  return useQuery<WatchlistDiffItem[]>({
    queryKey: queryKeys.watchlistDiff(watchlistId),
    queryFn: () => apiClient.getWatchlistDiff(watchlistId),
    enabled: Boolean(watchlistId),
    staleTime: 1000 * 15,
  });
}

export function useMarkWatchlistChecked(watchlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.markWatchlistChecked(watchlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlistDiff(watchlistId) });
    },
  });
}

// POST /watchlists
export function useCreateWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWatchlistPayload) => apiClient.createWatchlist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists });
    },
  });
}

// POST /watchlists/:id/symbols
export function useAddSymbol(watchlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddSymbolPayload) => apiClient.addSymbol(watchlistId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlistLive(watchlistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlistDiff(watchlistId) });
    },
  });
}

// DELETE /watchlists/:id/symbols/:symbol
export function useRemoveSymbol(watchlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (symbol: string) => apiClient.removeSymbol(watchlistId, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlistLive(watchlistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlistDiff(watchlistId) });
    },
  });
}

