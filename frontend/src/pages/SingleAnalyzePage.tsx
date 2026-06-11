import React, { useState } from 'react';
import { apiService } from '../services/api';
import { Sparkles, RefreshCw, Send, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export const SingleAnalyzePage: React.FC = () => {
  const [text, setText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [productId, setProductId] = useState('');
  const [productType, setProductType] = useState('general');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.analyzeSingle({
        review_text: text,
        rating,
        product_id: productId || undefined,
        product_type: productType,
      });

      if (response.result) {
        setResult(response.result);
      } else {
        setError('Nhận kết quả thành công nhưng cấu trúc dữ liệu không đúng.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra trong quá trình gọi AI phân tích.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Tích cực (Positive)</span>;
      case 'neutral':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">Trung lập (Neutral)</span>;
      case 'negative':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase">Tiêu cực (Negative)</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 uppercase">{sentiment}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-white/5 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white heading-font flex items-center gap-2">
          <Sparkles className="text-purple-400 w-7 h-7 animate-pulse" /> Trình phân tích đánh giá đơn lẻ
        </h2>
        <p className="text-sm text-gray-400">Kiểm thử trực tiếp (Sandbox) khả năng phân tích cảm xúc, khía cạnh và độ ưu tiên của mô hình AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Form Controls */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5 glass-panel p-6 rounded-2xl border border-white/5 h-fit">
          <h3 className="font-semibold text-gray-200 text-sm mb-2 heading-font">Thông tin đánh giá</h3>
          
          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-semibold uppercase">Nội dung đánh giá</label>
            <textarea
              required
              rows={4}
              placeholder="Nhập nhận xét của khách hàng bằng tiếng Anh hoặc tiếng Việt..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rating Selector */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-semibold uppercase">Xếp hạng sao (Rating)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value={5} className="bg-slate-900">5★ (Xuất sắc)</option>
                <option value={4} className="bg-slate-900">4★ (Tốt)</option>
                <option value={3} className="bg-slate-900">3★ (Trung bình)</option>
                <option value={2} className="bg-slate-900">2★ (Tệ)</option>
                <option value={1} className="bg-slate-900">1★ (Rất tệ)</option>
              </select>
            </div>

            {/* Product Type Dropdown */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-semibold uppercase">Ngành hàng (Product Type)</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value="general" className="bg-slate-900">Tổng Hợp (General)</option>
                <option value="phone" className="bg-slate-900">Điện Thoại (Phone)</option>
                <option value="laptop" className="bg-slate-900">Laptop (Máy Tính Xách Tay)</option>
                <option value="audio_device" className="bg-slate-900">Thiết Bị Âm Thanh (Audio)</option>
                <option value="smartwatch" className="bg-slate-900">Đồng Hồ Thông Minh (Smartwatch)</option>
              </select>
            </div>
          </div>

          {/* SKU / Product ID */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-semibold uppercase">Mã Sản phẩm (Product ID - SKU)</label>
            <input
              type="text"
              placeholder="Ví dụ: P001, SKU-123 (Tùy chọn)"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/10 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang tính toán dữ liệu AI...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Bắt đầu Phân tích AI
              </>
            )}
          </button>
        </form>

        {/* Right Column: AI Output Results */}
        <div className="lg:col-span-2 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <div className="space-y-0.5">
                <p className="font-bold">Lỗi phân tích</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 bg-purple-950/5 space-y-5 animate-fade-in h-full flex flex-col">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-gray-200 text-sm heading-font">Kết quả phân tích</h3>
              </div>

              {/* KPI Badges */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Cảm Xúc</span>
                  {getSentimentBadge(result.sentiment)}
                  {result.confidence !== undefined && (
                    <span className="text-[10px] text-gray-500 block mt-1.5 font-mono">Độ tự tin: {(result.confidence * 100).toFixed(1)}%</span>
                  )}
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1.5">Ưu Tiên Xử Lý</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded border uppercase ${getPriorityColor(result.priority)}`}>
                    {result.priority === 'high' ? 'Khẩn cấp' : result.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
              </div>

              {/* Text Preprocessing Info */}
              {result.clean_text && (
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Văn bản chuẩn hóa</span>
                  <p className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-xs text-gray-400 leading-relaxed">
                    {result.clean_text}
                  </p>
                </div>
              )}

              {/* Aspect Tags list */}
              <div className="space-y-2 flex-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Khía cạnh đề cập (Aspects)</span>
                <div className="flex flex-wrap gap-2">
                  {!result.aspects || result.aspects.length === 0 ? (
                    <span className="text-gray-500 italic text-[11px]">Không phát hiện khía cạnh nào.</span>
                  ) : (
                    result.aspects.map((aspect: string) => (
                      <span key={aspect} className="px-3 py-1 rounded bg-purple-500/10 border border-purple-500/25 text-purple-300 font-extrabold uppercase text-[10px] tracking-wider">
                        {aspect}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Source label */}
              {result.sentiment_source && (
                <div className="border-t border-white/5 pt-3.5 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Mô hình xử lý:</span>
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase font-semibold">{result.sentiment_source}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-2xl border border-white/5 text-center text-gray-500 text-xs h-full flex flex-col items-center justify-center gap-3">
              <HelpCircle className="w-10 h-10 text-gray-600" />
              <span>Nhập thông tin bên trái và nhấn Phân tích để hiển thị kết quả.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
