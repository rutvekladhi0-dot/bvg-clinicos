import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Clock, UserCheck, Stethoscope,
  Bed, AlertOctagon, Scissors, FileText, Pill, FlaskConical,
  Scan, CreditCard, Shield, Droplets, UserCog, Calculator,
  GitBranch, Video, LineChart, Sparkles, Bell, Key, Settings,
  ChevronLeft, ChevronRight, Activity, LogOut
} from 'lucide-react';
import { Role } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { role, t, logout, user } = useAuth();

  const allSections = [
    {
      title: 'Clinical Care',
      items: [
        { path: '/', label: t('dashboard'), icon: LayoutDashboard, roles: ['*'] },
        { path: '/patients', label: t('patients'), icon: Users, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
        { path: '/appointments', label: t('appointments'), icon: Calendar, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
        { path: '/queue', label: t('queue'), icon: Clock, badge: 'Live', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
        { path: '/opd', label: t('opd'), icon: Stethoscope, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR'] },
        { path: '/ipd', label: t('ipd'), icon: Bed, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE'] },
        { path: '/emergency', label: t('emergency'), icon: AlertOctagon, badge: 'Red', badgeColor: 'bg-rose-500 text-white', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE', 'OT_STAFF'] },
        { path: '/operation-theatre', label: t('operationTheatre'), icon: Scissors, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'OT_STAFF'] },
        { path: '/emr', label: t('emr'), icon: Activity, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE'] },
        { path: '/prescriptions', label: t('prescriptions'), icon: FileText, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE', 'RECEPTIONIST'] },
      ],
    },
    {
      title: 'Diagnostics & Pharmacy',
      items: [
        { path: '/pharmacy', label: t('pharmacy'), icon: Pill, badge: 'Alerts', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'PHARMACIST', 'DOCTOR'] },
        { path: '/laboratory', label: t('laboratory'), icon: FlaskConical, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'] },
        { path: '/radiology', label: t('radiology'), icon: Scan, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'RADIOLOGIST', 'DOCTOR'] },
        { path: '/blood-bank', label: t('bloodBank'), icon: Droplets, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'LAB_TECHNICIAN', 'NURSE', 'DOCTOR'] },
      ],
    },
    {
      title: 'Billing & Claims',
      items: [
        { path: '/billing', label: t('billing'), icon: CreditCard, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
        { path: '/insurance', label: t('insurance'), icon: Shield, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
        { path: '/accounting', label: t('accounting'), icon: Calculator, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'Operations & Telehealth',
      items: [
        { path: '/doctors', label: t('doctors'), icon: UserCheck, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'RECEPTIONIST', 'HR_MANAGER'] },
        { path: '/hr', label: t('hrStaff'), icon: UserCog, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'HR_MANAGER', 'ACCOUNTANT'] },
        { path: '/branches', label: t('multiBranch'), icon: GitBranch, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN'] },
        { path: '/telemedicine', label: t('telemedicine'), icon: Video, badge: 'Live', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'PATIENT'] },
        { path: '/portal', label: t('patientPortal'), icon: Users, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PATIENT'] },
      ],
    },
    {
      title: 'Intelligence & Governance',
      items: [
        { path: '/analytics', label: t('analytics'), icon: LineChart, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT', 'DOCTOR'] },
        { path: '/ai-insights', label: t('aiInsights'), icon: Sparkles, badge: 'AI', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR'] },
        { path: '/notifications', label: t('notifications'), icon: Bell, roles: ['*'] },
        { path: '/administration', label: t('administration'), icon: Key, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
        { path: '/settings', label: t('settings'), icon: Settings, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
      ],
    },
  ];

  // Filter sections by current user role
  const filteredSections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.roles.includes('*') || item.roles.includes(role) || role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN'
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <NavLink to="/" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white shadow-md shadow-teal-700/20 shrink-0">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  BVG <span className="text-[#0F766E] dark:text-[#14B8A6]">ClinicOS</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
                  Enterprise Suite
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Pill */}
        {!isCollapsed && user && (
          <div className="px-4 py-2.5 mx-3 mt-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/50 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-teal-900 dark:text-teal-200 truncate">
                {user.full_name || user.username}
              </p>
              <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {role.replace('_', ' ')}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Session" />
          </div>
        )}

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isOpen) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                          isActive
                            ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            item.badgeColor || 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Bottom Action */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>{t('close') || 'Sign Out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
