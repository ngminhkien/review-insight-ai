import React from 'react';
import { Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface InsightCardProps {
  insights: string[];
}

export const InsightCard: React.FC<InsightCardProps> = ({ insights }) => {
  const getInsightStyle = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('tích cực') || lower.includes('tốt') || lower.includes('cao') || lower.includes('hài lòng')) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-300',
        icon: CheckCircle2,
        iconColor: 'text-emerald-400',
      };
    }
    if (lower.includes('tiêu cực') || lower.includes('kém') || lower.includes('lỗi') || lower.includes('tệ') || lower.includes('chậm')) {
      return {
        bg: 'bg-rose-500/10 border-rose-500/20',
        text: 'text-rose-300',
        icon: AlertCircle,
        iconColor: 'text-rose-400',
      };
    }
    return {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-300',
      icon: Lightbulb,
      iconColor: 'text-blue-400',
    };
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
      <h3 className="font-semibold text-gray-200 text-sm mb-4 heading-font flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-purple-400" /> Nhận định Thông minh (Insights)
      </h3>
      
      {insights.length === 0 ? (
        <p className="text-xs text-gray-500 flex-1 flex items-center justify-center">
          Chưa có nhận định nào được tạo.
        </p>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {insights.map((insight, idx) => {
            const style = getInsightStyle(insight);
            const Icon = style.icon;
            return (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${style.bg}`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${style.iconColor}`} />
                <p className={`text-xs leading-relaxed ${style.text}`}>{insight}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
