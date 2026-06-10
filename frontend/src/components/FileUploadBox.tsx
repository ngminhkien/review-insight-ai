import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertTriangle } from 'lucide-react';

interface FileUploadBoxProps {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
}

export const FileUploadBox: React.FC<FileUploadBoxProps> = ({ onFileSelect, onFileClear }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv')) {
      setError('Định dạng tệp không hợp lệ. Vui lòng tải lên tệp CSV.');
      return false;
    }
    // Limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setError('Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 20MB.');
      return false;
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    onFileClear();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`glass-panel border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-purple-500 bg-purple-500/10 scale-[1.01]' 
            : selectedFile 
              ? 'border-emerald-500/50 bg-emerald-500/5' 
              : 'border-white/10 hover:border-purple-500/40 hover:bg-white/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-gray-200">{selectedFile.name}</p>
            <p className="text-xs text-gray-400 mt-1">{formatBytes(selectedFile.size)}</p>
            
            <button
              onClick={handleClear}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 text-xs font-semibold border border-white/5 hover:border-rose-500/20 transition-all duration-200"
            >
              <X className="w-4 h-4" /> Hủy chọn tệp
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-gray-200">
              Kéo thả file CSV của bạn vào đây hoặc <span className="text-purple-400 underline">chọn từ máy tính</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">Định dạng file CSV, tối đa 20MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
