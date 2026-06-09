import React from 'react';
import { Compass, ArrowRightCircle } from 'lucide-react';

interface RecommendationCardProps {
  recommendations: string[];
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendations }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
      <h3 className="font-semibold text-gray-200 text-sm mb-4 heading-font flex items-center gap-2">
        <Compass className="w-5 h-5 text-purple-400" /> Khuyến nghị Hành động
      </h3>
      
      {recommendations.length === 0 ? (
        <p className="text-xs text-gray-500 flex-1 flex items-center justify-center">
          Chưa có đề xuất nào được tạo.
        </p>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {recommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className="p-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/20 transition-all duration-200 flex items-start gap-3"
            >
              <ArrowRightCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
              <p className="text-xs text-gray-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
