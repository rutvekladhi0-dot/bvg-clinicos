import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  LineChart, TrendingUp, Users, DollarSign, Bed, Download,
  Activity, Award, Calendar, BarChart3
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { branchId, t } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getAdvancedAnalytics(branchId);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [branchId]);

  if (loading || !analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const COLORS = ['#0F766E', '#14B8A6', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('analytics')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinical KPI benchmarks, department financial contributions & business intelligence reporting
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <a
            href={api.getExcelExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
            {t('exportExcel')}
          </a>
          <a
            href={api.getPdfExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-3.5 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {t('exportPdf')}
          </a>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bed Utilization Benchmark</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {analytics.bed_utilization_rate}%
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">Optimal Tier (&gt;75%)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Length of Stay (ALOS)</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {analytics.average_length_of_stay_days} Days
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">Clinical efficiency standard</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Satisfaction Score</span>
          <p className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1">
            {analytics.patient_satisfaction_rate}%
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">Based on discharge feedback</span>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Contribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Department Revenue Contribution
              </h2>
              <p className="text-xs text-slate-400">Contribution across OPD, IPD, Surgery, Pharmacy & Labs</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.revenue_by_category}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {analytics.revenue_by_category?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {analytics.revenue_by_category?.map((c: any, i: number) => (
              <div key={i} className="flex items-center space-x-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-300 truncate">{c.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Inflow Trends Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Weekly Inflow by Intake Stream
              </h2>
              <p className="text-xs text-slate-400">Daily patient arrivals across OPD, IPD and Emergency triage</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.patient_flow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="opd" name="OPD" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ipd" name="IPD" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emergency" name="Emergency" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Performance & Productivity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Consultant Clinical Productivity & Revenue Attribution
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Clinician Name</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Consultations Conducted</th>
                <th className="py-3 px-4">Patient Rating</th>
                <th className="py-3 px-4 font-mono">Revenue Generated</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {analytics.doctor_metrics?.map((doc: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{doc.doctor_name}</td>
                  <td className="py-3.5 px-4 text-teal-700 dark:text-teal-400 font-semibold">{doc.specialization}</td>
                  <td className="py-3.5 px-4 font-bold font-mono">{doc.consultations} patients</td>
                  <td className="py-3.5 px-4 font-semibold text-amber-500">★ {doc.rating} / 5.0</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                    ₹{Number(doc.revenue_generated).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant={doc.available ? 'emerald' : 'slate'}>
                      {doc.available ? 'Active' : 'Off Duty'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
