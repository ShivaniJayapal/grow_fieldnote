import React from 'react';
import {
  Menu,
  Plus,
  Radio,
  Zap,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { SocketState } from '../../sockets/useSocketStub';

interface HeaderProps {
  watchlistTitle: string;
  symbolCount: number;
  onOpenAddSymbol: () => void;
  onToggleSidebar: () => void;
  socketState: SocketState;
  activePage?: 'dashboard' | 'diff';
  onNavigate?: (page: 'dashboard' | 'diff') => void;
}

export const Header: React.FC<HeaderProps> = ({
  watchlistTitle,
  symbolCount,
  onOpenAddSymbol,
  onToggleSidebar,
  socketState,
  activePage = 'dashboard',
  onNavigate,
}) => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-groww-border px-4 sm:px-7 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left side: Hamburger for mobile + Watchlist Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-groww-muted hover:text-groww-dark hover:bg-groww-subtle rounded-lg lg:hidden"
          title="Toggle Watchlists"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-baseline gap-3">
          <h1 className="text-lg sm:text-xl font-extrabold text-groww-heading tracking-tight leading-tight max-w-[150px]">
            {watchlistTitle}
          </h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-groww-subtle text-groww-body border border-groww-border">
            {symbolCount} {symbolCount === 1 ? 'symbol' : 'symbols'}
          </span>
        </div>

        {/* Groww-style Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-7 ml-8 self-stretch text-sm font-medium text-groww-body">
          <button onClick={() => onNavigate?.('dashboard')} className={`${activePage === 'dashboard' ? 'text-groww-teal font-semibold border-b-2 border-groww-teal' : 'hover:text-groww-heading'} cursor-pointer pb-1`}>
            Watchlist
          </button>
          <button onClick={() => onNavigate?.('diff')} className={`${activePage === 'diff' ? 'text-groww-teal font-semibold border-b-2 border-groww-teal' : 'hover:text-groww-heading'} cursor-pointer transition-colors pb-1`}>
            Diff Engine
          </button>
        </nav>
      </div>

      {/* Center/Right: Groww-style Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-groww-muted" />
          <input
            type="text"
            readOnly
            onClick={onOpenAddSymbol}
            placeholder="Search symbols, indices (e.g. NVDA)..."
            className="w-full bg-groww-subtle/70 hover:bg-white text-xs text-groww-dark pl-9 pr-12 py-2 rounded-lg border border-groww-border hover:border-groww-borderStrong focus:outline-none focus:border-groww-teal focus:ring-1 focus:ring-groww-teal cursor-pointer transition-all placeholder:text-groww-dim"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-groww-muted bg-white border border-groww-border rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right side: Live simulator & Primary CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Market Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-groww-subtle border border-groww-border text-[11px] font-semibold text-groww-body">
          <span className="w-2 h-2 rounded-full bg-groww-teal animate-pulse" />
          <span>MARKETS OPEN</span>
        </div>

        {/* Live Simulator Toggle */}
        <div className="flex items-center gap-1 bg-groww-subtle p-1 rounded-lg border border-groww-border text-xs">
          <button
            onClick={socketState.toggleSimulation}
            title={socketState.isSimulating ? 'Pause live market ticks' : 'Resume live market ticks'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              socketState.isSimulating
                ? 'bg-groww-teal text-white shadow-xs'
                : 'text-groww-body hover:text-groww-dark'
            }`}
          >
            <Radio className={`w-3 h-3 ${socketState.isSimulating ? 'animate-pulse' : ''}`} />
            <span className="hidden lg:inline">
              {socketState.isSimulating ? 'Live Feed' : 'Live: Off'}
            </span>
          </button>

          <button
            onClick={socketState.triggerManualTick}
            title="Simulate instant price flash"
            className="p-1 text-groww-muted hover:text-groww-teal hover:bg-white rounded transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Groww Signature Primary Action Button ("Get started / Add Symbol") */}
        <button
          onClick={onOpenAddSymbol}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-groww-teal hover:bg-groww-tealHover text-white text-xs font-bold shadow-md shadow-groww-teal/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Symbol</span>
        </button>
      </div>
    </header>
  );
};
