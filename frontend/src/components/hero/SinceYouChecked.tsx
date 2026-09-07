import React from 'react';
import { Sparkles, Clock, AlertTriangle, RotateCw, CheckCircle2 } from 'lucide-react';
import { WatchlistDiffItem } from '../../api/types';

interface SinceYouCheckedProps {
  watchlistName: string;
  diffs: WatchlistDiffItem[];
  totalSymbols: number;
  onRefresh?: () => void;
  activeFilter: 'all' | 'flagged' | 'high-volume';
  onFilterChange: (filter: 'all' | 'flagged' | 'high-volume') => void;
}

export const SinceYouChecked: React.FC<SinceYouCheckedProps> = ({
  watchlistName,
  diffs,
  totalSymbols,
  onRefresh,
  activeFilter,
  onFilterChange,
}) => {
  const flaggedCount = diffs.filter((d) => d.flagged).length;
  const topUpMoves = diffs.filter((d) => d.changePct > 0);
  const topDownMoves = diffs.filter((d) => d.changePct < 0);
  const hasSmallWatchlist = totalSymbols < 3;

  return (
    <div className="fieldnote-panel relative overflow-hidden bg-gradient-to-br from-white via-white to-groww-tealLight/70 p-5 sm:p-7 rounded-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left side: narrative summary */}
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-groww-teal">
            <span className="flex h-2 w-2 rounded-full bg-groww-teal animate-pulse" />
            <span className="fieldnote-kicker">Fieldnote Delta Briefing</span>
            <span className="text-groww-dim">•</span>
            <span className="text-groww-muted flex items-center gap-1 font-normal capitalize">
              <Clock className="w-3 h-3 text-groww-muted" />
              Since you last checked
            </span>
          </div>

          <h2 className="text-xl sm:text-[27px] font-extrabold text-groww-heading tracking-tight leading-[1.18] max-w-3xl">
            {totalSymbols === 0 ? (
              <span className="text-groww-muted font-medium">
                No symbols tracked in <span className="text-groww-heading font-bold">{watchlistName}</span> yet.
              </span>
            ) : flaggedCount > 0 ? (
              <span>
                Surfacing <strong className="text-groww-teal font-extrabold">{flaggedCount} flagged moves</strong>{' '}
                out of {totalSymbols} symbols in{' '}
                <strong className="text-groww-heading">{watchlistName}</strong> with high signal.
              </span>
            ) : (
              <span>
                All {totalSymbols} symbols in{' '}
                <strong className="text-groww-heading">{watchlistName}</strong> are trading within normal
                noise bands.
              </span>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-groww-body leading-relaxed font-medium">
            {flaggedCount > 0 ? (
              <>
                Catalysts detected:{' '}
                <span className="text-groww-dark font-semibold">
                  {topUpMoves.length > 0 && `${topUpMoves.length} positive breakout & block flows`}
                  {topUpMoves.length > 0 && topDownMoves.length > 0 && ', '}
                  {topDownMoves.length > 0 && `${topDownMoves.length} regulatory or guidance shifts`}
                </span>
                . Routine intra-day noise is filtered out.
              </>
            ) : (
              'No since-checked moves crossed the alert threshold. Live rows still show today\'s movement context.'
            )}
          </p>
        </div>

        {/* Right side: filter pills & actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <div className="flex items-center bg-groww-subtle p-1 rounded-xl border border-groww-border text-xs font-semibold">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-groww-heading shadow-xs border border-groww-border'
                  : 'text-groww-muted hover:text-groww-heading'
              }`}
            >
              All ({totalSymbols})
            </button>
            <button
              onClick={() => onFilterChange('flagged')}
              disabled={hasSmallWatchlist}
              title={hasSmallWatchlist ? 'Add more symbols to make comparisons meaningful' : undefined}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeFilter === 'flagged' && !hasSmallWatchlist
                  ? 'bg-groww-amberLight text-amber-900 border border-groww-amberBorder shadow-xs font-bold'
                  : 'text-groww-muted hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Flagged ({flaggedCount})
            </button>
            <button
              onClick={() => onFilterChange('high-volume')}
              disabled={hasSmallWatchlist}
              title={hasSmallWatchlist ? 'Add more symbols to make comparisons meaningful' : undefined}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeFilter === 'high-volume' && !hasSmallWatchlist
                  ? 'bg-groww-tealLight text-groww-tealDark border border-groww-tealBorder shadow-xs font-bold'
                  : 'text-groww-muted hover:text-groww-teal disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              High Vol (&gt;1.5x)
            </button>
          </div>

          {hasSmallWatchlist && (
            <span className="w-full text-[11px] text-groww-muted font-medium text-right">
              Add more symbols to see meaningful comparisons.
            </span>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Snapshot checkpoint refreshed"
              className="p-2 text-groww-muted hover:text-groww-heading hover:bg-groww-subtle rounded-xl border border-groww-border transition-colors shadow-2xs"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
