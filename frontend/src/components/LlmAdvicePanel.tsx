import React from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles, Target } from 'lucide-react';
import type { LlmProductAdvice } from '../services/api';

interface LlmAdvicePanelProps {
  advice: LlmProductAdvice;
  model?: string | null;
  generatedAt?: string | null;
}

export const LlmAdvicePanel: React.FC<LlmAdvicePanelProps> = ({
  advice,
  model,
  generatedAt,
}) => {
  return (
    <section className="glass-panel border border-purple-500/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-100 text-base heading-font flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            Nhận xét và đề xuất từ LLM
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Tổng hợp từ kết quả sentiment, aspect và priority của model nội bộ.
          </p>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          {model || 'LLM'}{generatedAt ? ` · ${generatedAt}` : ''}
        </div>
      </div>

      <div className="p-6 space-y-7">
        <div>
          <h4 className="text-xs font-bold text-purple-300 uppercase mb-2">Tóm tắt điều hành</h4>
          <p className="text-sm text-gray-200 leading-relaxed">{advice.executive_summary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Phát hiện chính
            </h4>
            <div className="space-y-2.5">
              {advice.key_findings.map((finding, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-fuchsia-400" /> Hành động ưu tiên
            </h4>
            <div className="space-y-2.5">
              {advice.priority_actions.map((action, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center shrink-0 font-bold">
                    {index + 1}
                  </span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h4 className="text-xs font-bold text-gray-300 uppercase mb-4">Đánh giá theo sản phẩm</h4>
          <div className="divide-y divide-white/10">
            {advice.product_assessments.map((product) => (
              <article key={product.product_id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-white font-mono">{product.product_id}</span>
                  {product.product_type && (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">
                      {product.product_type}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">{product.overview}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <AdviceList title="Điểm mạnh" items={product.strengths} tone="good" />
                  <AdviceList title="Vấn đề" items={product.issues} tone="bad" />
                  <AdviceList title="Đề xuất" items={product.recommendations} tone="action" />
                </div>
              </article>
            ))}
          </div>
        </div>

        {advice.limitations.length > 0 && (
          <div className="border-t border-white/10 pt-5">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Giới hạn dữ liệu
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {advice.limitations.map((item, index) => <li key={index}>• {item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

const AdviceList: React.FC<{
  title: string;
  items: string[];
  tone: 'good' | 'bad' | 'action';
}> = ({ title, items, tone }) => {
  const titleColor = tone === 'good'
    ? 'text-emerald-400'
    : tone === 'bad'
      ? 'text-rose-400'
      : 'text-purple-400';

  return (
    <div>
      <h5 className={`text-[10px] font-bold uppercase mb-2 ${titleColor}`}>{title}</h5>
      {items.length === 0 ? (
        <p className="text-[11px] text-gray-600">Chưa có dữ liệu nổi bật.</p>
      ) : (
        <ul className="space-y-2 text-xs text-gray-400 leading-relaxed">
          {items.map((item, index) => <li key={index}>• {item}</li>)}
        </ul>
      )}
    </div>
  );
};
