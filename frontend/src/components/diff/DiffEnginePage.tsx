import React from 'react';
import { CheckCheck, ChevronRight, Clock3, RefreshCw } from 'lucide-react';
import { WatchlistDiffItem } from '../../api/types';
import { AttentionMeter } from '../table/AttentionMeter';
import { StatusBadge } from '../table/StatusBadge';

interface DiffEnginePageProps {
  watchlistName: string;
  diffs: WatchlistDiffItem[];
  isLoading: boolean;
  onMarkChecked: () => void;
  isMarkingChecked: boolean;
}

function formatElapsed(timestamp: string | null): string {
  if (!timestamp) return 'first visit';
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function formatPrice(price: number | null | undefined): string {
  return price === null || price === undefined ? '—' : `$${price.toFixed(2)}`;
}

export const DiffEnginePage: React.FC<DiffEnginePageProps> = ({
  watchlistName,
  diffs,
  isLoading,
  onMarkChecked,
  isMarkingChecked,
}) => {
  const flagged = diffs.filter((item) => item.flagged);
  const unchanged = diffs.filter((item) => !item.flagged);
  const lastCheckedAt = diffs.find((item) => item.lastCheckedAt)?.lastCheckedAt || null;
  const hasPriorSnapshot = diffs.some((item) => item.lastCheckedAt);
  const canCompare = diffs.length >= 2 && hasPriorSnapshot;

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <section className="bg-white border border-groww-border rounded-2xl shadow-groww p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groww-teal">
              <Clock3 className="w-4 h-4" />
              <span>Diff Engine</span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-groww-heading tracking-tight">
              Since you last checked — {formatElapsed(lastCheckedAt)}
            </h2>
            <p className="mt-2 text-sm text-groww-muted">
              {lastCheckedAt
                ? `Last snapshot: ${new Date(lastCheckedAt).toLocaleString()}`
                : 'No snapshot has been recorded for this watchlist yet.'}
            </p>
          </div>
          <button
            onClick={onMarkChecked}
            disabled={isMarkingChecked || diffs.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-groww-teal text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMarkingChecked ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark as checked
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="bg-white border border-groww-border rounded-2xl p-12 text-center text-sm text-groww-muted">Loading comparison...</div>
      ) : !canCompare ? (
        <div className="bg-white border border-groww-border rounded-2xl p-12 text-center">
          <h3 className="text-lg font-bold text-groww-heading">Nothing to compare yet</h3>
          <p className="mt-2 text-sm text-groww-muted">Check back after your next visit to {watchlistName}.</p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-groww-teal">High signal</p>
                <h3 className="text-xl font-extrabold text-groww-heading">Flagged ({flagged.length})</h3>
              </div>
              <span className="text-xs text-groww-muted">Attention score 60+ triggers a flag</span>
            </div>
            {flagged.length === 0 ? (
              <div className="bg-white border border-groww-border rounded-2xl p-6 text-sm text-groww-muted">No flagged moves since your last check.</div>
            ) : flagged.map((item) => (
              <article key={item.symbol} className="bg-white border border-groww-amberBorder rounded-2xl shadow-groww p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="lg:w-48 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-extrabold text-groww-heading">{item.symbol}</span>
                      <AttentionMeter score={item.attentionScore || 0} />
                    </div>
                    <p className="mt-1 text-xs text-groww-muted truncate">{item.companyName || item.symbol}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-lg font-mono font-bold text-groww-heading">
                      <span>{formatPrice(item.priceAtLastCheck)}</span>
                      <ChevronRight className="w-4 h-4 text-groww-muted" />
                      <span>{formatPrice(item.priceNow)}</span>
                      <span className={item.changePct >= 0 ? 'text-groww-teal' : 'text-groww-red'}>
                        {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-groww-body">{item.why}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags?.map((tag) => <span key={tag} className="px-2 py-1 rounded-md bg-groww-subtle border border-groww-border text-[11px] font-semibold text-groww-body">{tag}</span>)}
                    </div>
                  </div>
                  <StatusBadge status={item.dataStatus || 'live'} />
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-groww-muted">Routine movement</p>
              <h3 className="text-xl font-extrabold text-groww-heading">Unchanged ({unchanged.length})</h3>
            </div>
            <div className="bg-white border border-groww-border rounded-2xl divide-y divide-groww-border">
              {unchanged.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between px-5 py-3.5">
                  <span className="font-bold text-sm text-groww-heading">{item.symbol}</span>
                  <span className={`font-mono text-sm font-semibold ${item.changePct >= 0 ? 'text-groww-teal' : 'text-groww-red'}`}>
                    {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
};