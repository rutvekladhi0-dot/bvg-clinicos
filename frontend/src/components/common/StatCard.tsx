import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = 'text-[#0F766E]',
  bgColor = 'bg-teal-50 dark:bg-teal-950/40',
  subtitle,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      {(change || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs">
          {change && (
            <span
              className={`flex items-center font-bold mr-2 ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
