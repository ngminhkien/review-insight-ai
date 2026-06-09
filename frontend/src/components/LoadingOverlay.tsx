import React, { useEffect, useState } from 'react';
import { Cpu, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
  totalItems?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, totalItems }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!totalItems) return;
    // Mock smooth progress up to 95%
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        const step = Math.max(1, Math.floor((100 - prev) / 8));
        return prev + step;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [totalItems]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-md">
      <div className="max-w-md w-full mx-4 glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow"></div>

        {/* Icon Animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-125 animate-pulse"></div>
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center border border-purple-500/30 relative">
            <Cpu className="w-8 h-8 animate-spin-slow text-purple-400" />
            <Loader2 className="w-5 h-5 absolute text-pink-400 animate-spin" />
          </div>
        </div>

        {/* Text Details */}
        <h3 className="text-lg font-bold text-gray-100 heading-font mb-2">Đang xử lý phân tích AI</h3>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{message}</p>

        {/* Progress Bar */}
        {totalItems && (
          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-gray-400 font-semibold px-1">
              <span>Đang giải mã file</span>
              <span>{progress}% hoàn tất</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
