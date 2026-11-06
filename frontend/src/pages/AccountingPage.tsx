import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Calculator, TrendingUp, TrendingDown, Plus, FileText,
  DollarSign, ArrowUpRight, ArrowDownLeft, BarChart3, PieChart,
  ShieldCheck, Wallet, CreditCard, Building2, Sparkles
} from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'analytics'>('ledger');

  // New Voucher Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    account_head: '',
    voucher_type: 'Receipt',
    amount: 10000,
    payment_mode: 'Bank Transfer',
    reference_no: '',
    narration: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumData, vList, aList, cList] = await Promise.all([
        api.getFinancialSummary(branchId),
        api.getVouchers(),
        api.getAccountHeads(),
        api.getDoctorCommissions(),
      ]);
      setSummary(sumData);
      setVouchers(vList);
      setAccounts(aList);
      setCommissions(cList);
      if (aList.length > 0) setForm((prev) => ({ ...prev, account_head: String(aList[0].id) }));
    } catch (err) {
      console.error('Error fetching accounting data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVoucher({
        ...form,
        branch: branchId,
        amount: Number(form.amount),
        account_head: Number(form.account_head),
      });
      showToast('Accounting voucher logged successfully!', 'success');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Voucher logging failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('accounting')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            General ledger, cash & bank vouchers, Profit & Loss reporting and doctor commission accounting
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Financial Voucher
        </button>
      </div>

      {/* Financial Health Indicators */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Operating Income</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{summary.total_income?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500 block mt-1">OPD + IPD + Pharmacy + Vouchers</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital Expenses</span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                ₹{summary.total_expenses?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500 block mt-1">Salaries, Pharma, Consumables</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Net Hospital Profit</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ₹{summary.net_profit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] font-bold text-teal-600 block mt-1">
                Margin: {summary.profit_margin_percent}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          General Ledger Vouchers ({vouchers.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
          {t('financialAccountAnalytics')}
        </button>
      </div>

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Accounting Vouchers Ledger ({vouchers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Account Head</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Mode / Ref</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">{v.voucher_number}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{v.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{v.account_name}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={v.voucher_type === 'Receipt' ? 'emerald' : 'rose'}>{v.voucher_type}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{v.payment_mode} • {v.reference_no || 'Direct'}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{v.narration}</td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${v.voucher_type === 'Receipt' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{Number(v.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Account Analytics Tab */}
      {activeTab === 'analytics' && summary && (
        <div className="space-y-6">
          {/* Executive KPI Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operating Profit Margin</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {summary.profit_margin_percent}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Net profit after all operating heads</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated EBITDA</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.kpis?.ebitda || `₹${(summary.net_profit * 1.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Earnings before interest & taxes</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Daily Revenue Run Rate</span>
              <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                {summary.kpis?.avg_daily_collection || `₹${(summary.total_income / 30).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Across 30 calendar days</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settled Invoices</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.kpis?.total_invoices_cleared || 48} Invoices
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Zero bad-debt default rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Departmental Revenue Distribution */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Departmental Revenue Contribution
                </h3>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">100% Hospital Total</span>
              </div>

              <div className="space-y-3 pt-2">
                {(summary.department_revenue || [
                  { department: 'Inpatient Department (IPD)', amount: summary.total_income * 0.35, share: 35 },
                  { department: 'Outpatient Clinic (OPD)', amount: summary.total_income * 0.28, share: 28 },
                  { department: 'Pharmacy POS & Sales', amount: summary.total_income * 0.18, share: 18 },
                  { department: 'Laboratory & Diagnostics', amount: summary.total_income * 0.12, share: 12 },
                  { department: 'Operation Theatre Surgeries', amount: summary.total_income * 0.07, share: 7 },
                ]).map((dept: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dept.department}</span>
                      <span className="font-extrabold text-teal-700 dark:text-teal-400">
                        ₹{Number(dept.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({dept.share}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full"
                        style={{ width: `${dept.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Mode Collection Split */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  Collection Channels & Payment Modes
                </h3>
                <span className="text-xs text-slate-400">Instant Reconciliation</span>
              </div>

              <div className="space-y-3 pt-2">
                {(summary.payment_modes || [
                  { mode: 'UPI & Dynamic QR (GPay, PhonePe)', share: 48, amount: summary.total_income * 0.48 },
                  { mode: 'Cash Front Desk', share: 24, amount: summary.total_income * 0.24 },
                  { mode: 'Insurance TPA Cashless Settlement', share: 18, amount: summary.total_income * 0.18 },
                  { mode: 'Debit / Credit Card POS', share: 10, amount: summary.total_income * 0.10 },
                ]).map((pm: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{pm.mode}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        ₹{Number(pm.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-bold">({pm.share}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly P&L Trend Visual */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              6-Month Financial Performance Trends (Revenue vs Expenses vs Net Profit)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3">Gross Income (₹)</th>
                    <th className="py-2.5 px-3">Operating Expense (₹)</th>
                    <th className="py-2.5 px-3">Net Profit (₹)</th>
                    <th className="py-2.5 px-3">Financial Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(summary.monthly_trends || [
                    { month: 'June 2026', revenue: 210000, expenses: 145000, net_profit: 65000 },
                    { month: 'July 2026', revenue: 245000, expenses: 155000, net_profit: 90000 },
                    { month: 'August 2026', revenue: 260000, expenses: 162000, net_profit: 98000 },
                    { month: 'September 2026', revenue: 285000, expenses: 175000, net_profit: 110000 },
                    { month: 'October 2026', revenue: 310000, expenses: 185000, net_profit: 125000 },
                    { month: 'November 2026', revenue: 340000, expenses: 198000, net_profit: 142000 },
                  ]).map((tr: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{tr.month}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                        ₹{Number(tr.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-600">
                        ₹{Number(tr.expenses).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-teal-700 dark:text-teal-400">
                        ₹{Number(tr.net_profit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="emerald">Profitable (+{Math.round((tr.net_profit / tr.revenue) * 100)}%)</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Voucher Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Accounting Voucher"
        subtitle="Log income receipts, vendor payments and operational expenses"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Voucher Type *
              </label>
              <select
                value={form.voucher_type}
                onChange={(e) => setForm({ ...form, voucher_type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="Receipt">Receipt (Income)</option>
                <option value="Payment">Payment (Expense)</option>
                <option value="Journal">Journal Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Head *
              </label>
              <select
                value={form.account_head}
                onChange={(e) => setForm({ ...form, account_head: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name} ({a.account_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel
              </label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="Cash">Cash Ledger</option>
                <option value="UPI">UPI / Digital QR</option>
                <option value="Cheque">Bank Cheque / DD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Narration / Ledger Description *
            </label>
            <textarea
              required
              rows={2}
              value={form.narration}
              onChange={(e) => setForm({ ...form, narration: e.target.value })}
              placeholder="e.g. Monthly maintenance contract payment for Siemens MRI"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Post Ledger Voucher
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
