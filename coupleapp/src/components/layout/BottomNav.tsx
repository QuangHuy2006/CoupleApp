import React from 'react';
import { NavLink } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';

export const BottomNav: React.FC = () => {
  const { unreadCount } = useChat();
  const navItems = [
    { path: '/', icon: '🏠', label: 'Trang chủ' },
    { path: '/diary', icon: '📖', label: 'Nhật ký' },
    { path: '/chat', icon: '💬', label: 'Chat' },
    { path: '/location', icon: '📍', label: 'Vị trí' },
    { path: '/profile', icon: '👤', label: 'Tôi' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-pink-500 bg-pink-50'
                  : 'text-gray-500 hover:text-pink-400'
              }`
            }
          >
            <div className="relative text-2xl">
              {item.icon}
              {item.path === '/chat' && unreadCount > 0 && (
                <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                  {unreadCount > 5 ? '5+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-xs mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};