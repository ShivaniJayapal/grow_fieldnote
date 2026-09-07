import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

interface SparklineProps {
  data?: number[];
  changePct?: number;
  width?: number | string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  changePct = 0,
  width = 80,
  height = 24,
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-groww-dim font-mono"
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  const isPositive = changePct >= 0;
  // Groww palette: Teal for up, warm red for down
  const strokeColor = isPositive ? '#00D09C' : '#eb5b3c';

  const chartData = data.map((val, idx) => ({ i: idx, value: val }));

  return (
    <div style={{ width, height }} className="overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
