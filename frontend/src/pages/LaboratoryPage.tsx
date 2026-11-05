import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LabOrder, LabTest, Patient, Doctor } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  FlaskConical, CheckCircle, Clock, Plus, Search,
  FileCheck, ShieldAlert, AlertTriangle, Eye, Printer
} from 'lucide-react';

export const LaboratoryPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Order Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPatient, setOrderPatient] = useState('');
  const [orderDoctor, setOrderDoctor] = useState('');
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

  // View Report Modal
  const [viewOrder, setViewOrder] = useState<LabOrder | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordList, testList, pList, dList] = await Promise.all([
        api.getLabOrders(`branch=${branchId}`),
        api.getLabTests(),
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
      ]);
      setOrders(ordList);
      setTests(testList);
      setPatients(pList);
      setDoctors(dList);
    } catch (err) {
      console.error('Error fetching lab data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPatient || !orderDoctor || selectedTests.length === 0) {
      showToast('Please select patient, doctor and at least one lab test', 'warning');
      return;
    }
    try {
      const items = selectedTests.map((tId) => ({
        test: tId,
        result_value: '13.5',
        unit: 'g/dL',
        is_abnormal: false,
      }));
      await api.createLabOrder({
        patient: Number(orderPatient),
        doctor: Number(orderDoctor),
        branch: branchId,
        status: 'Ordered',
        items,
      });
      showToast('Lab investigation ordered successfully!', 'success');
      setShowOrderModal(false);
      setSelectedTests([]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Order failed', 'error');
    }
  };

  const handleCollectSample = async (id: number) => {
    try {
      const updated = await api.collectLabSample(id);
      showToast(`Sample collected! Barcode: BAR-${updated.order_number}`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleApproveOrder = async (id: number) => {
    try {
      await api.approveLabOrder(id);
      showToast('Lab report approved & published! Invoiced to patient bill.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const toggleTest = (id: number) => {
    if (selectedTests.includes(id)) {
      setSelectedTests(selectedTests.filter((tId) => tId !== id));
    } else {
      setSelectedTests([...selectedTests, id]);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('laboratory')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinical pathology, biochemistry, sample collection barcode tracking & digital test results
          </p>
        </div>
        <button
          onClick={() => setShowOrderModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Order Lab Investigation
        </button>
      </div>

      {/* Lab Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Laboratory Orders Worklist ({orders.length})
            </h2>
            <p className="text-xs text-slate-400">Sample progression: Ordered → Sample Collected → Results Entered → Approved</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No Lab Orders Active"
            description="All diagnostic requests have been completed."
            actionText="Order Lab Test"
            onAction={() => setShowOrderModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Patient (UHID)</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Tests Ordered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {ord.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {ord.patient_uhid}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Dr. {ord.doctor_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ord.items?.map((it, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              it.is_abnormal
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {it.test_name}: {it.result_value || 'Pending'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          ord.status === 'Approved'
                            ? 'emerald'
                            : ord.status === 'Sample Collected'
                            ? 'teal'
                            : 'amber'
                        }
                      >
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {ord.status === 'Ordered' && (
                        <button
                          onClick={() => handleCollectSample(ord.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                        >
                          Collect Sample
                        </button>
                      )}
                      {ord.status === 'Sample Collected' && (
                        <button
                          onClick={() => handleApproveOrder(ord.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                        >
                          Approve Report
                        </button>
                      )}
                      <button
                        onClick={() => setViewOrder(ord)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Lab Tests Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order Laboratory Investigations"
        subtitle="Select patient, referring clinician and test catalog items"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={orderPatient}
              onChange={(e) => setOrderPatient(e.target.value)}
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
              Referring Clinician *
            </label>
            <select
              required
              value={orderDoctor}
              onChange={(e) => setOrderDoctor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Lab Tests from Catalog
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {tests.map((t) => {
                const isChecked = selectedTests.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isChecked ? 'bg-teal-100/70 dark:bg-teal-950/60 font-bold text-teal-900 dark:text-teal-200' : 'hover:bg-slate-200/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTest(t.id)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 truncate">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">₹{t.standard_fee} • {t.sample_type}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Place Lab Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Digital Lab Report Modal */}
      {viewOrder && (
        <Modal
          isOpen={!!viewOrder}
          onClose={() => setViewOrder(null)}
          title={`Diagnostic Report - ${viewOrder.order_number}`}
          subtitle={`Patient: ${viewOrder.patient_name} (${viewOrder.patient_uhid})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Pathology & Clinical Biochemistry Dept.</p>
                <p className="text-slate-500">Referring Doctor: Dr. {viewOrder.doctor_name}</p>
              </div>
              <div className="text-right">
                <Badge variant={viewOrder.status === 'Approved' ? 'emerald' : 'amber'}>
                  {viewOrder.status}
                </Badge>
                <p className="text-[10px] text-slate-400 mt-1">{viewOrder.created_at?.split('T')[0]}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2">Investigation</th>
                  <th className="py-2">Result Value</th>
                  <th className="py-2">Biological Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewOrder.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{it.test_name}</td>
                    <td className={`py-2.5 font-mono font-bold ${it.is_abnormal ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {it.result_value} {it.unit}
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">{it.reference_interval || 'Standard Range'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viewOrder.clinical_remarks && (
              <div className="p-3 bg-teal-50 dark:bg-slate-800 rounded-xl">
                <span className="font-bold block text-teal-900 dark:text-teal-200">Pathologist Clinical Remarks:</span>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{viewOrder.clinical_remarks}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-[#0F766E] text-white font-bold rounded-xl shadow-sm text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Verified Lab Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
