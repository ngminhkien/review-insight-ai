import React, { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/api';
import type { Review } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';

export const ProductComparisonPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selector states
  const [targetType, setTargetType] = useState<string>('product_type'); // 'product_type' or 'product_id'
  const [itemA, setItemA] = useState<string>('');
  const [itemB, setItemB] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.listReviews(500); // Fetch up to 500 reviews for good comparison stats
      setReviews(response.data);

      // Auto-populate selectors
      const types = Array.from(new Set(response.data.map(r => r.product_type).filter(Boolean)));
      if (types.length >= 2) {
        setItemA(types[0] as string);
        setItemB(types[1] as string);
      } else if (types.length > 0) {
        setItemA(types[0] as string);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể lấy dữ liệu phân tích để so sánh. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute unique items list based on selector
  const availableItems = useMemo(() => {
    const key = targetType === 'product_type' ? 'product_type' : 'product_id';
    return Array.from(new Set(reviews.map(r => r[key]).filter(Boolean))) as string[];
  }, [reviews, targetType]);

  // Handle source switch
  const handleTypeSwitch = (type: string) => {
    setTargetType(type);
    const key = type === 'product_type' ? 'product_type' : 'product_id';
    const items = Array.from(new Set(reviews.map(r => r[key]).filter(Boolean))) as string[];
    if (items.length >= 2) {
      setItemA(items[0]);
      setItemB(items[1]);
    } else {
      setItemA(items[0] || '');
      setItemB(items[1] || '');
    }
  };

  // Compute statistics for Item A and Item B
  const comparisonData = useMemo(() => {
    const key = targetType === 'product_type' ? 'product_type' : 'product_id';
    const reviewsA = reviews.filter(r => r[key] === itemA);
    const reviewsB = reviews.filter(r => r[key] === itemB);

    const getStats = (list: Review[], name: string) => {
      const total = list.length;
      const pos = list.filter(r => r.sentiment === 'positive').length;
      const neu = list.filter(r => r.sentiment === 'neutral').length;
      const neg = list.filter(r => r.sentiment === 'negative').length;
      
      const ratingSum = list.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      const avgRating = total > 0 ? (ratingSum / total).toFixed(1) : '0.0';

      const highPriority = list.filter(r => r.priority === 'high').length;

      // Aspect count
      const aspects: Record<string, number> = {};
      list.forEach(r => {
        if (!r.aspects) return;
        const aspectList = Array.isArray(r.aspects) 
          ? r.aspects 
          : typeof r.aspects === 'string'
            ? r.aspects.split(',').map(s => s.trim())
            : [];
        aspectList.forEach(a => {
          if (a) aspects[a] = (aspects[a] || 0) + 1;
        });
      });

      return {
        name,
        total,
        positive: pos,
        neutral: neu,
        negative: neg,
        avgRating: Number(avgRating),
        highPriority,
        positivePct: total > 0 ? Number(((pos / total) * 100).toFixed(1)) : 0,
        negativePct: total > 0 ? Number(((neg / total) * 100).toFixed(1)) : 0,
        neutralPct: total > 0 ? Number(((neu / total) * 100).toFixed(1)) : 0,
        aspects,
      };
    };

    return {
      a: getStats(reviewsA, itemA || 'Sản phẩm A'),
      b: getStats(reviewsB, itemB || 'Sản phẩm B'),
    };
  }, [reviews, targetType, itemA, itemB]);

  // Chart data for Sentiment Comparison
  const sentimentChartData = [
    {
      name: 'Tích Cực (%)',
      [comparisonData.a.name]: comparisonData.a.positivePct,
      [comparisonData.b.name]: comparisonData.b.positivePct,
    },
    {
      name: 'Trung Lập (%)',
      [comparisonData.a.name]: comparisonData.a.neutralPct,
      [comparisonData.b.name]: comparisonData.b.neutralPct,
    },
    {
      name: 'Tiêu Cực (%)',
      [comparisonData.a.name]: comparisonData.a.negativePct,
      [comparisonData.b.name]: comparisonData.b.negativePct,
    },
  ];

  // Aspect union for comparison list
  const aspectChartData = useMemo(() => {
    const keysA = Object.keys(comparisonData.a.aspects);
    const keysB = Object.keys(comparisonData.b.aspects);
    const allAspectKeys = Array.from(new Set([...keysA, ...keysB]));

    return allAspectKeys.map(key => ({
      aspect: key.toUpperCase(),
      [comparisonData.a.name]: comparisonData.a.aspects[key] || 0,
      [comparisonData.b.name]: comparisonData.b.aspects[key] || 0,
    })).sort((x, y) => {
      const sumX = (x[comparisonData.a.name] as number) + (x[comparisonData.b.name] as number);
      const sumY = (y[comparisonData.a.name] as number) + (y[comparisonData.b.name] as number);
      return sumY - sumX;
    }).slice(0, 6); // Top 6 aspects
  }, [comparisonData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-semibold">Đang tổng hợp thông tin so sánh...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-md mx-auto text-center gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-gray-200">Không thể tải dữ liệu</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-white/5 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white heading-font flex items-center gap-2">
          <BarChart3 className="text-purple-400 w-7 h-7" /> So sánh Sản phẩm & Ngành hàng
        </h2>
        <p className="text-sm text-gray-400">So sánh chi tiết thống kê biểu đồ sắc thái và phản hồi khách hàng giữa các nhóm sản phẩm.</p>
      </div>

      {/* Selectors Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        {/* Toggle Target */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-400">So sánh theo:</span>
          <div className="flex p-0.5 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => handleTypeSwitch('product_type')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                targetType === 'product_type'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Ngành Hàng
            </button>
            <button
              onClick={() => handleTypeSwitch('product_id')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                targetType === 'product_id'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Mã Sản Phẩm (SKU)
            </button>
          </div>
        </div>

        {/* Item A / Item B Dropdowns */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-400 shrink-0">Đối tượng A:</span>
            <select
              value={itemA}
              onChange={(e) => setItemA(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500 w-full sm:w-40"
            >
              {availableItems.map(item => (
                <option key={item} value={item} className="bg-slate-900">{item}</option>
              ))}
            </select>
          </div>

          <div className="text-gray-500 font-bold shrink-0">VS</div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-400 shrink-0">Đối tượng B:</span>
            <select
              value={itemB}
              onChange={(e) => setItemB(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500 w-full sm:w-40"
            >
              {availableItems.filter(item => item !== itemA).map(item => (
                <option key={item} value={item} className="bg-slate-900">{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KPI Panel A */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">A</div>
            <h3 className="font-bold text-gray-200 text-sm capitalize">{comparisonData.a.name || 'Trống'}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/35 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Đánh giá</span>
              <span className="text-base font-extrabold text-white font-mono mt-0.5 block">{comparisonData.a.total}</span>
            </div>
            <div className="bg-black/35 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Điểm TB</span>
              <span className="text-base font-extrabold text-purple-300 font-mono mt-0.5 block">{comparisonData.a.avgRating}★</span>
            </div>
            <div className="bg-black/35 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Hài lòng</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">{comparisonData.a.positivePct}%</span>
            </div>
          </div>
        </div>

        {/* KPI Panel B */}
        <div className="glass-panel p-6 rounded-2xl border border-pink-500/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-xs">B</div>
            <h3 className="font-bold text-gray-200 text-sm capitalize">{comparisonData.b.name || 'Trống'}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-black/35 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Đánh giá</span>
              <span className="text-base font-extrabold text-white font-mono mt-0.5 block">{comparisonData.b.total}</span>
            </div>
            <div className="bg-black/35 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Điểm TB</span>
              <span className="text-base font-extrabold text-pink-300 font-mono mt-0.5 block">{comparisonData.b.avgRating}★</span>
            </div>
            <div className="bg-black/35 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase">Hài lòng</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block">{comparisonData.b.positivePct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Charts */}
      {(!itemA || !itemB) ? (
        <div className="glass-panel p-16 rounded-2xl border border-white/5 text-center text-gray-500 text-xs">
          Vui lòng chọn đủ 2 đối tượng khác nhau để tiến hành so sánh.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Sentiment comparison chart */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col h-[350px]">
            <h3 className="font-semibold text-gray-200 text-sm mb-4 heading-font">
              So Sánh Tỷ Lệ Sắc Thái Cảm Xúc (%)
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(val) => <span className="text-xs text-gray-400 capitalize">{val}</span>} />
                  <Bar dataKey={comparisonData.a.name} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey={comparisonData.b.name} fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Aspect comparison chart */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col h-[350px]">
            <h3 className="font-semibold text-gray-200 text-sm mb-4 heading-font">
              So Sánh Đề Cập Khía Cạnh (Số lượt)
            </h3>
            <div className="flex-1 min-h-0">
              {aspectChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  Không tìm thấy dữ liệu so sánh khía cạnh.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aspectChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="aspect" stroke="#6b7280" fontSize={9} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                    <Legend iconType="circle" iconSize={8} formatter={(val) => <span className="text-xs text-gray-400 capitalize">{val}</span>} />
                    <Bar dataKey={comparisonData.a.name} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey={comparisonData.b.name} fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
