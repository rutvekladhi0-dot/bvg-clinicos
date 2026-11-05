import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Invoice, Patient } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  CreditCard, DollarSign, Plus, Printer, CheckCircle2,
  Clock, AlertCircle, FileText, Download, QrCode
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Record Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');

  // Create Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvPatient, setNewInvPatient] = useState('');
  const [newInvType, setNewInvType] = useState('OPD');
  const [newInvItems, setNewInvItems] = useState([
    { service_category: 'Consultation', description: 'Specialist Medical Consultation', quantity: 1, unit_price: 600 }
  ]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branch', String(branchId));
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const [invList, pList] = await Promise.all([
        api.getInvoices(params.toString()),
        api.getPatients(`branch=${branchId}`)
      ]);
      setInvoices(invList);
      setPatients(pList);
    } catch (err) {
      console.error('Error fetching invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [branchId, statusFilter]);

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPayAmount(Number(inv.balance_amount));
    setPayRef(`UPI/${new Date().getFullYear()}/${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    try {
      await api.recordPayment(paymentInvoice.id, {
        amount: payAmount,
        payment_method: payMethod,
        transaction_reference: payRef,
        notes: `Settled via ${payMethod} desk counter`,
      });
      showToast(`Payment of ₹${payAmount} recorded successfully!`, 'success');
      setPaymentInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message || 'Payment recording failed', 'error');
    }
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvPatient) {
      showToast('Please select a patient', 'warning');
      return;
    }
    try {
      const items = newInvItems.map((i) => ({
        ...i,
        total_price: i.quantity * i.unit_price,
      }));
      const subtotal = items.reduce((acc, cur) => acc + cur.total_price, 0);

      await api.createInvoice({
        patient: Number(newInvPatient),
        branch: branchId,
        invoice_type: newInvType,
        subtotal,
        tax_rate: 0,
        tax_amount: 0,
        discount: 0,
        total_amount: subtotal,
        paid_amount: 0,
        balance_amount: subtotal,
        status: 'Unpaid',
        items,
      });

      showToast('Invoice generated successfully!', 'success');
      setShowCreateModal(false);
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    }
  };

  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.total_amount), 0);
  const totalPaid = invoices.reduce((acc, i) => acc + Number(i.paid_amount), 0);
  const totalPending = invoices.reduce((acc, i) => acc + Number(i.balance_amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('billing')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            OPD/IPD hospital invoices, payment receipts, GST breakdown & payment gateway integrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('generateBill')}
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-teal-600 font-semibold mt-1 block">{invoices.length} Invoices generated</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Realized & Paid</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Cleared via Cash / UPI / TPA</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Outstanding Receivables</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Pending collection</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto">
        {['All', 'Unpaid', 'Partially Paid', 'Paid'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === st
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {st} Invoices
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading hospital billing data...</div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Invoices Found"
            description="No billing invoices match the active filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient (UHID)</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {inv.patient_uhid}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                        {inv.invoice_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.created_at?.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="text-emerald-600 font-semibold">Paid: ₹{Number(inv.paid_amount).toFixed(2)}</div>
                      <div className="text-rose-600 font-bold">Bal: ₹{Number(inv.balance_amount).toFixed(2)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.status === 'Paid'
                            ? 'emerald'
                            : inv.status === 'Partially Paid'
                            ? 'amber'
                            : 'rose'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {inv.status !== 'Paid' && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                        >
                          Collect Payment
                        </button>
                      )}
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          title={`Collect Payment - ${paymentInvoice.invoice_number}`}
          subtitle={`Patient: ${paymentInvoice.patient_name} | Outstanding: ₹${Number(paymentInvoice.balance_amount).toFixed(2)}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount to Collect (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                max={Number(paymentInvoice.balance_amount)}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-teal-700 dark:text-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel *
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="UPI">UPI / QR Code (PhonePe, GPay, Paytm)</option>
                <option value="Cash">Cash (Hospital Counter)</option>
                <option value="Card">Credit / Debit Card POS</option>
                <option value="NetBanking">NetBanking / RTGS / NEFT</option>
                <option value="Insurance">Insurance TPA Cashless</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction / UTR Reference
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. UPI/2026/894019201"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Custom Bill Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate Healthcare Invoice"
        subtitle="Create itemized patient bill for consultations, procedures or tests"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={newInvPatient}
              onChange={(e) => setNewInvPatient(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Invoice Category
            </label>
            <select
              value={newInvType}
              onChange={(e) => setNewInvType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="OPD">OPD Consultation & Assessment</option>
              <option value="IPD">IPD Hospitalization</option>
              <option value="Surgery">Operation Theatre & Surgery</option>
              <option value="Laboratory">Laboratory Diagnostics</option>
              <option value="Radiology">Radiology Imaging</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Bill Line Items
            </label>
            {newInvItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) => {
                    const updated = [...newInvItems];
                    updated[idx].description = e.target.value;
                    setNewInvItems(updated);
                  }}
                  placeholder="Service description"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => {
                    const updated = [...newInvItems];
                    updated[idx].quantity = Number(e.target.value);
                    setNewInvItems(updated);
                  }}
                  className="w-16 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="number"
                  required
                  value={item.unit_price}
                  onChange={(e) => {
                    const updated = [...newInvItems];
                    updated[idx].unit_price = Number(e.target.value);
                    setNewInvItems(updated);
                  }}
                  placeholder="Price (₹)"
                  className="w-24 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
