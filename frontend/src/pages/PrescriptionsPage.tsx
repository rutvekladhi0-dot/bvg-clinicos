import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  FileText, Pill, Plus, Printer, Search, User,
  Stethoscope, Calendar, Clock
} from 'lucide-react';

export const PrescriptionsPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      console.error('Error fetching prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('prescriptions')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Digital Rx repository, dosage schedules, patient dietary advice & printable PDF copies
          </p>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Digital Prescriptions Master ({prescriptions.length})
          </h2>
        </div>

        {prescriptions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Prescriptions Issued"
            description="Prescriptions issued by OPD doctors will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Rx Number</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Prescribing Doctor</th>
                  <th className="py-3 px-4">Medicines Prescribed</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {rx.prescription_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {rx.patient_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      Dr. {rx.doctor_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {rx.items?.map((it: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                            {it.medicine_name} ({it.frequency})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {rx.created_at?.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedRx(rx)}
                        className="px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 rounded-lg hover:bg-teal-100"
                      >
                        View & Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Prescription Modal */}
      {selectedRx && (
        <Modal
          isOpen={!!selectedRx}
          onClose={() => setSelectedRx(null)}
          title={`Prescription - ${selectedRx.prescription_number}`}
          subtitle={`Patient: ${selectedRx.patient_name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Clinic Letterhead */}
            <div className="p-4 bg-teal-50 dark:bg-slate-800 rounded-2xl border flex justify-between items-start">
              <div>
                <p className="font-black text-sm text-teal-900 dark:text-teal-200">BVG Memorial Super Speciality Hospital</p>
                <p className="text-[11px] text-slate-500">Senapati Bapat Road, Pune | Emergency: +91 20 6712 9000</p>
                <div className="mt-2 text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Consultant:</span> Dr. {selectedRx.doctor_name}
                  <span className="block text-[11px] text-slate-500">{selectedRx.doctor_qualification}</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-teal-600 block">{selectedRx.prescription_number}</span>
                <span className="text-[10px] text-slate-400">{selectedRx.created_at?.split('T')[0]}</span>
              </div>
            </div>

            {/* Patient Header */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between font-medium">
              <span>Patient: <strong className="text-slate-900 dark:text-white">{selectedRx.patient_name}</strong></span>
              <span>Branch: <strong>{selectedRx.branch_name || 'Main Campus'}</strong></span>
            </div>

            {/* Medicines List */}
            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Rx Medications:</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                {selectedRx.items?.map((it: any, idx: number) => (
                  <div key={idx} className="p-3 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{it.medicine_name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({it.dosage})</span>
                      <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">{it.instructions}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{it.frequency}</span>
                      <span className="block text-[10px] text-slate-400">{it.duration_days} Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice */}
            {selectedRx.diet_instructions && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                <strong className="block text-slate-800 dark:text-slate-200 mb-0.5">Dietary & Lifestyle Advice:</strong>
                {selectedRx.diet_instructions}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-[#0F766E] text-white font-bold rounded-xl shadow-sm text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Official Prescription
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
