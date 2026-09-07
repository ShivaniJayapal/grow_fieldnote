import React, { useState } from 'react';
import { X, FolderPlus, AlertCircle } from 'lucide-react';
import { CreateWatchlistPayload } from '../../api/types';

interface NewWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWatchlist: (payload: CreateWatchlistPayload) => Promise<void>;
  existingNames: string[];
}

export const NewWatchlistModal: React.FC<NewWatchlistModalProps> = ({
  isOpen,
  onClose,
  onCreateWatchlist,
  existingNames,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setError('Watchlist name is required.');
      return;
    }

    if (cleanName.length < 2) {
      setError('Watchlist name must be at least 2 characters.');
      return;
    }

    if (existingNames.some((n) => n.toLowerCase() === cleanName.toLowerCase())) {
      setError(`A watchlist named "${cleanName}" already exists.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateWatchlist({ name: cleanName, description: description.trim() || undefined });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create watchlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border border-groww-border rounded-3xl shadow-groww-dropdown overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-groww-border flex items-center justify-between bg-groww-subtle/40">
          <h3 className="text-base font-bold text-groww-heading flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-groww-teal stroke-[2.5]" />
            <span>Create New Watchlist</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-groww-muted hover:text-groww-heading hover:bg-groww-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-groww-body mb-1.5">
              Watchlist Name <span className="text-groww-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Clean Energy, Software SaaS, High Beta"
              maxLength={40}
              autoFocus
              className="w-full bg-groww-subtle/80 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-groww-border text-groww-heading placeholder-groww-dim focus:bg-white focus:outline-none focus:border-groww-teal focus:ring-1 focus:ring-groww-teal transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-groww-body mb-1.5">
              Description / Focus Area (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Tracking supply chain shifts and high institutional accumulation"
              className="w-full bg-groww-subtle/80 text-xs font-medium px-3.5 py-2 rounded-xl border border-groww-border text-groww-heading placeholder-groww-dim focus:bg-white focus:outline-none focus:border-groww-teal"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-groww-red bg-groww-redLight p-2.5 rounded-xl border border-groww-redBorder font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

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
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-groww-teal hover:bg-groww-tealHover disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-groww-teal/25 flex items-center gap-1.5"
            >
              <span>{isSubmitting ? 'Creating...' : 'Create Watchlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
