import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Smartphone } from 'lucide-react';

interface ProductSentimentChartProps {
  data?: Record<string, Record<string, number>>;
}

export const ProductSentimentChart: React.FC<ProductSentimentChartProps> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Format data for Recharts: [{ product: "iPhone 17", positive: 84, neutral: 41, negative: 73 }, ...]
  const chartData = Object.entries(data).map(([product, counts]) => ({
    product: product.toUpperCase(),
    positive: counts.positive || 0,
    neutral: counts.neutral || 0,
    negative: counts.negative || 0,
    total: (counts.positive || 0) + (counts.neutral || 0) + (counts.negative || 0)
  })).sort((a, b) => b.total - a.total); // Sort by most reviewed product first

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 text-xs rounded-xl border border-white/10 shadow-xl bg-slate-900/90 text-gray-200">
          <p className="font-bold text-fuchsia-300 uppercase mb-2">{label}</p>
          <p className="text-emerald-400 mt-1">Tích cực: <span className="font-mono">{data.positive}</span></p>
          <p className="text-amber-400 mt-1">Trung lập: <span className="font-mono">{data.neutral}</span></p>
          <p className="text-rose-400 mt-1">Tiêu cực: <span className="font-mono">{data.negative}</span></p>
          <p className="text-gray-400 mt-2 border-t border-white/10 pt-2 font-semibold">Tổng đánh giá: <span className="text-white font-mono">{data.total}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
      <div className="flex items-center gap-2 mb-6">
        <Smartphone className="w-5 h-5 text-fuchsia-400" />
        <h3 className="font-bold text-gray-200 text-sm heading-font">
          Cảm Xúc Theo Dòng Sản Phẩm
        </h3>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="product" 
              tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
            />
            
            <Bar dataKey="positive" name="Tích cực" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="neutral" name="Trung lập" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="negative" name="Tiêu cực" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
