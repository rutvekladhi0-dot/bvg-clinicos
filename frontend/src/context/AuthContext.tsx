import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Language, Branch } from '../types';
import { translations, dynamicLabels } from '../i18n/translations';
import { api } from '../services/api';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  setRole: (role: Role) => void;
  branchId: number;
  setBranchId: (id: number) => void;
  branches: Branch[];
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'] | string) => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (username: string, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (roleName: string) => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERNAMES: Record<Role, string> = {
  SUPER_ADMIN: 'admin',
  HOSPITAL_ADMIN: 'hosp_admin',
  BRANCH_ADMIN: 'branch_admin',
  DOCTOR: 'dr_sharma',
  RECEPTIONIST: 'receptionist',
  NURSE: 'nurse_priya',
  PHARMACIST: 'pharmacist_rahul',
  LAB_TECHNICIAN: 'lab_tech_anil',
  RADIOLOGIST: 'radiologist_sunil',
  ACCOUNTANT: 'accountant_neha',
  HR_MANAGER: 'hr_manager',
  OT_STAFF: 'ot_staff_vikram',
  PATIENT: 'patient_rajesh',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRoleState] = useState<Role>('SUPER_ADMIN');
  const [branchId, setBranchIdState] = useState<number>(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bvg_lang') as Language;
    return saved === 'mr' || saved === 'hi' || saved === 'en' ? saved : 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize theme from storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('bvg_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    const savedLang = localStorage.getItem('bvg_lang') as Language;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('bvg_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bvg_lang', lang);
  };

  const setBranchId = (id: number) => {
    setBranchIdState(id);
    localStorage.setItem('bvg_branch_id', String(id));
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
    showToast(`Active perspective switched to ${newRole}`, 'info');
  };

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const t = (key: keyof typeof translations['en'] | string): string => {
    const langDict = (translations as any)[language] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const dynamicMap = dynamicLabels[language] || dynamicLabels.en;
    if (dynamicMap && dynamicMap[key]) {
      return dynamicMap[key];
    }
    return (translations.en as any)[key] || String(key);
  };

  // Perform real authenticated login
  const login = async (username: string, password = 'Clinicos@2026') => {
    try {
      const res = await api.login({ username, password });
      if (res.access) {
        localStorage.setItem('bvg_token', res.access);
        setUser(res.user);
        setRoleState(res.user.role);
        showToast(`Welcome back, ${res.user.full_name || res.user.username}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please verify credentials.', 'error');
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.register(data);
      if (res && res.access) {
        localStorage.setItem('bvg_token', res.access);
        setUser(res.user);
        setRoleState(res.user.role);
        showToast(`Registration successful! Welcome, ${res.user.full_name || res.user.username}!`, 'success');
      } else {
        await login(data.username, data.password);
        showToast(`Registration successful! Welcome, ${data.first_name || data.username}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
      throw err;
    }
  };

  // Explicit demo persona switch with real backend JWT authentication
  const switchDemoRole = async (roleName: string) => {
    let targetRole: Role = 'SUPER_ADMIN';
    const r = roleName.toUpperCase();
    if (r.includes('SUPER')) targetRole = 'SUPER_ADMIN';
    else if (r.includes('BRANCH')) targetRole = 'BRANCH_ADMIN';
    else if (r.includes('DOCTOR') || r.includes('PHYSICIAN')) targetRole = 'DOCTOR';
    else if (r.includes('RECEPTION')) targetRole = 'RECEPTIONIST';
    else if (r.includes('NURSE')) targetRole = 'NURSE';
    else if (r.includes('PHARMAC')) targetRole = 'PHARMACIST';
    else if (r.includes('LAB')) targetRole = 'LAB_TECHNICIAN';
    else if (r.includes('RADIO')) targetRole = 'RADIOLOGIST';
    else if (r.includes('ACCOUNT')) targetRole = 'ACCOUNTANT';
    else if (r.includes('HR')) targetRole = 'HR_MANAGER';
    else if (r.includes('OT') || r.includes('SURG')) targetRole = 'OT_STAFF';
    else if (r.includes('PATIENT')) targetRole = 'PATIENT';

    const username = DEMO_USERNAMES[targetRole] || 'admin';
    try {
      await login(username, 'Clinicos@2026');
    } catch {
      // Fallback in case of network issue
      setRoleState(targetRole);
      showToast(`Switched persona to ${targetRole}`, 'info');
    }
  };

  const logout = () => {
    localStorage.removeItem('bvg_token');
    localStorage.removeItem('bvg_branch_id');
    setUser(null);
    showToast('You have been securely logged out.', 'info');
  };

  // Verify authentication on initial load strictly via token
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      // Load branches
      try {
        const branchList = await api.getBranches();
        if (Array.isArray(branchList) && branchList.length > 0) {
          setBranches(branchList);
          const savedBranch = localStorage.getItem('bvg_branch_id');
          if (savedBranch) {
            setBranchIdState(Number(savedBranch));
          } else {
            setBranchIdState(branchList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load branches", err);
      }

      // Check JWT token
      const token = localStorage.getItem('bvg_token');
      if (token) {
        try {
          const me = await api.getMe();
          if (me && me.id) {
            setUser(me);
            setRoleState(me.role);
          } else {
            localStorage.removeItem('bvg_token');
            setUser(null);
          }
        } catch {
          localStorage.removeItem('bvg_token');
          setUser(null);
        }
      } else {
        // No token: ensure user is strictly null!
        setUser(null);
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        setRole,
        branchId,
        setBranchId,
        branches,
        language,
        setLanguage,
        t,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        switchDemoRole,
        toasts,
        showToast,
        addToast: showToast,
        removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
