import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  UserCog, Users, Calendar, CheckCircle2, XCircle,
  FileText, DollarSign, Clock, ShieldCheck
} from 'lucide-react';

export const HRStaffPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'directory' | 'leaves' | 'payroll'>('directory');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sList, lList, pList] = await Promise.all([
        api.getStaffProfiles(),
        api.getLeaveRequests(),
        api.getPayrolls(),
      ]);
      setStaff(sList);
      setLeaves(lList);
      setPayrolls(pList);
    } catch (err) {
      console.error('Error fetching HR data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleApproveLeave = async (id: number) => {
    try {
      await api.approveLeaveRequest(id);
      showToast('Leave request approved by HR manager', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('hrStaff')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Employee directory, attendance logs, leave approval workflows & monthly payroll disbursement
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            tab === 'directory'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Staff Directory ({staff.length})
        </button>
        <button
          onClick={() => setTab('leaves')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            tab === 'leaves'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Leave Requests ({leaves.length})
        </button>
        <button
          onClick={() => setTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            tab === 'payroll'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Payroll Slips ({payrolls.length})
        </button>
      </div>

      {tab === 'directory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-slate-800 flex items-center justify-center font-bold text-teal-700">
                  {s.full_name?.[0] || 'E'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.full_name}</h3>
                  <p className="text-xs text-teal-600 font-semibold">{s.designation}</p>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {s.employee_id}</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{s.department_name || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Basic Salary:</span>
                  <span className="font-bold font-mono">₹{Number(s.basic_salary).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Joined:</span>
                  <span className="font-mono text-slate-500">{s.joining_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaves' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {leaves.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No pending leave applications.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{l.staff_name}</td>
                      <td className="py-3.5 px-4">{l.leave_type}</td>
                      <td className="py-3.5 px-4 font-mono">{l.start_date} to {l.end_date}</td>
                      <td className="py-3.5 px-4 font-bold">{l.days_count} d</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{l.reason}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={l.status === 'Approved' ? 'emerald' : 'amber'}>{l.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {l.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveLeave(l.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Month / Year</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">HRA + Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payrolls.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {p.staff_name} <span className="block text-[10px] text-slate-400 font-normal">{p.designation}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{p.month}/{p.year}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">₹{Number(p.basic_salary).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono">₹{(Number(p.hra) + Number(p.allowances)).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">₹{Number(p.deductions).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-600">₹{Number(p.net_salary).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="emerald">{p.payment_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
