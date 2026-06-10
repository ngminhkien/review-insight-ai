import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { History, FileSpreadsheet, Eye, Play, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface DatasetItem {
  id: number;
  filename: string;
  total_reviews: number;
  status: string;
  created_at: string;
}

interface ReportItem {
  id: number;
  dataset_id: number;
  created_at: string;
}

export const HistoryPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getDashboard();
      const extData = data as any;
      setDatasets(extData.recent_datasets || []);
      setReports(extData.recent_reports || []);
    } catch (err) {
      console.error(err);
      setError('Không thể lấy lịch sử phân tích. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Hoàn tất</span>;
      case 'failed':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase">Thất bại</span>;
      case 'processing':
      case 'pending':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase animate-pulse flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang xử lý</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400 uppercase">{status}</span>;
    }
  };

  const handleViewReport = (datasetId: number) => {
    const matchedReport = reports.find(r => r.dataset_id === datasetId);
    if (matchedReport) {
      navigate(`/dashboard?report_id=${matchedReport.id}`);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white heading-font flex items-center gap-2">
            <History className="text-purple-400 w-7 h-7" /> Lịch sử phân tích
          </h2>
          <p className="text-sm text-gray-400 font-medium">Danh sách các tập dữ liệu đánh giá đã được tải lên và chạy phân tích AI.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold border border-white/10 text-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center text-gray-400 py-20 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
          <span className="text-sm font-semibold">Đang nạp danh sách lịch sử...</span>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center max-w-sm mx-auto gap-4 border-rose-500/20 bg-rose-500/5">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-xs text-rose-300 font-medium leading-relaxed">{error}</p>
          <button onClick={fetchHistory} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-200 border border-white/10">Thử lại</button>
        </div>
      ) : datasets.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-4">
          <FileSpreadsheet className="w-12 h-12 text-gray-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-300 heading-font">Lịch sử trống</h4>
            <p className="text-xs text-gray-500">Bạn chưa tải lên hoặc thực hiện phân tích tệp dữ liệu nào.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-lg shadow-purple-900/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Phân tích ngay
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">ID Lượt chạy</th>
                  <th className="px-5 py-3.5">Tên Tệp</th>
                  <th className="px-5 py-3.5">Tổng Đánh Giá</th>
                  <th className="px-5 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5">Ngày Thực Hiện</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {datasets.map((d) => {
                  const hasReport = reports.some(r => r.dataset_id === d.id);
                  return (
                    <tr key={d.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="px-5 py-3.5 font-bold font-mono text-purple-300">
                        #{d.id}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-200 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{d.filename}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-300 font-mono">
                        {d.total_reviews}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(d.status)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>{d.created_at}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {hasReport ? (
                          <button
                            onClick={() => handleViewReport(d.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-500 text-[10px] font-bold transition-all duration-200"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem báo cáo
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[10px] font-medium italic">Không khả dụng</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
