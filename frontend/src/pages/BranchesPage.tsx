import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Branch, Hospital } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  GitBranch, Building2, MapPin, Phone, Mail, Users,
  CheckCircle2, Plus, ArrowRightLeft, DollarSign
} from 'lucide-react';

export const BranchesPage: React.FC = () => {
  const { branchId, setBranchId, t, showToast } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // Inter-branch Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromBranch: '1',
    toBranch: '2',
    item_type: 'Medicine Stock',
    item_name: 'Augmentin 625 Duo (Batch BAT-AUG-921)',
    quantity: 50,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bList, hList] = await Promise.all([
        api.getBranches(),
        api.getHospitals(),
      ]);
      setBranches(bList);
      setHospitals(hList);
    } catch (err) {
      console.error('Error fetching branch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Inventory transfer of ${transferForm.quantity} units dispatched between branches!`, 'success');
    setShowTransferModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('multiBranch')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise multi-hospital hierarchy, branch-wise data isolation & inter-branch resource transfers
          </p>
        </div>
        <button
          onClick={() => setShowTransferModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Inter-Branch Stock Transfer
        </button>
      </div>

      {/* Hospital Entities Header */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Hospital Parent Entities ({hospitals.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200 dark:border-teal-800">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{hosp.name}</h3>
                  <p className="text-xs text-slate-500">{hosp.tagline}</p>
                  <span className="text-[10px] text-teal-600 font-mono mt-0.5 block">Reg: {hosp.registration_number}</span>
                </div>
              </div>
              <Badge variant="emerald">Active</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Branches List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Operational Facility Branches ({branches.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b) => {
            const isActive = branchId === b.id;
            return (
              <div
                key={b.id}
                className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border transition-all ${
                  isActive
                    ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {b.name}
                      </span>
                      {b.is_main_branch && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          Headquarters
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {b.city} • {b.address}
                    </p>
                  </div>
                  {isActive ? (
                    <Badge variant="emerald">Active Session</Badge>
                  ) : (
                    <button
                      onClick={() => {
                        setBranchId(b.id);
                        showToast(`Active facility switched to ${b.name}`, 'info');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/60 rounded-xl hover:bg-teal-100"
                    >
                      Switch to Branch
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact Phone</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{b.phone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Hospital Network</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{b.hospital_name || 'BVG Memorial'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Inter-Branch Inventory Transfer"
        subtitle="Transfer pharmaceuticals or clinical stock between clinic locations"
        maxWidth="lg"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Source Facility (From)
              </label>
              <select
                value={transferForm.fromBranch}
                onChange={(e) => setTransferForm({ ...transferForm, fromBranch: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Facility (To)
              </label>
              <select
                value={transferForm.toBranch}
                onChange={(e) => setTransferForm({ ...transferForm, toBranch: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Item / Medicine Batch to Transfer
            </label>
            <input
              type="text"
              required
              value={transferForm.item_name}
              onChange={(e) => setTransferForm({ ...transferForm, item_name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              required
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Dispatch Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
