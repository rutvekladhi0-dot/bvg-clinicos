import React, { useState } from 'react';
import {
  Activity,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Stethoscope,
  HeartPulse,
  Pill,
  FlaskConical,
  CreditCard,
  UserCheck,
  Building,
  UserCog,
  Scan,
  Scissors
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';

const DEMO_PRESETS = [
  { username: 'admin', role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Enterprise multi-hospital oversight', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  { username: 'hosp_admin', role: 'HOSPITAL_ADMIN', label: 'Hospital Admin', desc: 'Campus operations & master rosters', icon: Building, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  { username: 'branch_admin', role: 'BRANCH_ADMIN', label: 'Branch Admin', desc: 'Branch scheduling & departments', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
  { username: 'dr_sharma', role: 'DOCTOR', label: 'Doctor (Dr. Sharma)', desc: 'Cardiology OPD, clinical Rx & orders', icon: Stethoscope, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
  { username: 'receptionist', role: 'RECEPTIONIST', label: 'Receptionist', desc: 'Front desk, walk-ins & queue tokens', icon: UserCheck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { username: 'nurse_priya', role: 'NURSE', label: 'Nursing Staff', desc: 'IPD ward bed vitals & MAR logs', icon: HeartPulse, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  { username: 'pharmacist_rahul', role: 'PHARMACIST', label: 'Pharmacist', desc: 'POS counter & batch stock deduction', icon: Pill, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { username: 'lab_tech_anil', role: 'LAB_TECHNICIAN', label: 'Lab Technician', desc: 'Pathology diagnostic orders & results', icon: FlaskConical, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { username: 'radiologist_sunil', role: 'RADIOLOGIST', label: 'Radiologist', desc: 'X-Ray, CT, MRI scans & reports', icon: Scan, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
  { username: 'accountant_neha', role: 'ACCOUNTANT', label: 'Accountant', desc: 'Invoices, UPI payments & P&L', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
  { username: 'hr_manager', role: 'HR_MANAGER', label: 'HR Manager', desc: 'Staff directory, payroll & leaves', icon: UserCog, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40' },
  { username: 'ot_staff_vikram', role: 'OT_STAFF', label: 'OT Surgical Staff', desc: 'Surgery suites & WHO checklist', icon: Scissors, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
  { username: 'patient_rajesh', role: 'PATIENT', label: 'Patient Portal', desc: 'Self-service appointments & records', icon: User, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
];

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'demo' | 'register'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password 2-Step Flow
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Register Form
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'PATIENT',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Please enter both username and password', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      // toast shown in context
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demo: typeof DEMO_PRESETS[0]) => {
    setLoading(true);
    try {
      await switchDemoRole(demo.role);
    } catch (err: any) {
      addToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      addToast(res.message || 'Verification passcode generated', 'info');
      if (res.demo_otp) {
        setForgotOtp(res.demo_otp);
      }
      setForgotStep(2);
    } catch (err: any) {
      addToast(err.message || 'Failed to request OTP', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || !forgotNewPassword) {
      addToast('Please fill in the OTP and new password', 'warning');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        new_password: forgotNewPassword,
      });
      addToast(res.message || 'Password reset successful!', 'success');
      setIsForgotOpen(false);
      setForgotStep(1);
      setUsername(forgotEmail);
      setPassword(forgotNewPassword);
    } catch (err: any) {
      addToast(err.message || 'Password reset failed', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/20">
        
        {/* Left Side: Hospital Branding & Info */}
        <div className="md:col-span-5 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">BVG ClinicOS</h1>
                <p className="text-xs text-teal-200 font-medium">Enterprise Healthcare Suite</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <h2 className="text-2xl font-extrabold text-white leading-snug">
                Complete Healthcare Management. One Intelligent Platform.
              </h2>
              <p className="text-teal-100/90 text-sm leading-relaxed">
                Interconnected clinical, surgical, diagnostics, pharmacy, accounting, and multi-tenant hospital operations designed for DPDP Act 2023 & HIPAA compliance standards.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-teal-600/50 space-y-2 text-xs text-teal-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>Role-Based Access Control (13 Personas)</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-300" />
              <span>Multi-Hospital & Branch Partitioning</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>AI Clinical Insights & Decision Support</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              13 Demo Personas
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Patient Portal Signup
            </button>
          </div>

          {/* Tab 1: Standard Sign In */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username or Work Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. admin or dr.sharma"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(true);
                      setForgotStep(1);
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Enter account password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating with JWT...' : 'Sign In to BVG ClinicOS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800 mt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standard Demo Credential: <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">Clinicos@2026</span>
                </p>
              </div>
            </form>
          )}

          {/* Tab 2: 13 Explicit Demo Personas */}
          {activeTab === 'demo' && (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Click any persona below to authenticate and enter their tailored dashboard:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_PRESETS.map((demo) => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.username}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickDemo(demo)}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-slate-800 text-left transition-all group disabled:opacity-50"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${demo.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400">
                          {demo.label}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {demo.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Registration */}
          {activeTab === 'register' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addToast('Patient registration complete. Please sign in.', 'success');
                setActiveTab('signin');
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.first_name}
                    onChange={(e) => setRegData({ ...regData, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                    placeholder="Suresh"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.last_name}
                    onChange={(e) => setRegData({ ...regData, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                    placeholder="Kadam"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  placeholder="suresh@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Username
                </label>
                <input
                  type="text"
                  required
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  placeholder="suresh.kadam"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-all mt-2"
              >
                Create Patient Account
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password 2-Step Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={forgotStep === 1 ? "Step 1: Request Verification Passcode" : "Step 2: Reset Your Account Password"}
        maxWidth="md"
      >
        {forgotStep === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered hospital work email or patient portal username. A 6-digit one-time passcode will be issued.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Work Email
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. admin@bvgclinicos.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {forgotLoading ? 'Issuing OTP...' : 'Generate OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 6-digit OTP code along with your new secure password.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                6-Digit Verification OTP
              </label>
              <input
                type="text"
                required
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono tracking-widest text-center focus:ring-2 focus:ring-teal-500"
                placeholder="789124"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Account Password
              </label>
              <input
                type="password"
                required
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                placeholder="Enter minimum 6 characters"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Back to Step 1
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default LoginPage;
