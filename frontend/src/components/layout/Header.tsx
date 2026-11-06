import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Sun, Moon, Bell, ChevronDown, Building2,
  Globe, ShieldCheck, Menu, User, LogOut, Check
} from 'lucide-react';
import { Role, Language } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const {
    user, role, setRole, branchId, setBranchId, branches,
    language, setLanguage, t, theme, toggleTheme, logout
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const rolesList: { role: Role; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin' },
    { role: 'HOSPITAL_ADMIN', label: 'Hospital Admin' },
    { role: 'BRANCH_ADMIN', label: 'Branch Admin' },
    { role: 'DOCTOR', label: 'Doctor (Dr. Sharma)' },
    { role: 'RECEPTIONIST', label: 'Receptionist (Front Desk)' },
    { role: 'NURSE', label: 'Staff Nurse (Priya)' },
    { role: 'PHARMACIST', label: 'Pharmacist (Rahul)' },
    { role: 'LAB_TECHNICIAN', label: 'Lab Tech (Anil)' },
    { role: 'RADIOLOGIST', label: 'Radiologist' },
    { role: 'ACCOUNTANT', label: 'Accountant' },
    { role: 'HR_MANAGER', label: 'HR Manager' },
    { role: 'OT_STAFF', label: 'OT Surgical Staff' },
    { role: 'PATIENT', label: 'Patient Portal (Rajesh)' },
  ];

  const currentBranch = branches.find((b) => b.id === branchId) || branches[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-2.5 sm:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center space-x-1.5 sm:space-x-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center w-full max-w-xs sm:max-w-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-transparent hover:border-teal-500/30 transition-all group"
        >
          <Search className="w-4 h-4 mr-1.5 sm:mr-2.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0" />
          <span className="hidden sm:inline truncate">{t('searchPlaceholder')}</span>
          <span className="sm:hidden text-xs truncate">{t('search')}</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
        {/* Branch Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBranchMenu(!showBranchMenu);
              setShowRoleMenu(false);
              setShowLangMenu(false);
              setShowNotifMenu(false);
            }}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="max-w-[130px] truncate">{currentBranch?.name || 'Main Campus'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBranchMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
                {t('switchBranch')}
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBranchId(b.id);
                    setShowBranchMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors ${
                    branchId === b.id ? 'text-teal-600 font-semibold bg-teal-50/50 dark:bg-teal-950/30' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  {branchId === b.id && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowBranchMenu(false);
              setShowLangMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 rounded-lg border border-teal-200/70 dark:border-teal-800 hover:bg-teal-100/70 transition-colors"
            title="Switch User Role"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="hidden sm:inline font-mono">{role}</span>
            <span className="sm:hidden font-mono text-[10px]">{role.slice(0, 3)}</span>
            <ChevronDown className="w-3 h-3 text-teal-600" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
                {t('switchRole')}
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setRole(r.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors ${
                    role === r.role ? 'text-teal-600 font-semibold bg-teal-50/50 dark:bg-teal-950/30' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{r.label}</span>
                  {role === r.role && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowBranchMenu(false);
              setShowRoleMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center px-2 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Language"
          >
            <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-extrabold uppercase ml-1 tracking-wider text-slate-700 dark:text-slate-200">
              {language}
            </span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
              <button
                onClick={() => {
                  setLanguage('en');
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-teal-50 dark:hover:bg-slate-800 ${
                  language === 'en' ? 'text-teal-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{t('langEnglish')}</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>
              <button
                onClick={() => {
                  setLanguage('mr');
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-teal-50 dark:hover:bg-slate-800 ${
                  language === 'mr' ? 'text-teal-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{t('langMarathi')}</span>
                {language === 'mr' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>
              <button
                onClick={() => {
                  setLanguage('hi');
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-teal-50 dark:hover:bg-slate-800 ${
                  language === 'hi' ? 'text-teal-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{t('langHindi')}</span>
                {language === 'hi' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Toggle Light / Dark mode"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowBranchMenu(false);
              setShowRoleMenu(false);
              setShowLangMenu(false);
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Live Notifications
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded-full font-semibold">
                  3 New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900">
                  <p className="font-semibold text-teal-900 dark:text-teal-200">Patient Check-in: T-01</p>
                  <p className="text-teal-700 dark:text-teal-300 text-[11px]">Rajesh Kumar checked in for Dr. Sharma</p>
                  <span className="text-[10px] text-teal-600/70">2 mins ago</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">Low Stock Alert: Dolo 650</p>
                  <p className="text-amber-700 dark:text-amber-300 text-[11px]">Batch BAT-DOL-314 has 18 tablets remaining</p>
                  <span className="text-[10px] text-amber-600/70">15 mins ago</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900">
                  <p className="font-semibold text-rose-900 dark:text-rose-200">Emergency Red Triage</p>
                  <p className="text-rose-700 dark:text-rose-300 text-[11px]">Severe dyspnea case EM-2026-0041 admitted</p>
                  <span className="text-[10px] text-rose-600/70">32 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowBranchMenu(false);
              setShowRoleMenu(false);
              setShowLangMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || `@${user?.username}`}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
