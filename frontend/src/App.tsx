import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useWatchlists,
  useWatchlistLive,
  useWatchlistDiff,
  useMarkWatchlistChecked,
  useCreateWatchlist,
  useAddSymbol,
  useRemoveSymbol,
} from './api/hooks';
import { AuthSession, getStoredAuth } from './api/client';
import { useSocketStub } from './sockets/useSocketStub';
import { LeftRail } from './components/layout/LeftRail';
import { Header } from './components/layout/Header';
import { SinceYouChecked } from './components/hero/SinceYouChecked';
import { DiffStrip } from './components/hero/DiffStrip';
import { WatchlistTable } from './components/table/WatchlistTable';
import { EmptyWatchlist } from './components/empty/EmptyWatchlist';
import { AddSymbolModal } from './components/modals/AddSymbolModal';
import { NewWatchlistModal } from './components/modals/NewWatchlistModal';
import { AddSymbolPayload, CreateWatchlistPayload } from './api/types';
import { Loader2 } from 'lucide-react';
import { AuthScreen } from './components/auth/AuthScreen';
import { DiffEnginePage } from './components/diff/DiffEnginePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function FieldnoteDashboard() {
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [isMobileRailOpen, setIsMobileRailOpen] = useState(false);
  const [isAddSymbolOpen, setIsAddSymbolOpen] = useState(false);
  const [isNewWatchlistOpen, setIsNewWatchlistOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'flagged' | 'high-volume'>('all');
  const [activePage, setActivePage] = useState<'dashboard' | 'diff'>('dashboard');

  // Queries
  const { data: watchlists = [] } = useWatchlists();
  const { data: liveSymbols = [], isLoading: isLoadingSymbols, refetch: refetchLive } = useWatchlistLive(selectedWatchlistId);
  const { data: diffs = [], isLoading: isLoadingDiffs, refetch: refetchDiffs } = useWatchlistDiff(selectedWatchlistId);

  // Mutations
  const createWatchlistMutation = useCreateWatchlist();
  const addSymbolMutation = useAddSymbol(selectedWatchlistId);
  const removeSymbolMutation = useRemoveSymbol(selectedWatchlistId);
  const markCheckedMutation = useMarkWatchlistChecked(selectedWatchlistId);

  // Live Socket.io Stub
  const socketState = useSocketStub({
    watchlistId: selectedWatchlistId,
    enabled: true,
  });

  // Ensure active watchlist is valid if watchlists load
  useEffect(() => {
    if (watchlists.length > 0 && !watchlists.some((w) => w.id === selectedWatchlistId)) {
      setSelectedWatchlistId(watchlists[0].id);
    }
  }, [watchlists, selectedWatchlistId]);

  const liveRows = liveSymbols.map((symbol) => {
    const diff = diffs.find((item) => item.symbol === symbol.symbol);
    return {
      ...symbol,
      sinceLastCheckedPct: diff?.changePct,
      sinceLastCheckedWhy: diff?.why,
      sinceLastCheckedFlagged: diff?.flagged,
    };
  });

  const activeWatchlist = watchlists.find((w) => w.id === selectedWatchlistId) || {
    id: selectedWatchlistId,
    name: 'Watchlist',
    symbolCount: liveSymbols.length,
  };

  const handleCreateWatchlist = async (payload: CreateWatchlistPayload) => {
    const created = await createWatchlistMutation.mutateAsync(payload);
    setSelectedWatchlistId(created.id);
  };

  const handleAddSymbol = async (payload: AddSymbolPayload) => {
    await addSymbolMutation.mutateAsync(payload);
  };

  const handleRemoveSymbol = async (symbol: string) => {
    await removeSymbolMutation.mutateAsync(symbol);
    if (selectedSymbol === symbol) {
      setSelectedSymbol(null);
    }
  };

  const handleQuickAdd = async (symbolList: string[]) => {
    for (const sym of symbolList) {
      try {
        await addSymbolMutation.mutateAsync({ symbol: sym });
      } catch {
        // continue
      }
    }
  };

  const handleRefreshAll = () => {
    refetchLive();
    refetchDiffs();
  };

  return (
    <div className="fieldnote-shell flex h-screen overflow-hidden text-groww-dark font-sans">
      {/* Left Rail Desktop */}
      <LeftRail
        watchlists={watchlists}
        selectedId={selectedWatchlistId}
        onSelectWatchlist={(id) => {
          setSelectedWatchlistId(id);
          setSelectedSymbol(null);
          setIsMobileRailOpen(false);
        }}
        onOpenNewWatchlist={() => setIsNewWatchlistOpen(true)}
        className="hidden lg:flex"
      />

      {/* Mobile / Tablet Drawer Backdrop */}
      {isMobileRailOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileRailOpen(false)}
        >
          <div
            className="w-72 h-full bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <LeftRail
              watchlists={watchlists}
              selectedId={selectedWatchlistId}
              onSelectWatchlist={(id) => {
                setSelectedWatchlistId(id);
                setSelectedSymbol(null);
                setIsMobileRailOpen(false);
              }}
              onOpenNewWatchlist={() => {
                setIsNewWatchlistOpen(true);
                setIsMobileRailOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          watchlistTitle={activeWatchlist.name}
          symbolCount={liveSymbols.length}
          onOpenAddSymbol={() => setIsAddSymbolOpen(true)}
          onToggleSidebar={() => setIsMobileRailOpen((prev) => !prev)}
          socketState={socketState}
          activePage={activePage}
          onNavigate={setActivePage}
        />

        {activePage === 'diff' ? (
          <DiffEnginePage
            watchlistName={activeWatchlist.name}
            diffs={diffs}
            isLoading={isLoadingDiffs}
            onMarkChecked={() => markCheckedMutation.mutate()}
            isMarkingChecked={markCheckedMutation.isPending}
          />
        ) : <main className="p-4 sm:p-6 lg:px-8 lg:py-7 space-y-6 max-w-[1360px] mx-auto w-full">
          {isLoadingSymbols && liveSymbols.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-groww-muted gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-groww-teal" />
              <span className="text-xs font-semibold">Loading market radar stream...</span>
            </div>
          ) : liveSymbols.length === 0 ? (
            <EmptyWatchlist
              watchlistName={activeWatchlist.name}
              onOpenAddSymbol={() => setIsAddSymbolOpen(true)}
              onQuickAdd={handleQuickAdd}
            />
          ) : (
            <>
              {/* Hero section: "Since you last checked" summary line */}
              <SinceYouChecked
                watchlistName={activeWatchlist.name}
                diffs={diffs}
                totalSymbols={liveRows.length}
                onRefresh={handleRefreshAll}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />

              {/* Horizontal diffstrip of flagged symbols */}
              <DiffStrip
                symbols={liveRows}
                onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                selectedSymbol={selectedSymbol}
              />

              {/* Main table */}
              <WatchlistTable
                symbols={liveRows}
                onRemoveSymbol={handleRemoveSymbol}
                lastUpdatedSymbol={socketState.lastUpdatedSymbol}
                lastUpdateDirection={socketState.lastUpdateDirection}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={(sym) => setSelectedSymbol(sym === selectedSymbol ? null : sym)}
                activeFilter={activeFilter}
              />
            </>
          )}
        </main>}
      </div>

      {/* Modals */}
      <AddSymbolModal
        isOpen={isAddSymbolOpen}
        onClose={() => setIsAddSymbolOpen(false)}
        onAddSymbol={handleAddSymbol}
      existingSymbols={liveRows.map((s) => s.symbol)}
        watchlistName={activeWatchlist.name}
      />

      <NewWatchlistModal
        isOpen={isNewWatchlistOpen}
        onClose={() => setIsNewWatchlistOpen(false)}
        onCreateWatchlist={handleCreateWatchlist}
        existingNames={watchlists.map((w) => w.name)}
      />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuth());

  const handleAuthenticated = (nextSession: AuthSession) => {
    queryClient.clear();
    setSession(nextSession);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {session ? <FieldnoteDashboard /> : <AuthScreen onAuthenticated={handleAuthenticated} />}
    </QueryClientProvider>
  );
}
