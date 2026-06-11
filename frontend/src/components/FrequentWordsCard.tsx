import React, { useState } from 'react';
import { Type } from 'lucide-react';

interface FrequentWordsCardProps {
  positiveWords?: Record<string, number>;
  negativeWords?: Record<string, number>;
  aspectWordStats?: Record<string, {
    positive: Record<string, number>;
    negative: Record<string, number>;
  }>;
}

export const FrequentWordsCard: React.FC<FrequentWordsCardProps> = ({ 
  positiveWords, 
  negativeWords,
  aspectWordStats
}) => {
  const [activeTab, setActiveTab] = useState<string>('global');

  const renderWordList = (words?: Record<string, number>, isPositive: boolean = true) => {
    if (!words || Object.keys(words).length === 0) {
      return <p className="text-xs text-gray-500 italic">Chưa có đủ dữ liệu từ vựng.</p>;
    }

    const maxCount = Math.max(...Object.values(words));
    const entries = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 15);

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {entries.map(([word, count]) => {
          const relativeSize = (count / maxCount);
          const fontSizeClass = relativeSize > 0.8 ? 'text-sm' : relativeSize > 0.4 ? 'text-xs' : 'text-[10px]';
          const opacityClass = relativeSize > 0.8 ? 'opacity-100 font-extrabold' : relativeSize > 0.4 ? 'opacity-90 font-bold' : 'opacity-70 font-medium';
          
          const bgClass = isPositive 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400';

          return (
            <span 
              key={word} 
              className={`px-2 py-1 rounded border ${bgClass} ${fontSizeClass} ${opacityClass} transition-all hover:scale-110`}
              title={`Xuất hiện ${count} lần`}
            >
              {word} <span className="opacity-50 text-[9px]">({count})</span>
            </span>
          );
        })}
      </div>
    );
  };

  const hasAspectStats = aspectWordStats && Object.keys(aspectWordStats).length > 0;
  const aspects = hasAspectStats ? Object.keys(aspectWordStats).sort() : [];
  
  const currentPosWords = activeTab === 'global' ? positiveWords : (aspectWordStats?.[activeTab]?.positive || {});
  const currentNegWords = activeTab === 'global' ? negativeWords : (aspectWordStats?.[activeTab]?.negative || {});

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-gray-200 heading-font text-sm">Từ Khóa Lặp Lại Nhiều Nhất</h3>
        </div>
        
        {hasAspectStats && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'global' 
                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              Tổng hợp (Chung)
            </button>
            {aspects.map(aspect => (
              <button
                key={aspect}
                onClick={() => setActiveTab(aspect)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all border ${
                  activeTab === aspect 
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
                }`}
              >
                {aspect}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">
            Từ khóa Tích Cực {activeTab !== 'global' && <span className="text-purple-400">({activeTab})</span>}
          </h4>
          {renderWordList(currentPosWords, true)}
        </div>
        <div>
          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">
            Từ khóa Tiêu Cực {activeTab !== 'global' && <span className="text-purple-400">({activeTab})</span>}
          </h4>
          {renderWordList(currentNegWords, false)}
        </div>
      </div>
    </div>
  );
};
