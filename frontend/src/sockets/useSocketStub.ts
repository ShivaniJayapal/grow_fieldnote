import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/hooks';
import { WatchlistSymbolLive } from '../api/types';

interface UseSocketStubOptions {
  watchlistId: string;
  enabled?: boolean;
}

export interface SocketState {
  isConnected: boolean;
  isSimulating: boolean;
  lastUpdatedSymbol: string | null;
  lastUpdateDirection: 'up' | 'down' | null;
  toggleSimulation: () => void;
  triggerManualTick: () => void;
}

export function useSocketStub({ watchlistId, enabled = true }: UseSocketStubOptions): SocketState {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [isSimulating, setIsSimulating] = useState(true);
  const [lastUpdatedSymbol, setLastUpdatedSymbol] = useState<string | null>(null);
  const [lastUpdateDirection, setLastUpdateDirection] = useState<'up' | 'down' | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize stubbed socket.io connection
  useEffect(() => {
    if (!enabled) return;

    try {
      // Connect to stub/local endpoint or mock instance
      // autoConnect: false to prevent spamming errors when backend server isn't running yet
      const socket = io('http://localhost:4000', {
        autoConnect: false,
        transports: ['websocket'],
      });
      socketRef.current = socket;

      // When actual backend is connected:
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('stock:update', (update: Partial<WatchlistSymbolLive> & { symbol: string }) => {
        applyPriceUpdate(update.symbol, update.price, update.changePct);
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      // Fallback in case of mock environment
      setIsConnected(true);
    }
  }, [enabled]);

  // Handler to apply a live tick directly to TanStack React Query cache
  const applyPriceUpdate = useCallback((targetSymbol: string, forcedPrice?: number, forcedChange?: number) => {
    queryClient.setQueryData<WatchlistSymbolLive[]>(
      queryKeys.watchlistLive(watchlistId),
      (current) => {
        if (!current || current.length === 0) return current;

        return current.map((item) => {
          if (item.symbol !== targetSymbol) return item;

          const isUp = forcedChange !== undefined ? forcedChange > 0 : Math.random() > 0.45;
          const deltaPct = (Math.random() * 0.7 + 0.1) * (isUp ? 1 : -1);
          const newPrice = forcedPrice ?? +(item.price * (1 + deltaPct / 100)).toFixed(2);
          const newChangePct = forcedChange ?? +(item.changePct + deltaPct).toFixed(2);
          const newSparkline = item.sparkline
            ? [...item.sparkline.slice(-14), newPrice]
            : [newPrice];

          // Small attention score nudge if volatility spikes
          const attentionDelta = Math.abs(deltaPct) > 0.4 ? 1 : 0;
          const newScore = Math.min(100, Math.max(0, item.attentionScore + attentionDelta));

          setLastUpdatedSymbol(targetSymbol);
          setLastUpdateDirection(isUp ? 'up' : 'down');

          return {
            ...item,
            price: newPrice,
            changePct: newChangePct,
            prevPrice: item.price,
            attentionScore: newScore,
            sparkline: newSparkline,
          };
        });
      }
    );

    // Clear highlight after 1.5s
    setTimeout(() => {
      setLastUpdatedSymbol((prev) => (prev === targetSymbol ? null : prev));
      setLastUpdateDirection(null);
    }, 1500);
  }, [queryClient, watchlistId]);

  // Tick generator
  const triggerManualTick = useCallback(() => {
    const list = queryClient.getQueryData<WatchlistSymbolLive[]>(queryKeys.watchlistLive(watchlistId));
    if (!list || list.length === 0) return;
    const randomIndex = Math.floor(Math.random() * list.length);
    const chosen = list[randomIndex];
    applyPriceUpdate(chosen.symbol);
  }, [queryClient, watchlistId, applyPriceUpdate]);

  // Run periodic simulated ticks when isSimulating is active
  useEffect(() => {
    if (!isSimulating) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      triggerManualTick();
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, triggerManualTick]);

  const toggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  return {
    isConnected,
    isSimulating,
    lastUpdatedSymbol,
    lastUpdateDirection,
    toggleSimulation,
    triggerManualTick,
  };
}

