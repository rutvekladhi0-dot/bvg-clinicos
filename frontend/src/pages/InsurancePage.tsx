import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InsuranceClaim, Patient } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Shield, CheckCircle2, Clock, AlertTriangle, Plus,
  Building2, FileText, Check
} from 'lucide-react';

export const InsurancePage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // New Claim Modal
  const [showModal, setShowModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    patient: '',
    insurance: 1,
    claimed_amount: 150000,
    approved_amount: 135000,
    tpa_reference_no: 'TPA-PREAUTH-2026-99',
    status: 'Pre-Auth Approved',
    remarks: 'Pre-authorization granted for cashless hospitalization.',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [claimList, provList, pList] = await Promise.all([
        api.getInsuranceClaims(),
        api.getInsuranceProviders(),
        api.getPatients(`branch=${branchId}`),
      ]);
      setClaims(claimList);
      setProviders(provList);
      setPatients(pList);
    } catch (err) {
      console.error('Error fetching insurance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.patient) {
      showToast('Please select a patient', 'warning');
      return;
    }
    try {
      await api.createInsuranceClaim(claimForm);
      showToast('Insurance cashless claim initiated successfully!', 'success');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Claim failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('insurance')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cashless pre-authorization requests, TPA claim tracking, queries & reimbursement settlements
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Initiate Cashless Pre-Auth
        </button>
      </div>

      {/* Insurance Providers TPA Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((prov) => (
          <div
            key={prov.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{prov.name}</span>
              <Badge variant="teal">Cashless Active</Badge>
            </div>
            <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">TPA: {prov.tpa_name || 'Direct Desk'}</p>
            <p className="text-[11px] text-slate-400 font-mono">Toll Free: {prov.contact_phone}</p>
          </div>
        ))}
      </div>

      {/* Claims List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            TPA Insurance Claims Tracker ({claims.length})
          </h2>
        </div>

        {claims.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No Claims Registered"
            description="No active cashless insurance claims registered."
            actionText="Initiate Claim"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Insurance Provider & TPA</th>
                  <th className="py-3 px-4">Claimed (₹)</th>
                  <th className="py-3 px-4">Approved (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {claims.map((clm) => (
                  <tr key={clm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {clm.claim_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {clm.patient_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {clm.provider_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Policy: {clm.policy_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      ₹{Number(clm.claimed_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-emerald-600">
                      ₹{Number(clm.approved_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          clm.status === 'Approved' || clm.status === 'Settled'
                            ? 'emerald'
                            : clm.status === 'Pre-Auth Approved'
                            ? 'teal'
                            : 'amber'
                        }
                      >
                        {clm.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 italic max-w-xs truncate">
                      {clm.remarks || 'Standard claim process'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Claim Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Initiate TPA Cashless Pre-Auth Claim"
        subtitle="Submit pre-authorization documentation for inpatient hospitalization"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={claimForm.patient}
              onChange={(e) => setClaimForm({ ...claimForm, patient: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Claim Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={claimForm.claimed_amount}
                onChange={(e) => setClaimForm({ ...claimForm, claimed_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                TPA Reference No.
              </label>
              <input
                type="text"
                value={claimForm.tpa_reference_no}
                onChange={(e) => setClaimForm({ ...claimForm, tpa_reference_no: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Indication & Notes
            </label>
            <textarea
              rows={2}
              value={claimForm.remarks}
              onChange={(e) => setClaimForm({ ...claimForm, remarks: e.target.value })}
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
              Submit Pre-Auth
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
