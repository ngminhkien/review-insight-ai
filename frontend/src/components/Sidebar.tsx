import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  Sparkles, 
  BarChart3, 
  Activity, 
  ShieldAlert 
} from 'lucide-react';
import { apiService } from '../services/api';

export const Sidebar: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'loading'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await apiService.getHealth();
        if (data.status === 'ok' && data.ai_service?.status === 'ok') {
          setHealthStatus('ok');
        } else {
          setHealthStatus('error');
        }
      } catch {
        setHealthStatus('error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Tải Lên CSV', icon: UploadCloud },
    { to: '/dashboard', label: 'Dashboard Thống Kê', icon: LayoutDashboard },
    { to: '/history', label: 'Lịch Sử Phân Tích', icon: History },
    { to: '/compare', label: 'So Sánh Sản Phẩm', icon: BarChart3 },
    { to: '/playground', label: 'Trình Phân Tích Lẻ', icon: Sparkles },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/10 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold heading-font gradient-text tracking-wide flex items-center gap-2">
          Review Insight AI
        </h1>
        <p className="text-xs text-gray-400 mt-1">Hệ thống phân tích review</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300 shadow-lg shadow-purple-900/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Health Info */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          {healthStatus === 'ok' ? (
            <>
              <div className="relative">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Hệ thống Online
                </span>
                <span className="text-[10px] text-gray-500">Kết nối AI Service ổn định</span>
              </div>
            </>
          ) : healthStatus === 'loading' ? (
            <div className="text-xs text-gray-500 animate-pulse flex items-center gap-1.5">
              <Activity className="w-4 h-4 animate-spin text-purple-400" /> Đang kiểm tra kết nối...
            </div>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-rose-400">Hệ thống Lỗi</span>
                <span className="text-[10px] text-rose-300/70">Mất kết nối backend/AI</span>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
