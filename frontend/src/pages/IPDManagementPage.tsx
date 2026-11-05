import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Ward, Bed, Admission, Patient, Doctor } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Bed as BedIcon, UserPlus, LogOut, Activity, FileText,
  Calendar, CheckCircle2, AlertCircle, Building2, ShieldCheck
} from 'lucide-react';

export const IPDManagementPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState<string>('All');

  // Admit Modal
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    patient: '',
    primary_doctor: '',
    ward: '',
    bed: '',
    admission_date: new Date().toISOString(),
    admission_reason: '',
    diagnosis: '',
  });

  // Discharge Modal
  const [dischargeTarget, setDischargeTarget] = useState<Admission | null>(null);
  const [dischargeForm, setDischargeForm] = useState({
    discharge_summary: 'Patient treated successfully and discharged in stable hemodynamic condition.',
    discharge_condition: 'Stable',
    follow_up_advice: 'Review in OPD after 7 days with fresh blood investigations.',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wList, bList, aList, pList, dList] = await Promise.all([
        api.getWards(),
        api.getBeds(`branch=${branchId}`),
        api.getAdmissions(`branch=${branchId}&status=Admitted`),
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
      ]);
      setWards(wList);
      setBeds(bList);
      setAdmissions(aList);
      setPatients(pList);
      setDoctors(dList);
    } catch (err) {
      console.error('Error fetching IPD data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patient || !admitForm.bed || !admitForm.primary_doctor) {
      showToast('Please select patient, doctor, ward and bed', 'warning');
      return;
    }
    try {
      await api.createAdmission(admitForm);
      showToast('Patient admitted successfully! Bed marked occupied.', 'success');
      setShowAdmitModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Admission failed', 'error');
    }
  };

  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeTarget) return;
    try {
      const res = await api.dischargePatient(dischargeTarget.id, dischargeForm);
      showToast(`Discharge complete! Final bill generated: ${res.invoice_number} (₹${res.total_amount})`, 'success');
      setDischargeTarget(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Discharge failed', 'error');
    }
  };

  const availableBedsForWard = beds.filter(
    (b) => b.status === 'Available' && (!admitForm.ward || b.ward === Number(admitForm.ward))
  );

  const filteredBeds = selectedWardId === 'All' ? beds : beds.filter((b) => b.ward === Number(selectedWardId));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('ipd')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ward management, real-time bed allocation matrix, nursing rounds & discharge billing
          </p>
        </div>
        <button
          onClick={() => setShowAdmitModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t('admitPatient')}
        </button>
      </div>

      {/* Ward Filter & Status Legend */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Ward Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedWardId('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              selectedWardId === 'All'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Wards ({beds.length} Beds)
          </button>
          {wards.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWardId(String(w.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedWardId === String(w.id)
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className="flex items-center text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
            Available
          </span>
          <span className="flex items-center text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
            Occupied
          </span>
          <span className="flex items-center text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
            Maintenance
          </span>
        </div>
      </div>

      {/* Interactive Bed Allocation Matrix */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Ward Bed Matrix Grid
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredBeds.map((bed) => {
            const isOccupied = bed.status === 'Occupied';
            return (
              <div
                key={bed.id}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isOccupied
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 hover:scale-105'
                }`}
              >
                <BedIcon className="w-6 h-6 mx-auto mb-1 stroke-[1.8]" />
                <p className="font-mono font-bold text-xs">{bed.bed_number}</p>
                <p className="text-[10px] font-semibold opacity-75">{bed.status}</p>
                <p className="text-[10px] text-slate-500 mt-1">₹{bed.daily_charge}/d</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Admissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Active Inpatient Admissions ({admissions.length})
            </h2>
            <p className="text-xs text-slate-400">Current hospitalized patients under primary consultants</p>
          </div>
        </div>

        {admissions.length === 0 ? (
          <EmptyState
            icon={BedIcon}
            title="No Inpatients Admitted"
            description="All beds in this facility are currently free."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Admission ID</th>
                  <th className="py-3 px-4">Patient Name (UHID)</th>
                  <th className="py-3 px-4">Ward & Bed</th>
                  <th className="py-3 px-4">Consultant Doctor</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Diagnosis</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {adm.admission_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {adm.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {adm.patient_uhid}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {adm.ward_name}
                      </div>
                      <div className="text-[11px] text-teal-600 font-mono font-bold">
                        Bed: {adm.bed_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Dr. {adm.doctor_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {adm.admission_date?.split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                      {adm.diagnosis}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDischargeTarget(adm)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 rounded-xl hover:bg-rose-100 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1.5" />
                        Discharge & Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Admission Modal */}
      <Modal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        title={t('admitPatient')}
        subtitle="Allocate inpatient ward, bed and primary doctor"
        maxWidth="lg"
      >
        <form onSubmit={handleAdmitSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={admitForm.patient}
              onChange={(e) => setAdmitForm({ ...admitForm, patient: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid}) - Status: {p.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Attending Consultant *
            </label>
            <select
              required
              value={admitForm.primary_doctor}
              onChange={(e) => setAdmitForm({ ...admitForm, primary_doctor: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ward Selection *
              </label>
              <select
                required
                value={admitForm.ward}
                onChange={(e) => setAdmitForm({ ...admitForm, ward: e.target.value, bed: '' })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Select Ward --</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.available_beds} free)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Available Bed *
              </label>
              <select
                required
                value={admitForm.bed}
                onChange={(e) => setAdmitForm({ ...admitForm, bed: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Select Available Bed --</option>
                {availableBedsForWard.map((b) => (
                  <option key={b.id} value={b.id}>
                    Bed {b.bed_number} (₹{b.daily_charge}/day)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Provisional Diagnosis *
            </label>
            <input
              type="text"
              required
              value={admitForm.diagnosis}
              onChange={(e) => setAdmitForm({ ...admitForm, diagnosis: e.target.value })}
              placeholder="e.g. Acute Appendicitis / Post-op Knee Arthroplasty"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Admission
            </label>
            <textarea
              rows={2}
              value={admitForm.admission_reason}
              onChange={(e) => setAdmitForm({ ...admitForm, admission_reason: e.target.value })}
              placeholder="e.g. Scheduled for elective surgery under general anesthesia"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdmitModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Confirm Admission
            </button>
          </div>
        </form>
      </Modal>

      {/* Discharge & Billing Modal */}
      {dischargeTarget && (
        <Modal
          isOpen={!!dischargeTarget}
          onClose={() => setDischargeTarget(null)}
          title={`Discharge Patient - ${dischargeTarget.patient_name}`}
          subtitle={`Admission ID: ${dischargeTarget.admission_number} | Bed: ${dischargeTarget.bed_number}`}
          maxWidth="lg"
        >
          <form onSubmit={handleDischargeSubmit} className="space-y-4">
            <div className="p-3 bg-teal-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
              <p className="font-bold text-teal-900 dark:text-teal-200">Discharge Billing Automated Calculation</p>
              <p className="text-slate-600 dark:text-slate-300">
                Discharging this inpatient will automatically:
              </p>
              <ul className="list-disc pl-5 text-slate-500 space-y-0.5 mt-1">
                <li>Mark Bed <strong>{dischargeTarget.bed_number}</strong> as Available</li>
                <li>Calculate daily bed charge, nursing supervision and doctor visit fees</li>
                <li>Generate the official final IPD hospital invoice in Billing Module</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Discharge Condition
              </label>
              <select
                value={dischargeForm.discharge_condition}
                onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_condition: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Stable">Stable & Ambulatory</option>
                <option value="Improved">Clinically Improved</option>
                <option value="Transferred to Higher Center">Transferred to Higher Center</option>
                <option value="LAMA / DAMA">Discharged Against Medical Advice (DAMA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Discharge Summary & Clinical Course
              </label>
              <textarea
                rows={3}
                value={dischargeForm.discharge_summary}
                onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_summary: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up & Home Medication Advice
              </label>
              <textarea
                rows={2}
                value={dischargeForm.follow_up_advice}
                onChange={(e) => setDischargeForm({ ...dischargeForm, follow_up_advice: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDischargeTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Finalize Discharge & Generate Bill
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
