import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SentimentChartProps {
  data: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  const chartData = [
    { name: 'Tích Cực (Positive)', value: data.positive || 0, color: '#10b981' },
    { name: 'Trung Lập (Neutral)', value: data.neutral || 0, color: '#f59e0b' },
    { name: 'Tiêu Cực (Negative)', value: data.negative || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      return (
        <div className="glass-panel p-3 text-xs rounded-xl border border-white/10 shadow-xl bg-slate-900/90 text-gray-200">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-purple-400 font-mono mt-1">Số lượng: {value} ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-[320px]">
      <h3 className="font-semibold text-gray-200 text-sm mb-4 heading-font">
        Phân Phối Sắc Thái (Sentiment)
      </h3>
      <div className="flex-1 min-h-0 relative">
        {total === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-[11px] text-gray-400 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
