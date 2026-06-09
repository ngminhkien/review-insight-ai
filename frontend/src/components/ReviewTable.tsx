import React, { useState, useMemo } from 'react';
import type { Review } from '../services/api';
import { Search, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface ReviewTableProps {
  reviews: Review[];
  onSelectReview?: (reviewId: number) => void;
}

export const ReviewTable: React.FC<ReviewTableProps> = ({ reviews, onSelectReview }) => {
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [aspectFilter, setAspectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique aspects present in the reviews to populate filter
  const allAspects = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => {
      if (!r.aspects) return;
      const list = Array.isArray(r.aspects)
        ? r.aspects
        : typeof r.aspects === 'string'
          ? r.aspects.split(',').map(s => s.trim())
          : [];
      list.forEach(a => {
        if (a) set.add(a);
      });
    });
    return Array.from(set);
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchesSearch = r.review_text.toLowerCase().includes(search.toLowerCase()) ||
        (r.product_id && r.product_id.toLowerCase().includes(search.toLowerCase()));

      const matchesSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;

      const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;

      let matchesAspect = aspectFilter === 'all';
      if (aspectFilter !== 'all' && r.aspects) {
        const list = Array.isArray(r.aspects)
          ? r.aspects
          : typeof r.aspects === 'string'
            ? r.aspects.split(',').map(s => s.trim())
            : [];
        matchesAspect = list.includes(aspectFilter);
      }

      return matchesSearch && matchesSentiment && matchesAspect && matchesPriority;
    });
  }, [reviews, search, sentimentFilter, aspectFilter, priorityFilter]);

  // Reset page when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [search, sentimentFilter, aspectFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage]);

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Tích cực</span>;
      case 'neutral':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">Trung lập</span>;
      case 'negative':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase">Tiêu cực</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 uppercase">Không rõ</span>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">Khẩn cấp</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">Trung bình</span>;
      case 'low':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">Thấp</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-gray-500/20 text-gray-400 border border-gray-500/30 uppercase">-</span>;
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header and Filters */}
      <div className="p-5 border-b border-white/10 space-y-4 bg-black/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" /> Danh sách Đánh giá ({filteredReviews.length})
          </h3>
          {/* Search Box */}
          <div className="relative max-w-md w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nội dung, mã SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Sắc thái:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-slate-900">Tất cả</option>
              <option value="positive" className="bg-slate-900">Tích cực</option>
              <option value="neutral" className="bg-slate-900">Trung lập</option>
              <option value="negative" className="bg-slate-900">Tiêu cực</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Khía cạnh:</span>
            <select
              value={aspectFilter}
              onChange={(e) => setAspectFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-slate-900">Tất cả</option>
              {allAspects.map(a => (
                <option key={a} value={a} className="bg-slate-900 uppercase">{a}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Ưu tiên:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-slate-900">Tất cả</option>
              <option value="high" className="bg-slate-900">Khẩn cấp</option>
              <option value="medium" className="bg-slate-900">Trung bình</option>
              <option value="low" className="bg-slate-900">Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-semibold">
              <th className="px-5 py-3.5 w-16">ID SP</th>
              <th className="px-5 py-3.5 w-16">Ngành hàng</th>
              <th className="px-5 py-3.5 w-8">Rating</th>
              <th className="px-5 py-3.5 w-[22vw]">Nội dung đánh giá</th>
              <th className="px-5 py-3.5 w-20">Sắc thái</th>
              <th className="px-5 py-3.5 w-24">Khía cạnh</th>
              <th className="px-5 py-3.5 w-16">Ưu tiên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedReviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20 text-gray-500 text-xs">
                  Không tìm thấy đánh giá nào trùng khớp bộ lọc.
                </td>
              </tr>
            ) : (
              paginatedReviews.map((r, i) => {
                const aspectList = Array.isArray(r.aspects)
                  ? r.aspects
                  : typeof r.aspects === 'string'
                    ? r.aspects.split(',').map(s => s.trim())
                    : [];
                return (
                  <tr
                    key={r.id || i}
                    onClick={() => onSelectReview && r.id && onSelectReview(r.id)}
                    className={`hover:bg-white/[0.02] transition-all duration-150 cursor-pointer`}
                  >
                    <td className="px-5 py-3.5 font-medium text-purple-300 font-mono">
                      {r.product_id || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 capitalize">
                      {r.product_type || '-'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-200 font-mono">
                      {r.rating || '-'}★
                    </td>
                    <td className="px-5 py-3.5 text-gray-200 max-w-sm truncate" title={r.review_text}>
                      {r.review_text}
                    </td>
                    <td className="px-5 py-3.5">
                      {getSentimentBadge(r.sentiment)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {aspectList.length === 0 ? (
                          <span className="text-gray-600 font-mono">-</span>
                        ) : (
                          aspectList.map(a => (
                            <span key={a} className="px-1.5 py-0.5 text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded uppercase font-semibold">
                              {a}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {getPriorityBadge(r.priority)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs">
        <span className="text-gray-400">
          Hiển thị <span className="font-semibold text-gray-200">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-gray-200">{Math.min(currentPage * itemsPerPage, filteredReviews.length)}</span> trong tổng số <span className="font-semibold text-gray-200">{filteredReviews.length}</span> kết quả
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-gray-300 font-semibold font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
