import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { WatchlistSymbolLive } from '../../api/types';

interface DiffStripProps {
  symbols: WatchlistSymbolLive[];
  onSelectSymbol?: (symbol: string) => void;
  selectedSymbol?: string | null;
}

export const DiffStrip: React.FC<DiffStripProps> = ({
  symbols,
  onSelectSymbol,
  selectedSymbol,
}) => {
  const displayItems = symbols.filter((symbol) => symbol.attentionScore >= 60).slice(0, 5);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groww-body">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Flagged Anomalies (High Signal vs Routine Noise)</span>
        </div>
        <span className="text-[11px] font-semibold text-groww-muted">
          {displayItems.length} active catalysts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {displayItems.map((item) => {
          const isUp = item.changePct >= 0;
          const isSelected = selectedSymbol === item.symbol;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol?.(item.symbol)}
              className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-groww-tealLight/40 border-groww-teal shadow-md ring-1 ring-groww-teal'
                  : 'bg-white hover:bg-white border-groww-border hover:border-groww-borderStrong hover:shadow-groww-hover shadow-groww'
              }`}
            >
              {/* Top: Ticker, Attention score, Change Pill */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-groww-heading tracking-tight group-hover:text-groww-teal transition-colors">
                      {item.symbol}
                    </span>
                    {item.attentionScore && item.attentionScore >= 85 && (
                      <span className="px-1.5 py-[1px] rounded-full text-[9px] font-mono font-bold bg-groww-amberLight text-amber-800 border border-groww-amberBorder">
                        {item.attentionScore}
                      </span>
                    )}
                  </div>
                  {item.companyName && (
                    <div className="text-xs text-groww-muted font-medium truncate max-w-[130px]" title={item.companyName}>
                      {item.companyName}
                    </div>
                  )}
                </div>

                {/* % Change Pill */}
                <div
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums ${
                    isUp
                      ? 'bg-groww-tealLight text-groww-tealDark border border-groww-tealBorder'
                      : 'bg-groww-redLight text-groww-red border border-groww-redBorder'
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>
                    {isUp ? '+' : ''}
                    {item.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* One-line "why" */}
              <p
                className="text-xs text-groww-body font-normal line-clamp-2 leading-relaxed mb-3"
                title={item.why}
              >
                {item.why}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1 pt-2.5 border-t border-groww-border/80 mt-auto">
                {item.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-groww-subtle text-groww-body border border-groww-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
