import React from 'react';
import { Target, ThumbsUp, ThumbsDown } from 'lucide-react';

interface TopAspectsCardProps {
  topPositive?: Record<string, number>;
  topNegative?: Record<string, number>;
}

export const TopAspectsCard: React.FC<TopAspectsCardProps> = ({ topPositive, topNegative }) => {
  const getTopItems = (data?: Record<string, number>) => {
    if (!data) return [];
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // get top 5
  };

  const posItems = getTopItems(topPositive);
  const negItems = getTopItems(topNegative);

  if (posItems.length === 0 && negItems.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-gray-200 heading-font text-sm">Top Khía Cạnh Đáng Chú Ý</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Điểm mạnh */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Top Được Khen</h4>
          </div>
          {posItems.length > 0 ? (
            <ul className="space-y-2">
              {posItems.map(([aspect, count], idx) => (
                <li key={aspect} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span className="text-emerald-500/50 text-[10px] w-3">{idx + 1}.</span>
                    {aspect}
                  </span>
                  <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 italic">Không có dữ liệu</p>
          )}
        </div>

        {/* Điểm yếu */}
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold uppercase text-rose-400 tracking-wider">Top Bị Chê</h4>
          </div>
          {negItems.length > 0 ? (
            <ul className="space-y-2">
              {negItems.map(([aspect, count], idx) => (
                <li key={aspect} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span className="text-rose-500/50 text-[10px] w-3">{idx + 1}.</span>
                    {aspect}
                  </span>
                  <span className="font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded text-xs">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 italic">Không có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
};
