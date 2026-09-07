import React from 'react';

interface VolumeBarProps {
  ratio: number;
}

export const VolumeBar: React.FC<VolumeBarProps> = ({ ratio }) => {
  const isHighVolume = ratio >= 2.0;
  const isElevated = ratio >= 1.3 && ratio < 2.0;

  const clampedWidth = Math.min(100, Math.max(10, (ratio / 3.5) * 100));

  return (
    <div className="flex flex-col gap-1 w-24" title={`Current volume is ${ratio}x the 20-day average`}>
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span
          className={`tabular-nums font-bold ${
            isHighVolume
              ? 'text-amber-600'
              : isElevated
              ? 'text-groww-dark'
              : 'text-groww-muted'
          }`}
        >
          {ratio.toFixed(1)}x
        </span>
        <span className="text-[10px] text-groww-dim uppercase tracking-tight font-medium">avg</span>
      </div>

      <div className="h-1.5 w-full bg-groww-subtle rounded-full overflow-hidden border border-groww-border/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHighVolume
              ? 'bg-amber-500'
              : isElevated
              ? 'bg-groww-teal'
              : 'bg-zinc-300'
          }`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
    </div>
  );
};
