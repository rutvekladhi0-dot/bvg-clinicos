import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Clock, AlertOctagon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { t } = useAuth();

  const links = [
    { path: '/', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/patients', label: t('patients'), icon: Users },
    { path: '/appointments', label: t('appointments'), icon: Calendar },
    { path: '/queue', label: t('queue'), icon: Clock },
    { path: '/emergency', label: t('emergency'), icon: AlertOctagon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden px-2 py-1">
      <div className="flex items-center justify-around">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'text-[#0F766E] dark:text-[#14B8A6]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
