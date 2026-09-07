import React from 'react';
import {
  Plus,
  Folder,
  Layers,
  Activity,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { WatchlistSummary } from '../../api/types';

interface LeftRailProps {
  watchlists: WatchlistSummary[];
  selectedId: string;
  onSelectWatchlist: (id: string) => void;
  onOpenNewWatchlist: () => void;
  onResetData?: () => void;
  className?: string;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  watchlists,
  selectedId,
  onSelectWatchlist,
  onOpenNewWatchlist,
  onResetData,
  className = '',
}) => {
  return (
    <aside
      className={`w-64 lg:w-[284px] bg-white/95 border-r border-groww-border flex flex-col h-screen shrink-0 shadow-sm ${className}`}
    >
      {/* Brand Header with Groww-inspired gradient mark */}
      <div className="h-20 px-5 border-b border-groww-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Circular logo mark with Groww Blue to Teal gradient */}
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-tr from-groww-blue via-[#38a3ff] to-groww-teal flex items-center justify-center text-white shadow-md shadow-groww-teal/20">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18l6-6 4 4 8-8" />
              <path d="M14 8h7v7" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-groww-heading">
                fieldnote
              </span>
              <span className="px-1.5 py-[1px] rounded-full text-[10px] font-semibold bg-groww-tealLight text-groww-tealDark border border-groww-tealBorder">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-groww-muted font-medium">Smart watchlist radar</p>
          </div>
        </div>
      </div>

      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <div>
          <div className="px-2.5 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-groww-muted">
            <span>Watchlists ({watchlists.length})</span>
            <button
              onClick={onOpenNewWatchlist}
              className="text-groww-teal hover:text-groww-tealHover p-1 hover:bg-groww-tealLight rounded-md transition-colors"
              title="Create new watchlist"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="space-y-1">
            {watchlists.map((wl) => {
              const isSelected = wl.id === selectedId;
              const hasFlagged = (wl.flaggedCount || 0) > 0;

              return (
                <button
                  key={wl.id}
                  onClick={() => onSelectWatchlist(wl.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between group relative ${
                    isSelected
                      ? 'bg-groww-tealLight text-groww-heading font-semibold border border-groww-tealBorder shadow-xs'
                      : 'text-groww-body hover:text-groww-heading hover:bg-groww-subtle border border-transparent'
                  }`}
                >
                  {/* Left accent bar for active item */}
                  {isSelected && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r bg-groww-teal" />
                  )}

                  <div className="flex items-center gap-2.5 truncate pl-1.5">
                    <Folder
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isSelected ? 'text-groww-teal' : 'text-groww-dim group-hover:text-groww-muted'
                      }`}
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold truncate leading-tight">{wl.name}</div>
                      {wl.lastUpdated && (
                        <div className="text-[10px] text-groww-muted font-normal mt-0.5">{wl.lastUpdated}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {hasFlagged && (
                      <span
                        className="px-1.5 py-[1px] rounded-full text-[10px] font-semibold bg-groww-amberLight text-amber-800 border border-groww-amberBorder"
                        title={`${wl.flaggedCount} symbols flagged for anomalous move`}
                      >
                        {wl.flaggedCount}
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-groww-muted px-2 py-0.5 rounded-full bg-groww-subtle border border-groww-border">
                      {wl.symbolCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* New Watchlist button in rail */}
        <div className="px-2">
          <button
            onClick={onOpenNewWatchlist}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-groww-borderStrong hover:border-groww-teal hover:bg-groww-tealLight/60 text-groww-body hover:text-groww-tealDark text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
          >
            <Plus className="w-3.5 h-3.5 text-groww-teal group-hover:scale-110 transition-transform stroke-[2.5]" />
            <span>Create New Watchlist</span>
          </button>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-3.5 border-t border-groww-border bg-groww-subtle/60 space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-groww-muted font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-groww-teal animate-pulse" />
            Exchange Gateway
          </span>
          <span className="text-groww-body font-mono font-semibold">99.98%</span>
        </div>

        {onResetData && (
          <button
            onClick={onResetData}
            className="w-full text-left flex items-center gap-1.5 text-[11px] text-groww-muted hover:text-groww-dark pt-1 transition-colors"
            title="Reset to default mock dataset"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        )}
      </div>
    </aside>
  );
};
