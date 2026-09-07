import React from 'react';

interface AttentionMeterProps {
  score: number; // 0 to 100
  showLabel?: boolean;
}

export const AttentionMeter: React.FC<AttentionMeterProps> = ({ score, showLabel = true }) => {
  const clamped = Math.min(100, Math.max(0, score));

  const isHigh = clamped >= 80;
  const isMedium = clamped >= 50 && clamped < 80;

  const barColor = isHigh
    ? 'bg-amber-500'
    : isMedium
    ? 'bg-groww-teal'
    : 'bg-zinc-300';

  const textColor = isHigh
    ? 'text-amber-700 font-bold'
    : isMedium
    ? 'text-groww-tealDark font-bold'
    : 'text-groww-muted font-medium';

  return (
    <div className="flex items-center gap-2" title={`Attention Score: ${clamped}/100`}>
      {/* 4-segment vertical bar meter */}
      <div className="flex items-end gap-[2px] h-6 w-3.5 bg-groww-subtle p-[2px] rounded-sm border border-groww-border">
        <div className="w-full flex flex-col justify-end gap-[1.5px] h-full">
          {[80, 60, 40, 20].map((threshold, idx) => {
            const active = clamped >= threshold;
            return (
              <div
                key={idx}
                className={`h-1 w-full rounded-[1px] transition-colors duration-300 ${
                  active ? barColor : 'bg-zinc-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {showLabel && (
        <span className={`font-mono text-xs tabular-nums ${textColor}`}>
          {clamped}
        </span>
      )}
    </div>
  );
};
