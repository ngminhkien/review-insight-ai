import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AspectBarChartProps {
  data: Record<string, number>;
}

export const AspectBarChart: React.FC<AspectBarChartProps> = ({ data }) => {
  const chartData = Object.entries(data)
    .map(([key, value]) => ({
      name: key,
      count: value,
    }))
    .sort((a, b) => b.count - a.count);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 text-xs rounded-xl border border-white/10 shadow-xl bg-slate-900/90 text-gray-200">
          <p className="font-semibold text-purple-300 uppercase">{payload[0].payload.name}</p>
          <p className="text-gray-400 mt-1">Đề cập: <span className="text-white font-mono">{payload[0].value} lượt</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-[320px]">
      <h3 className="font-semibold text-gray-200 text-sm mb-4 heading-font">
        Phân Tích Khía Cạnh (Aspects)
      </h3>
      <div className="flex-1 min-h-0 relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: -5, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar 
                dataKey="count" 
                fill="url(#barGradient)" 
                radius={[0, 6, 6, 0]}
                barSize={16}
              >
                {/* Gradient Fill definition in Recharts can be passed as SVG */}
              </Bar>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0.85} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
