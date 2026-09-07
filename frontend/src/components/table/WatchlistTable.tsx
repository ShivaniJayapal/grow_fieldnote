import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Search,
  Filter,
  Flame,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { WatchlistSymbolLive } from '../../api/types';
import { AttentionMeter } from './AttentionMeter';
import { Sparkline } from './Sparkline';
import { StatusBadge } from './StatusBadge';
import { VolumeBar } from './VolumeBar';

interface WatchlistTableProps {
  symbols: WatchlistSymbolLive[];
  onRemoveSymbol: (symbol: string) => void;
  lastUpdatedSymbol?: string | null;
  lastUpdateDirection?: 'up' | 'down' | null;
  selectedSymbol?: string | null;
  onSelectSymbol?: (symbol: string) => void;
  activeFilter?: 'all' | 'flagged' | 'high-volume';
}

function formatAge(updatedAt?: string): string {
  if (!updatedAt) return 'Updated time unavailable';
  const ageSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(updatedAt)) / 1000));
  if (!Number.isFinite(ageSeconds)) return 'Updated time unavailable';
  if (ageSeconds < 60) return `Last updated ${ageSeconds}s ago`;
  return `Last updated ${Math.floor(ageSeconds / 60)}m ago`;
}

type SortField = 'attentionScore' | 'symbol' | 'price' | 'changePct' | 'volumeRatio';
type SortOrder = 'asc' | 'desc';

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  symbols,
  onRemoveSymbol,
  lastUpdatedSymbol,
  lastUpdateDirection,
  selectedSymbol,
  onSelectSymbol,
  activeFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('attentionScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    symbols.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [symbols]);

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered and sorted dataset
  const processedSymbols = useMemo(() => {
    return symbols
      .filter((item) => {
        if (activeFilter === 'flagged' && !item.sinceLastCheckedFlagged) {
          return false;
        }
        if (activeFilter === 'high-volume' && item.volumeRatio < 1.5) {
          return false;
        }

        if (selectedTag && !item.tags.includes(selectedTag)) {
          return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.symbol.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.why.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [symbols, activeFilter, selectedTag, searchQuery, sortField, sortOrder]);

  const confirmDelete = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (deletingSymbol === symbol) {
      onRemoveSymbol(symbol);
      setDeletingSymbol(null);
    } else {
      setDeletingSymbol(symbol);
      setTimeout(() => setDeletingSymbol(null), 3000);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-groww-dim opacity-60 group-hover:opacity-100" />;
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-groww-teal" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-groww-teal" />
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Table controls: Search and Tag pills */}
      <div className="fieldnote-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groww-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, ticker, reason..."
            className="w-full bg-groww-subtle/70 pl-10 pr-3.5 py-2 rounded-xl border border-groww-border text-xs text-groww-heading placeholder-groww-dim focus:outline-none focus:border-groww-teal focus:ring-1 focus:ring-groww-teal transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-groww-muted hover:text-groww-heading font-semibold"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-[11px] text-groww-muted font-bold uppercase tracking-wider flex items-center gap-1 pl-1">
              <Filter className="w-3 h-3" />
              Tags:
            </span>
            {allTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(active ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-groww-teal text-white shadow-xs'
                      : 'bg-groww-subtle text-groww-body hover:bg-groww-border/80 hover:text-groww-heading border border-groww-border/60'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-groww-teal hover:underline font-semibold ml-1"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table Structure */}
      <div className="fieldnote-panel rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-groww-border bg-groww-subtle/55 text-[10px] font-bold uppercase tracking-wider text-groww-muted">
                <th
                  onClick={() => handleSort('attentionScore')}
                  className="py-3 px-4 cursor-pointer group hover:text-groww-heading w-28"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Attention</span>
                    {renderSortIndicator('attentionScore')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('symbol')}
                  className="py-3 px-4 cursor-pointer group hover:text-groww-heading w-44"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Symbol</span>
                    {renderSortIndicator('symbol')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-4 cursor-pointer group hover:text-groww-heading text-right w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Price</span>
                    {renderSortIndicator('price')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('changePct')}
                  className="py-3 px-4 cursor-pointer group hover:text-groww-heading text-right w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>% Change</span>
                    {renderSortIndicator('changePct')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('volumeRatio')}
                  className="py-3 px-4 cursor-pointer group hover:text-groww-heading w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Vol vs 20D</span>
                    {renderSortIndicator('volumeRatio')}
                  </div>
                </th>

                <th className="py-3 px-3 text-center w-28">
                  <span>Intraday</span>
                </th>

                <th className="py-3 px-4 flex-1">
                  <span>Why It's Here (Catalyst & Context)</span>
                </th>

                <th className="py-3 px-4 w-24 text-center">
                  <span>Status</span>
                </th>

                <th className="py-3 px-3 w-12 text-center">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-groww-border/80 text-sm">
              {processedSymbols.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <p className="text-groww-muted text-sm font-medium">No symbols match the current search or filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTag(null);
                      }}
                      className="mt-2 text-xs text-groww-teal hover:underline font-bold"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                processedSymbols.map((item) => {
                  const isUp = item.changePct >= 0;
                  const isTickTarget = lastUpdatedSymbol === item.symbol;
                  const isSelected = selectedSymbol === item.symbol;

                  // Tick flash background style with Groww green/red
                  let rowFlashClass = '';
                  if (isTickTarget) {
                    rowFlashClass =
                      lastUpdateDirection === 'up'
                        ? 'bg-groww-tealLight/80 transition-colors duration-300'
                        : 'bg-groww-redLight/80 transition-colors duration-300';
                  }
                  const diffFlaggedClass = item.sinceLastCheckedFlagged
                    ? 'bg-groww-amberLight/40'
                    : '';

                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => onSelectSymbol?.(item.symbol)}
                      className={`group hover:bg-groww-subtle/60 transition-all duration-150 cursor-pointer ${
                        isSelected ? 'bg-groww-tealLight/40' : diffFlaggedClass
                      } ${rowFlashClass}`}
                    >
                      {/* 1. Attention Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <AttentionMeter score={item.attentionScore} />
                      </td>

                      {/* 2. Symbol + Company Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-groww-heading text-[14px] tracking-tight group-hover:text-groww-teal transition-colors">
                              {item.symbol}
                            </span>
                            {item.attentionScore >= 85 && (
                              <span title="High attention priority">
                                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs text-groww-muted font-medium truncate max-w-[140px]"
                            title={item.companyName}
                          >
                            {item.companyName}
                          </span>
                        </div>
                      </td>

                      {/* 3. Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono text-[13px] font-bold text-groww-heading tabular-nums">
                        <span
                          className="text-groww-heading"
                        >
                          ${item.price.toFixed(2)}
                        </span>
                      </td>

                      {/* 4. % Change */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold tabular-nums px-2.5 py-1 rounded-full ${
                            isUp
                              ? 'bg-groww-tealLight text-groww-tealDark border border-groww-tealBorder'
                              : 'bg-groww-redLight text-groww-red border border-groww-redBorder'
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <TrendingDown className="w-3 h-3 stroke-[3]" />
                          )}
                          <span>
                            {isUp ? '+' : ''}
                            {item.changePct.toFixed(2)}%
                          </span>
                        </span>
                      </td>

                      {/* 5. Volume vs 20-day average */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <VolumeBar ratio={item.volumeRatio} />
                      </td>

                      {/* 6. Intraday Sparkline */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex justify-center">
                          <Sparkline data={item.sparkline} changePct={item.changePct} width={74} height={24} />
                        </div>
                      </td>

                      {/* 7. Why it's here + Tag labels */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 max-w-xl">
                          <p className="text-xs text-groww-dark font-medium leading-relaxed line-clamp-2">
                            <span className="block">Today: {isUp ? '+' : ''}{item.changePct.toFixed(2)}%{item.why ? ` · ${item.why}` : ''}</span>
                            {item.sinceLastCheckedPct !== undefined && (
                              <span className="block text-groww-muted">
                                Since you checked: {item.sinceLastCheckedPct >= 0 ? '+' : ''}{item.sinceLastCheckedPct.toFixed(2)}%
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-groww-subtle text-groww-body border border-groww-border"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* 8. Live / Delayed status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={item.dataStatus} />
                          <span className="text-[10px] text-groww-muted font-medium whitespace-nowrap">{formatAge(item.updatedAt)}</span>
                        </div>
                      </td>

                      {/* 9. Delete action */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => confirmDelete(e, item.symbol)}
                          title={
                            deletingSymbol === item.symbol
                              ? 'Click again to confirm removal'
                              : 'Remove symbol'
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            deletingSymbol === item.symbol
                              ? 'bg-groww-red text-white animate-pulse'
                              : 'text-groww-dim hover:text-groww-red hover:bg-groww-redLight'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-groww-subtle/80 px-4 py-2.5 border-t border-groww-border flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-groww-muted gap-2">
          <div>
            Showing <span className="text-groww-heading font-bold">{processedSymbols.length}</span> of{' '}
            <span className="text-groww-heading font-bold">{symbols.length}</span> tracked symbols
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-groww-teal animate-pulse" />
              Live tick stream connected
            </span>
            <span className="font-mono">Sort: {sortField} ({sortOrder})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
