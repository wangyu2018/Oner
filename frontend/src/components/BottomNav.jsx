import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sparkles, LayoutDashboard, KeyRound, User, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/ai', icon: Sparkles, label: 'AI' },
  { path: '/board', icon: LayoutDashboard, label: '看板' },
  { path: '/memos', icon: FileText, label: '备忘' },
  { path: '/passwords', icon: KeyRound, label: '密码' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center w-16 h-full gap-0.5 ${
                isActive
                  ? 'text-accent'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
