import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Calculator, TrendingUp, TrendingDown, Plus, FileText,
  DollarSign, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export const AccountingPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      {/* Vouchers Table */}
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
