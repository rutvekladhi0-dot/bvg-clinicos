import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RadiologyOrder, RadiologyInvestigation, Patient, Doctor } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Scan, Plus, Eye, CheckCircle2, Clock, Image as ImageIcon,
  FileText, ShieldCheck
} from 'lucide-react';

export const RadiologyPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [investigations, setInvestigations] = useState<RadiologyInvestigation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [invId, setInvId] = useState('');

  // Submit Report Modal
  const [reportingOrder, setReportingOrder] = useState<RadiologyOrder | null>(null);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordList, invList, pList, dList] = await Promise.all([
        api.getRadiologyOrders(`branch=${branchId}`),
        api.getRadiologyInvestigations(),
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
      ]);
      setOrders(ordList);
      setInvestigations(invList);
      setPatients(pList);
      setDoctors(dList);
    } catch (err) {
      console.error('Error fetching radiology data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId || !invId) {
      showToast('Please select patient, doctor and imaging scan', 'warning');
      return;
    }
    try {
      await api.createRadiologyOrder({
        patient: Number(patientId),
        doctor: Number(doctorId),
        investigation: Number(invId),
        branch: branchId,
        status: 'Requested',
      });
      showToast('Radiology scan scheduled successfully!', 'success');
      setShowNewModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Order failed', 'error');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingOrder) return;
    try {
      await api.submitRadiologyReport(reportingOrder.id, {
        findings,
        impression,
        image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600',
      });
      showToast('Radiology report verified & approved! Invoiced to patient bill.', 'success');
      setReportingOrder(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Report submission failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('radiology')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Digital Radiography, CT Scan, 3T MRI, Ultrasound & verified imaging impressions
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Imaging Scan
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Radiology Investigations Worklist ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={Scan}
            title="No Imaging Scans Active"
            description="All requested scans have been reported."
            actionText="Schedule Scan"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Scan ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Investigation</th>
                  <th className="py-3 px-4">Referring Doctor</th>
                  <th className="py-3 px-4">Requested On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {ord.patient_name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {ord.investigation_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      Dr. {ord.doctor_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {ord.created_at?.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={ord.status === 'Reported' ? 'emerald' : 'amber'}>
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {ord.status !== 'Reported' ? (
                        <button
                          onClick={() => {
                            setReportingOrder(ord);
                            setFindings('Normal anatomical alignment. No evidence of focal lesion, fracture or abnormal soft tissue shadow.');
                            setImpression('Normal study within biological variation.');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                        >
                          Submit Report
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px]">Report Published</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Imaging Scan Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Schedule Radiology Investigation"
        subtitle="Book CT, MRI, X-Ray or High-Resolution Ultrasound"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
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
              Referring Consultant *
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
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
              Select Investigation *
            </label>
            <select
              required
              value={invId}
              onChange={(e) => setInvId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Imaging Scan --</option>
              {investigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.code}) - ₹{inv.standard_fee}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Confirm Scan Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Report Modal */}
      {reportingOrder && (
        <Modal
          isOpen={!!reportingOrder}
          onClose={() => setReportingOrder(null)}
          title={`Radiologist Findings - ${reportingOrder.order_number}`}
          subtitle={`Investigation: ${reportingOrder.investigation_name} | Patient: ${reportingOrder.patient_name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Radiological Findings *
              </label>
              <textarea
                rows={4}
                required
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Impression & Clinical Conclusion *
              </label>
              <textarea
                rows={2}
                required
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReportingOrder(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
              >
                Publish & Invoice Report
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
