import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Review, DashboardStats, AnalysisReport } from '../services/api';
import { SentimentChart } from '../components/SentimentChart';
import { AspectBarChart } from '../components/AspectBarChart';
import { InsightCard } from '../components/InsightCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { LlmAdvicePanel } from '../components/LlmAdvicePanel';
import { ReviewTable } from '../components/ReviewTable';
import { 
  MessageSquare, 
  Smile, 
  Meh,
  Frown, 
  AlertTriangle, 
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Sparkles
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const reportIdParam = searchParams.get('report_id');
  const reportId = reportIdParam ? Number(reportIdParam) : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for report mode
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // General dashboard stats
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reviews for listing (limit to 300 to keep it fast)
      const reviewsRes = await apiService.listReviews(300);
      
      if (reportId) {
        // Fetch specific report
        const reportData = await apiService.getReport(reportId);
        setReport(reportData);
        // Cast since backend returns filename/created_at in findReport join
        const extReport = reportData as any;
        setFilename(extReport.filename || 'Tệp không rõ');
        setCreatedAt(extReport.created_at || '');
        
        // Filter reviews that belong to this dataset
        const datasetReviews = reviewsRes.data.filter(
          r => r.dataset_id === reportData.dataset_id
        );
        setReviews(datasetReviews);
      } else {
        // Fetch global dashboard stats
        const globalData = await apiService.getDashboard();
        setGlobalStats(globalData);
        setReviews(reviewsRes.data);
        setReport(null);
        setFilename(null);
        setCreatedAt(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể lấy số liệu thống kê. Vui lòng kiểm tra lại dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reportId]);

  const handleSelectReview = async (id: number) => {
    try {
      const detail = await apiService.getReviewDetail(id);
      setSelectedReview(detail);
    } catch (err) {
      console.error(err);
    }
  };

  // Compute numbers based on active mode
  const metrics = React.useMemo(() => {
    if (report) {
      const analytics = report.analytics || {};
      const sentimentDist = analytics.sentiment_distribution || {};
      const priorityDist = analytics.priority_distribution || {};

      // Combine top_positive_aspects and top_negative_aspects
      const topPos = analytics.top_positive_aspects || {};
      const topNeg = analytics.top_negative_aspects || {};
      const aspectDist: Record<string, number> = {};

      Object.entries(topPos).forEach(([aspect, count]) => {
        aspectDist[aspect] = (aspectDist[aspect] || 0) + (count as number);
      });
      Object.entries(topNeg).forEach(([aspect, count]) => {
        aspectDist[aspect] = (aspectDist[aspect] || 0) + (count as number);
      });

      const pos = sentimentDist.positive || 0;
      const neu = sentimentDist.neutral || 0;
      const neg = sentimentDist.negative || 0;
      const total = pos + neu + neg;

      return {
        totalReviews: total || report.total_reviews || reviews.length,
        positive: pos,
        neutral: neu,
        negative: neg,
        positivePct: total > 0 ? ((pos / total) * 100).toFixed(1) : '0',
        neutralPct: total > 0 ? ((neu / total) * 100).toFixed(1) : '0',
        negativePct: total > 0 ? ((neg / total) * 100).toFixed(1) : '0',
        highPriority: priorityDist.high || reviews.filter(r => r.priority === 'high').length,
        aspects: aspectDist,
        insights: report.insights || [],
        recommendations: report.recommendations || [],
      };
    } else if (globalStats) {
      const summary = (globalStats as any).summary || {};
      const total = summary.total_reviews || 0;
      const pos = summary.positive || 0;
      const neu = summary.neutral || 0;
      const neg = summary.negative || 0;

      // Extract aspects from reviews list for global view
      const globalAspects: Record<string, number> = {};
      reviews.forEach(r => {
        if (!r.aspects) return;
        const list = Array.isArray(r.aspects) 
          ? r.aspects 
          : typeof r.aspects === 'string'
            ? r.aspects.split(',').map(s => s.trim())
            : [];
        list.forEach(a => {
          if (a) globalAspects[a] = (globalAspects[a] || 0) + 1;
        });
      });

      return {
        totalReviews: total,
        positive: pos,
        neutral: neu,
        negative: neg,
        positivePct: total > 0 ? ((pos / total) * 100).toFixed(1) : '0',
        neutralPct: total > 0 ? ((neu / total) * 100).toFixed(1) : '0',
        negativePct: total > 0 ? ((neg / total) * 100).toFixed(1) : '0',
        highPriority: summary.high_priority || 0,
        aspects: globalAspects,
        insights: [
          'Số liệu tích lũy toàn hệ thống của tất cả các tệp đánh giá.',
          total > 0 ? `Tỷ lệ hài lòng chung đạt mức ${((pos / total) * 100).toFixed(1)}%.` : '',
        ].filter(Boolean),
        recommendations: [
          'Thực hiện tải lên thêm dữ liệu đánh giá sản phẩm để có báo cáo chuyên sâu hơn cho từng tệp.',
        ],
      };
    }

    return {
      totalReviews: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      positivePct: '0',
      neutralPct: '0',
      negativePct: '0',
      highPriority: 0,
      aspects: {},
      insights: [],
      recommendations: [],
    };
  }, [report, globalStats, reviews]);

  const handleClearReportFilter = () => {
    setSearchParams({});
  };

  const handleGenerateLlmAdvice = async () => {
    if (!reportId) return;

    setLlmLoading(true);
    setLlmError(null);
    try {
      const result = await apiService.generateLlmAdvice(reportId);
      setReport((current) => current ? {
        ...current,
        llm_advice: result.advice,
        llm_model: result.model,
        llm_generated_at: new Date().toISOString(),
      } : current);
    } catch (err: any) {
      console.error(err);
      const apiError = err.response?.data;
      const detail = apiError?.details?.message;
      setLlmError(
        detail ? `${apiError.error} ${detail}` :
        apiError?.error ||
        'Không thể tạo nhận xét bằng LLM. Vui lòng kiểm tra cấu hình Gemini API.'
      );
    } finally {
      setLlmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-semibold">Đang tổng hợp dữ liệu phân tích...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-md mx-auto text-center gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h3 className="text-lg font-bold text-gray-200">Lỗi nạp dữ liệu</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{error}</p>
        <button onClick={fetchData} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6">
      {/* Top Banner and Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white heading-font flex items-center gap-2">
            {report ? 'Báo Cáo File Phân Tích' : 'Tổng Quan Hệ Thống'}
          </h2>
          {report ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                <FileSpreadsheet className="w-3 h-3" /> {filename}
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full font-mono">
                <Calendar className="w-3 h-3 text-gray-500" /> {createdAt}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Xem thống kê lũy kế và báo cáo tổng thể của toàn bộ cửa hàng.</p>
          )}
        </div>

        {report && (
          <button
            onClick={handleClearReportFilter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/25 text-xs transition-all duration-200"
          >
            Thoát báo cáo chi tiết
          </button>
        )}
      </div>

      {/* Grid: 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Total Reviews */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng Đánh Giá</p>
            <h4 className="text-2xl font-extrabold text-white mt-0.5 font-mono">{metrics.totalReviews.toLocaleString()}</h4>
          </div>
        </div>

        {/* Card 2: Positive Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tỷ Lệ Hài Lòng</p>
            <h4 className="text-2xl font-extrabold text-emerald-400 mt-0.5 font-mono">
              {metrics.positivePct}% <span className="text-[10px] text-gray-500 font-normal">({metrics.positive})</span>
            </h4>
          </div>
        </div>

        {/* Card 3: Neutral Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Meh className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tỷ Lệ Trung Lập</p>
            <h4 className="text-2xl font-extrabold text-amber-400 mt-0.5 font-mono">
              {metrics.neutralPct}% <span className="text-[10px] text-gray-500 font-normal">({metrics.neutral})</span>
            </h4>
          </div>
        </div>

        {/* Card 4: Negative Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <Frown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tỷ Lệ Tiêu Cực</p>
            <h4 className="text-2xl font-extrabold text-rose-400 mt-0.5 font-mono">
              {metrics.negativePct}% <span className="text-[10px] text-gray-500 font-normal">({metrics.negative})</span>
            </h4>
          </div>
        </div>

        {/* Card 5: High Priority */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cần Xử Lý Gấp</p>
            <h4 className="text-2xl font-extrabold text-amber-400 mt-0.5 font-mono">{metrics.highPriority}</h4>
          </div>
        </div>
      </div>

      {/* Grid: Charts (Sentiment & Aspects) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart data={metrics} />
        <AspectBarChart data={metrics.aspects} />
      </div>

      {/* Grid: AI Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard insights={metrics.insights} />
        <RecommendationCard recommendations={metrics.recommendations} />
      </div>

      {report && (
        <section className="border-y border-white/10 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                Phân tích chuyên sâu bằng LLM
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                LLM sử dụng kết quả phân tích thô ở trên để nhận xét và đề xuất theo từng sản phẩm.
              </p>
            </div>
            <button
              onClick={handleGenerateLlmAdvice}
              disabled={llmLoading}
              className="min-h-10 px-4 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 disabled:cursor-wait text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {llmLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {report.llm_advice ? 'Tạo lại nhận xét và đề xuất' : 'Đưa ra nhận xét và đề xuất cho sản phẩm'}
            </button>
          </div>
          {llmError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {llmError}
            </div>
          )}
        </section>
      )}

      {report?.llm_advice && (
        <LlmAdvicePanel
          advice={report.llm_advice}
          model={report.llm_model}
          generatedAt={report.llm_generated_at}
        />
      )}

      {/* Section: Reviews List */}
      <div className="space-y-4">
        <ReviewTable reviews={reviews} onSelectReview={handleSelectReview} />
      </div>

      {/* Modal/Drawer: Detailed Review View */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-screen glass-panel border-l border-white/10 shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in bg-slate-950/95">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <h3 className="font-bold text-gray-200 heading-font text-base">Đánh giá chi tiết</h3>
              <button 
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-white text-xs bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Mã Sản Phẩm</span>
                  <span className="font-semibold text-purple-300 font-mono mt-0.5 block">{selectedReview.product_id || 'Chưa rõ'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Xếp hạng (Rating)</span>
                  <span className="font-semibold text-white font-mono mt-0.5 block">{selectedReview.rating || '-'}★</span>
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-gray-400 font-bold uppercase">Nội dung gốc</h4>
                <p className="p-4 bg-white/5 border border-white/5 rounded-xl leading-relaxed text-gray-200 italic font-serif">
                  "{selectedReview.review_text}"
                </p>
              </div>

              {/* Preprocessed Text */}
              {selectedReview.clean_text && (
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-400 font-bold uppercase">Văn bản đã làm sạch</h4>
                  <p className="p-3 bg-black/40 border border-white/5 rounded-xl leading-relaxed text-gray-400 font-mono">
                    {selectedReview.clean_text}
                  </p>
                </div>
              )}

              {/* AI Details */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Sắc thái (Sentiment)</span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                    selectedReview.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedReview.sentiment === 'neutral' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>{selectedReview.sentiment}</span>
                </div>

                {selectedReview.confidence && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Độ tin cậy (Confidence)</span>
                    <span className="font-mono text-gray-200 font-semibold">{(selectedReview.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Độ ưu tiên (Priority)</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                    selectedReview.priority === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    selectedReview.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>{selectedReview.priority}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Các khía cạnh (Aspects)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(!selectedReview.aspects || (Array.isArray(selectedReview.aspects) && selectedReview.aspects.length === 0)) ? (
                      <span className="text-gray-500 italic">Không tìm thấy khía cạnh nào</span>
                    ) : (
                      (Array.isArray(selectedReview.aspects) 
                        ? selectedReview.aspects 
                        : typeof selectedReview.aspects === 'string'
                          ? (selectedReview.aspects as string).split(',').map(s => s.trim())
                          : []
                      ).map(a => (
                        <span key={a} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/25 text-purple-300 rounded font-bold uppercase text-[9px]">
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
