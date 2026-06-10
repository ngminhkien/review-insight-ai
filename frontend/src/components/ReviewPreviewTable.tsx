import React, { useEffect, useState } from 'react';
import { TableProperties } from 'lucide-react';

interface ReviewPreviewTableProps {
  file: File;
}

export const ReviewPreviewTable: React.FC<ReviewPreviewTableProps> = ({ file }) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        // Simple CSV splitter handling newlines
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) {
          setError('Tệp CSV rỗng.');
          return;
        }

        // Helper to parse CSV row correctly handling quotes
        const parseCsvLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ''));
          return result;
        };

        const parsedHeaders = parseCsvLine(lines[0]);
        const parsedRows = lines.slice(1, 16).map(line => parseCsvLine(line)); // Preview top 15 rows

        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setError(null);
      } catch {
        setError('Có lỗi xảy ra khi phân tích tệp CSV.');
      }
    };
    reader.readAsText(file);
  }, [file]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center gap-2.5 bg-black/20">
        <TableProperties className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-gray-200 text-sm flex items-center gap-2">
          Xem trước dữ liệu tải lên <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">(Tối đa 15 dòng đầu)</span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {headers.map((h, i) => (
                <th key={i} className="px-5 py-3.5 font-bold text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-white/[0.02] transition-colors">
                {headers.map((_, colIndex) => (
                  <td key={colIndex} className="px-5 py-3.5 text-gray-300 max-w-xs truncate">
                    {row[colIndex] || <span className="text-gray-600 font-mono">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
