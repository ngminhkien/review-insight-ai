import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AspectBarChartProps {
  data?: Record<string, number>;
  breakdownData?: Record<string, Record<string, number>>;
}

export const AspectBarChart: React.FC<AspectBarChartProps> = ({ data, breakdownData }) => {
  let chartData: Record<string, any>[] = [];
  const hasBreakdown = !!breakdownData && Object.keys(breakdownData).length > 0;

  if (hasBreakdown && breakdownData) {
    chartData = Object.entries(breakdownData)
      .map(([key, counts]) => {
        const total = (counts.positive || 0) + (counts.neutral || 0) + (counts.negative || 0);
        return {
          name: key,
          positive: counts.positive || 0,
          neutral: counts.neutral || 0,
          negative: counts.negative || 0,
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  } else if (data) {
    chartData = Object.entries(data)
      .map(([key, value]) => ({
        name: key,
        count: value,
        total: value,
      }))
      .sort((a, b) => b.total - a.total);
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 text-xs rounded-xl border border-white/10 shadow-xl bg-slate-900/90 text-gray-200">
          <p className="font-semibold text-purple-300 uppercase mb-1">{data.name}</p>
          {hasBreakdown ? (
            <>
              <p className="text-emerald-400 mt-1">Tích cực: <span className="font-mono">{data.positive}</span></p>
              <p className="text-amber-400 mt-1">Trung lập: <span className="font-mono">{data.neutral}</span></p>
              <p className="text-rose-400 mt-1">Tiêu cực: <span className="font-mono">{data.negative}</span></p>
              <p className="text-gray-400 mt-1 border-t border-white/10 pt-1">Tổng cộng: <span className="text-white font-mono">{data.total}</span></p>
            </>
          ) : (
            <p className="text-gray-400 mt-1">Đề cập: <span className="text-white font-mono">{data.count} lượt</span></p>
          )}
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
              {hasBreakdown && <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />}
              
              {hasBreakdown ? (
                <>
                  <Bar dataKey="positive" name="Tích cực" stackId="a" fill="#10b981" barSize={16} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" name="Trung lập" stackId="a" fill="#f59e0b" barSize={16} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="negative" name="Tiêu cực" stackId="a" fill="#f43f5e" barSize={16} radius={[0, 6, 6, 0]} />
                </>
              ) : (
                <Bar 
                  dataKey="count" 
                  fill="url(#barGradient)" 
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                />
              )}
              
              {!hasBreakdown && (
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
