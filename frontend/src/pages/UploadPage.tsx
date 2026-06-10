import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploadBox } from '../components/FileUploadBox';
import { ReviewPreviewTable } from '../components/ReviewPreviewTable';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { apiService } from '../services/api';
import { UploadCloud, Play, HelpCircle, CheckCircle } from 'lucide-react';

export const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleFileClear = () => {
    setFile(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setLoadingMsg(`Đang tải lên tệp "${file.name}" và khởi chạy tiến trình phân tích AI...`);
    setError(null);

    try {
      const result = await apiService.uploadCsv(file);
      if (result.report_id) {
        navigate(`/dashboard?report_id=${result.report_id}`);
      } else {
        setError('Tải lên thành công nhưng không tìm thấy mã báo cáo phản hồi.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'Có lỗi xảy ra trong quá trình xử lý file CSV. Vui lòng kiểm tra lại định dạng file.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight heading-font text-white flex items-center gap-2">
          <UploadCloud className="text-purple-400 w-7 h-7" /> Phân tích dữ liệu mới
        </h2>
        <p className="text-sm text-gray-400">Tải lên tệp CSV chứa các đánh giá sản phẩm để bắt đầu phân tích thông minh.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Box and Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <FileUploadBox onFileSelect={handleFileSelect} onFileClear={handleFileClear} />
          
          {file && (
            <div className="flex justify-end gap-4 animate-fade-in">
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/20 hover:shadow-purple-900/35 transition-all duration-300 hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-current" /> Bắt đầu Phân tích AI
              </button>
            </div>
          )}

          {file && <ReviewPreviewTable file={file} />}
        </div>

        {/* Right Column: Guide Details */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 heading-font flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" /> Hướng dẫn định dạng file
            </h3>
            
            <div className="space-y-3.5 text-xs leading-relaxed text-gray-400">
              <p>Tệp CSV tải lên nên có các cột tiêu chuẩn sau:</p>
              
              <div className="space-y-2 font-mono text-[10px] bg-black/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">review_text</span>
                  <span className="text-gray-500">nội dung đánh giá (bắt buộc)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-300 shrink-0">rating</span>
                  <span className="text-gray-500">điểm số từ 1 đến 5</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-300 shrink-0">product_id</span>
                  <span className="text-gray-500">mã định danh sản phẩm</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-300 shrink-0">product_type</span>
                  <span className="text-gray-500">phone, food, fashion, cosmetics...</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-300 shrink-0">date</span>
                  <span className="text-gray-500">YYYY-MM-DD</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <div className="flex items-start gap-2 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Chấp nhận tiêu đề viết tắt hoặc đồng nghĩa: <code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">text</code>, <code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">review</code>, <code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">stars</code>, <code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">sku</code>...</span>
                </div>
                <div className="flex items-start gap-2 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hỗ trợ phân cách bằng dấu phẩy (<code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">,</code>), chấm phẩy (<code className="bg-white/5 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">;</code>) hoặc tab.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-1">
          <span className="font-bold">Lỗi Phân Tích:</span>
          <span>{error}</span>
        </div>
      )}

      {loading && <LoadingOverlay message={loadingMsg} totalItems={20} />}
    </div>
  );
};
