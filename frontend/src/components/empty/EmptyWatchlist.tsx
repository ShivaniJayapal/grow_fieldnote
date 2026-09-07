import React from 'react';
import { Plus, BarChart2, Sparkles, BookOpen, Layers } from 'lucide-react';

interface EmptyWatchlistProps {
  watchlistName: string;
  onOpenAddSymbol: () => void;
  onQuickAdd: (symbols: string[]) => void;
}

export const EmptyWatchlist: React.FC<EmptyWatchlistProps> = ({
  watchlistName,
  onOpenAddSymbol,
  onQuickAdd,
}) => {
  return (
    <div className="border border-groww-border rounded-3xl bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-groww">
      {/* Icon cluster with Groww Teal styling */}
      <div className="mx-auto w-16 h-16 rounded-2xl bg-groww-tealLight border border-groww-tealBorder flex items-center justify-center text-groww-teal mb-5 shadow-xs">
        <Layers className="w-8 h-8 stroke-[2.2]" />
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-groww-heading mb-2">
        No symbols in <span className="text-groww-teal font-mono">"{watchlistName}"</span> yet
      </h3>

      <p className="text-sm text-groww-body max-w-md mx-auto mb-6 leading-relaxed font-medium">
        Fieldnote tracks abnormal volume, earnings catalyst shifts, and attention spikes. Add your first
        symbol to begin separating meaningful market signal from daily noise.
      </p>

      {/* Primary CTA button with Groww Teal */}
      <button
        onClick={onOpenAddSymbol}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-groww-teal hover:bg-groww-tealHover text-white font-bold text-sm transition-all shadow-md shadow-groww-teal/25 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Add Your First Symbol</span>
      </button>

      {/* Starter presets */}
      <div className="mt-8 pt-8 border-t border-groww-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-groww-muted mb-3">
          Or start with a quick preset bundle:
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => onQuickAdd(['NVDA', 'TSM', 'ASML', 'ARM'])}
            className="px-3.5 py-2 rounded-xl bg-groww-subtle hover:bg-groww-tealLight text-groww-body hover:text-groww-tealDark border border-groww-border hover:border-groww-tealBorder text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Semiconductors (NVDA, TSM, ASML, ARM)</span>
          </button>

          <button
            onClick={() => onQuickAdd(['AAPL', 'MSFT', 'GOOGL', 'AMZN'])}
            className="px-3.5 py-2 rounded-xl bg-groww-subtle hover:bg-groww-tealLight text-groww-body hover:text-groww-tealDark border border-groww-border hover:border-groww-tealBorder text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <BarChart2 className="w-3.5 h-3.5 text-groww-teal" />
            <span>Mega Cap Tech (AAPL, MSFT, GOOGL)</span>
          </button>

          <button
            onClick={() => onQuickAdd(['PLTR', 'COIN', 'UBER', 'CRWD'])}
            className="px-3.5 py-2 rounded-xl bg-groww-subtle hover:bg-groww-tealLight text-groww-body hover:text-groww-tealDark border border-groww-border hover:border-groww-tealBorder text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-groww-blue" />
            <span>High Beta & Growth (PLTR, COIN, UBER)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
