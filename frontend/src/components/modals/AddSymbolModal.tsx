import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { AddSymbolPayload } from '../../api/types';

const SUGGESTED_SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'AMD', 'TSM', 'PLTR'];

interface AddSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSymbol: (payload: AddSymbolPayload) => Promise<void>;
  existingSymbols: string[];
  watchlistName: string;
}

const AVAILABLE_TAGS = [
  'Volume',
  'Earnings',
  'Breakout',
  'Guidance',
  'Downgrade',
  'FDA Approval',
  'Catalyst',
  'Macro',
  'M&A',
  'Consolidation',
];

export const AddSymbolModal: React.FC<AddSymbolModalProps> = ({
  isOpen,
  onClose,
  onAddSymbol,
  existingSymbols,
  watchlistName,
}) => {
  const [symbolInput, setSymbolInput] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [whyInput, setWhyInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Volume']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSymbolInput('');
      setCompanyNameInput('');
      setWhyInput('');
      setSelectedTags(['Volume']);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedInput = symbolInput.trim().toUpperCase();

  const handleInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    setSymbolInput(clean);

    if (!clean) {
      setError(null);
      return;
    }

    if (existingSymbols.includes(clean)) {
      setError(`"${clean}" is already in "${watchlistName}".`);
      return;
    }

    setError(null);

  };

  const selectSuggested = (symbol: string) => {
    handleInputChange(symbol);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!normalizedInput) {
      setError('Please enter a stock ticker symbol.');
      return;
    }

    if (normalizedInput.length < 1 || normalizedInput.length > 5) {
      setError('Ticker symbol must be 1 to 5 letters.');
      return;
    }

    if (existingSymbols.includes(normalizedInput)) {
      setError(`"${normalizedInput}" is already tracked in "${watchlistName}".`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onAddSymbol({
        symbol: normalizedInput,
        companyName: companyNameInput.trim() || undefined,
        why: whyInput.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : ['Manual Watch'],
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add symbol.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white border border-groww-border rounded-3xl shadow-groww-dropdown overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-groww-border flex items-center justify-between bg-groww-subtle/40">
          <div>
            <h3 className="text-base font-bold text-groww-heading">
              Add Symbol to Watchlist
            </h3>
            <p className="text-xs text-groww-muted mt-0.5 font-medium">
              Adding to <span className="text-groww-teal font-bold">"{watchlistName}"</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-groww-muted hover:text-groww-heading hover:bg-groww-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Symbol Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-groww-body mb-1.5">
              Ticker Symbol <span className="text-groww-red">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={symbolInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="e.g. NVDA, PLTR, AAPL"
                maxLength={5}
                autoFocus
                className={`w-full bg-groww-subtle/80 font-mono text-base font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border text-groww-heading placeholder-groww-dim focus:bg-white focus:outline-none transition-all ${
                  error
                    ? 'border-groww-red focus:ring-1 focus:ring-groww-red'
                    : 'border-groww-border focus:border-groww-teal focus:ring-1 focus:ring-groww-teal'
                }`}
              />
              {normalizedInput && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-groww-muted font-medium">
                  {normalizedInput.length}/5
                </span>
              )}
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-groww-red bg-groww-redLight p-2.5 rounded-xl border border-groww-redBorder">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div>
            <div className="text-[11px] font-bold text-groww-muted mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Suggested Tickers:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SYMBOLS.filter((symbol) => !existingSymbols.includes(symbol))
                .slice(0, 6)
                .map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => selectSuggested(symbol)}
                    className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-groww-subtle hover:bg-groww-tealLight text-groww-body hover:text-groww-tealDark transition-colors border border-groww-border"
                  >
                    + {symbol}
                  </button>
                ))}
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-groww-body mb-1.5">
              Company Name (Optional)
            </label>
            <input
              type="text"
              value={companyNameInput}
              onChange={(e) => setCompanyNameInput(e.target.value)}
              placeholder="e.g. NVIDIA Corporation"
              className="w-full bg-groww-subtle/80 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-groww-border text-groww-heading placeholder-groww-dim focus:bg-white focus:outline-none focus:border-groww-teal"
            />
          </div>

          {/* Why it's here */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-groww-body mb-1.5">
              Why It's Here (Catalyst / Observation Note)
            </label>
            <textarea
              value={whyInput}
              onChange={(e) => setWhyInput(e.target.value)}
              rows={2}
              placeholder="e.g. Q3 revenue beat +22%; elevated dark pool block volume detected..."
              className="w-full bg-groww-subtle/80 text-xs font-medium px-3.5 py-2 rounded-xl border border-groww-border text-groww-heading placeholder-groww-dim focus:bg-white focus:outline-none focus:border-groww-teal leading-relaxed"
            />
          </div>

          {/* Catalyst Tag Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-groww-body mb-1.5">
              Signal Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      isSelected
                        ? 'bg-groww-teal text-white border-groww-teal shadow-xs'
                        : 'bg-groww-subtle text-groww-body border-groww-border hover:border-groww-borderStrong hover:text-groww-heading'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-groww-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-groww-muted hover:text-groww-heading hover:bg-groww-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !normalizedInput || Boolean(error)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-groww-teal hover:bg-groww-tealHover disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-groww-teal/25 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isSubmitting ? 'Adding...' : 'Add Symbol'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
