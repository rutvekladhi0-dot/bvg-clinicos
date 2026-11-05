import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/common/StatCard';
import {
  Users, Calendar, UserCheck, Stethoscope, Bed, AlertOctagon,
  CreditCard, TrendingUp, AlertTriangle, FileText, ArrowUpRight,
  Activity, Clock, Pill, FlaskConical, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { branchId, t, role, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await api.getDashboardStats(branchId);
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [branchId]);

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('dashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('tagline')}
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <a
            href={api.getExcelExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
            {t('exportExcel')}
          </a>
          <a
            href={api.getPdfExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-3.5 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {t('exportPdf')}
          </a>
        </div>
      </div>

      {/* Role-Specific Operational Workspace */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white rounded-2xl p-5 shadow-sm border border-teal-700/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                {role.replace('_', ' ')} Workspace
              </span>
              <span className="text-xs text-teal-200">
                Active: <strong className="text-white">{user?.full_name || user?.username}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {role === 'DOCTOR' && 'Physician OPD Clinical & Consultation Station'}
              {role === 'PHARMACIST' && 'Dispensary POS & Batch Inventory Command'}
              {role === 'NURSE' && 'Inpatient Care, Bed Vitals & MAR Administration'}
              {role === 'LAB_TECHNICIAN' && 'Pathology Diagnostics & Specimen Analyzer Worklist'}
              {role === 'RADIOLOGIST' && 'Radiology PACS, Imaging Scans & Diagnostic Findings'}
              {role === 'ACCOUNTANT' && 'Revenue Cycle, Cash/UPI Billing Desk & Ledgers'}
              {role === 'HR_MANAGER' && 'Hospital Human Resources, Roster & Payroll Operations'}
              {role === 'OT_STAFF' && 'Operation Theatre Suites & WHO Surgical Checklist'}
              {role === 'RECEPTIONIST' && 'Front Desk Patient Intake & Queue Dispatch'}
              {role === 'PATIENT' && 'Patient Healthcare Portal & Self-Service Records'}
              {(role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN' || role === 'BRANCH_ADMIN') && 'Executive Enterprise Hospital Operations Hub'}
            </h2>
          </div>

          {/* Quick Shortcuts for this Role */}
          <div className="flex flex-wrap items-center gap-2">
            {role === 'DOCTOR' && (
              <>
                <button onClick={() => navigate('/opd')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Start OPD Consultation</button>
                <button onClick={() => navigate('/queue')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Call Next Token</button>
                <button onClick={() => navigate('/prescriptions')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Write Digital Rx</button>
                <button onClick={() => navigate('/telemedicine')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Video Visit</button>
              </>
            )}
            {role === 'PHARMACIST' && (
              <>
                <button onClick={() => navigate('/pharmacy')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">POS Dispense Counter</button>
                <button onClick={() => navigate('/prescriptions')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Incoming Prescriptions</button>
                <button onClick={() => navigate('/pharmacy')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Stock Reorder Alerts</button>
              </>
            )}
            {role === 'NURSE' && (
              <>
                <button onClick={() => navigate('/ipd')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Ward & Bed Matrix</button>
                <button onClick={() => navigate('/ipd')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Medication Records (MAR)</button>
                <button onClick={() => navigate('/emergency')} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold">ICU & Triage</button>
              </>
            )}
            {role === 'LAB_TECHNICIAN' && (
              <>
                <button onClick={() => navigate('/laboratory')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Specimen Collection</button>
                <button onClick={() => navigate('/laboratory')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Result Approval</button>
                <button onClick={() => navigate('/blood-bank')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Blood Bank Units</button>
              </>
            )}
            {role === 'RADIOLOGIST' && (
              <>
                <button onClick={() => navigate('/radiology')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Modality Scan Worklist</button>
                <button onClick={() => navigate('/radiology')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Verify Diagnostic Findings</button>
              </>
            )}
            {role === 'ACCOUNTANT' && (
              <>
                <button onClick={() => navigate('/billing')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Issue Patient Invoice</button>
                <button onClick={() => navigate('/billing')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Collect UPI/Cash</button>
                <button onClick={() => navigate('/accounting')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">P&L Financial Ledger</button>
                <button onClick={() => navigate('/insurance')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">TPA Cashless Claims</button>
              </>
            )}
            {role === 'HR_MANAGER' && (
              <>
                <button onClick={() => navigate('/hr')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Staff Directory</button>
                <button onClick={() => navigate('/hr')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Review Leave Requests</button>
                <button onClick={() => navigate('/hr')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Monthly Payroll Slips</button>
              </>
            )}
            {role === 'OT_STAFF' && (
              <>
                <button onClick={() => navigate('/operation-theatre')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Surgical Schedule</button>
                <button onClick={() => navigate('/operation-theatre')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">WHO Safety Checklist</button>
              </>
            )}
            {role === 'RECEPTIONIST' && (
              <>
                <button onClick={() => navigate('/patients')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Register Walk-in Patient</button>
                <button onClick={() => navigate('/appointments')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Book Doctor Slot</button>
                <button onClick={() => navigate('/queue')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Generate Token</button>
                <button onClick={() => navigate('/billing')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">OPD Billing Desk</button>
              </>
            )}
            {role === 'PATIENT' && (
              <>
                <button onClick={() => navigate('/portal')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">My Appointments</button>
                <button onClick={() => navigate('/portal')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">My Prescriptions</button>
                <button onClick={() => navigate('/portal')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Lab Reports</button>
                <button onClick={() => navigate('/portal')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Pay Invoices</button>
              </>
            )}
            {(role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN' || role === 'BRANCH_ADMIN') && (
              <>
                <button onClick={() => navigate('/patients')} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">Patient Master</button>
                <button onClick={() => navigate('/analytics')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Executive Analytics</button>
                <button onClick={() => navigate('/branches')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">Multi-Branch</button>
                <button onClick={() => navigate('/administration')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">RBAC Governance</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner (if any) */}
      {(stats.pharmacy_stock_alerts > 0 || stats.emergency_cases > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.pharmacy_stock_alerts > 0 && (
            <div
              onClick={() => navigate('/pharmacy')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 cursor-pointer hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {stats.pharmacy_stock_alerts} Medicine Batches Low in Stock
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Threshold below safety level. Click to review purchase orders.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
          )}

          {stats.emergency_cases > 0 && (
            <div
              onClick={() => navigate('/emergency')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 cursor-pointer hover:bg-rose-100/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    {stats.emergency_cases} Emergency Case Active in Triage
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400">
                    Immediate clinical attention requested in Resuscitation bay.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0" />
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalPatients')}
          value={stats.total_patients}
          change="+14.2%"
          subtitle="Registered in system"
          icon={Users}
        />
        <StatCard
          title={t('todayAppointments')}
          value={stats.today_appointments}
          change="+8%"
          subtitle="Consultation slots booked"
          icon={Calendar}
          iconColor="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          title={t('bedOccupancy')}
          value={`${stats.bed_occupancy_rate}%`}
          change={`${stats.occupied_beds}/${stats.total_beds} occupied`}
          subtitle={`${stats.available_beds} beds free`}
          icon={Bed}
          iconColor="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-950/40"
        />
        <StatCard
          title={t('todayRevenue')}
          value={`₹${stats.today_revenue.toLocaleString('en-IN')}`}
          change="+18.5%"
          subtitle={`₹${stats.monthly_revenue.toLocaleString('en-IN')} this month`}
          icon={CreditCard}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>{t('availableDoctors')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.available_doctors} <span className="text-xs text-slate-400 font-normal">/ {stats.total_doctors}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>{t('opdToday')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.opd_today}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Bed className="w-4 h-4 text-purple-600" />
            <span>{t('ipdAdmissions')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.ipd_admissions}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <CreditCard className="w-4 h-4 text-rose-600" />
            <span>{t('pendingPayments')}</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            ₹{stats.pending_payments.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {t('revenueAnalytics')}
              </h2>
              <p className="text-xs text-slate-400">Monthly billing collections vs target projection</p>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-1 rounded-md">
              H1 FY2026
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenue_trend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0F766E" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Department Performance */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
              {t('quickActions')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/patients')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 text-xs font-semibold transition-colors"
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span className="truncate">{t('registerPatient')}</span>
              </button>
              <button
                onClick={() => navigate('/appointments')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-800 dark:text-blue-300 text-xs font-semibold transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="truncate">{t('bookAppointment')}</span>
              </button>
              <button
                onClick={() => navigate('/ipd')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 text-purple-800 dark:text-purple-300 text-xs font-semibold transition-colors"
              >
                <Bed className="w-4 h-4 text-purple-600" />
                <span className="truncate">{t('admitPatient')}</span>
              </button>
              <button
                onClick={() => navigate('/billing')}
                className="flex items-center space-x-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="truncate">{t('generateBill')}</span>
              </button>
            </div>
          </div>

          {/* Department Consultation Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              {t('departmentPerformance')}
            </h2>
            <div className="space-y-2.5 mt-3">
              {stats.department_performance.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{d.consultations} visits</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('recentActivity')}
          </h2>
          <span className="text-xs text-slate-400">Real-time database stream</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.recent_activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                  {act.type === 'appointment' ? <Calendar className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{act.subtitle}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 block">{act.time}</span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                  {act.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
