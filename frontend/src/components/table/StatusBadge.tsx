import React from 'react';

interface StatusBadgeProps {
  status: 'live' | 'delayed';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const isLive = status === 'live';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold ${
        isLive
          ? 'bg-groww-tealLight text-groww-tealDark border border-groww-tealBorder'
          : 'bg-groww-amberLight text-amber-800 border border-groww-amberBorder'
      } ${className}`}
      title={isLive ? 'Real-time exchange feed active' : 'Data delayed by 15 minutes'}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-groww-teal opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            isLive ? 'bg-groww-teal' : 'bg-amber-500'
          }`}
        />
      </span>
      <span>{isLive ? 'Live' : 'Delayed'}</span>
    </div>
  );
};
