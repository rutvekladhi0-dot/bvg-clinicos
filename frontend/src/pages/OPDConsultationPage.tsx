import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Doctor, Appointment } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  Stethoscope, Activity, Plus, Trash2, Heart, Save,
  FileCheck, ShieldAlert, Pill, Calendar, Clock
} from 'lucide-react';

export const OPDConsultationPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  
  // Vitals
  const [vitals, setVitals] = useState({
    systolic_bp: 120,
    diastolic_bp: 80,
    heart_rate: 72,
    temperature_f: 98.6,
    spo2: 98,
    respiratory_rate: 16,
    weight_kg: 68.0,
    height_cm: 170.0,
  });

  // Clinical
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyIllness, setHistoryIllness] = useState('');
  const [examFindings, setExamFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icd10, setIcd10] = useState('R50.9');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescription Items
  const [medicines, setMedicines] = useState([
    { medicine_name: 'Tab. Augmentin 625 Duo', dosage: '625mg', frequency: '1-0-1 (After Food)', duration_days: 5, instructions: 'Take with warm water' },
    { medicine_name: 'Tab. Dolo 650', dosage: '650mg', frequency: '1-0-1 (SOS Fever)', duration_days: 3, instructions: 'If fever > 99.5F' },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pats, docs, apts, consults] = await Promise.all([
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
        api.getAppointments(`branch=${branchId}&status=Checked-in`),
        api.getConsultations(`branch=${branchId}`)
      ]);
      setPatients(pats);
      setDoctors(docs);
      setAppointments(apts);
      setConsultations(consults);
      if (docs.length > 0) setSelectedDoctorId(String(docs[0].id));
      if (pats.length > 0) setSelectedPatientId(String(pats[0].id));
    } catch (err) {
      console.error('Error loading OPD data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      { medicine_name: '', dosage: '500mg', frequency: '1-0-1', duration_days: 5, instructions: 'After meals' },
    ]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: string, val: any) => {
    const updated = [...medicines];
    (updated[index] as any)[field] = val;
    setMedicines(updated);
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !diagnosis) {
      showToast('Please specify patient, doctor and provisional diagnosis', 'warning');
      return;
    }

    try {
      // 1. Create Consultation
      const consultPayload = {
        patient: Number(selectedPatientId),
        doctor: Number(selectedDoctorId),
        branch: branchId,
        appointment: selectedAppointmentId ? Number(selectedAppointmentId) : null,
        ...vitals,
        chief_complaint: chiefComplaint || 'Routine medical evaluation',
        history_of_present_illness: historyIllness,
        examination_findings: examFindings,
        diagnosis,
        icd10_code: icd10,
        treatment_plan: treatmentPlan,
        follow_up_date: followUpDate || null,
      };

      const newConsult = await api.createConsultation(consultPayload);

      // 2. Create Prescription if medicines added
      if (medicines.some((m) => m.medicine_name)) {
        await api.createPrescription({
          consultation: newConsult.id,
          patient: Number(selectedPatientId),
          doctor: Number(selectedDoctorId),
          branch: branchId,
          items: medicines.filter((m) => m.medicine_name),
        });
      }

      showToast('OPD Consultation completed! Invoice generated automatically.', 'success');
      setDiagnosis('');
      setChiefComplaint('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Consultation saving failed', 'error');
    }
  };

  const selectedPatient = patients.find((p) => p.id === Number(selectedPatientId));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('opd')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Clinical examination, vital parameters, ICD-10 diagnosis & digital prescription generator
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Consultation Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitConsultation} className="space-y-6">
            {/* Patient & Doctor Selection Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                1. Patient & Consultant Selection
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Patient *
                  </label>
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.uhid}) - {p.gender}, {p.blood_group}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Consulting Doctor *
                  </label>
                  <select
                    required
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {appointments.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Link Checked-in Appointment (Optional)
                  </label>
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="">-- Standalone Walk-in Consultation --</option>
                    {appointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.appointment_number} - {a.patient_name} with {a.doctor_name} ({a.time_slot})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Vitals Recording Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center">
                <Activity className="w-4 h-4 mr-1.5" />
                2. Vitals & Biometrics Recording
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitals.systolic_bp}
                    onChange={(e) => setVitals({ ...vitals, systolic_bp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitals.diastolic_bp}
                    onChange={(e) => setVitals({ ...vitals, diastolic_bp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitals.heart_rate}
                    onChange={(e) => setVitals({ ...vitals, heart_rate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.temperature_f}
                    onChange={(e) => setVitals({ ...vitals, temperature_f: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={vitals.weight_kg}
                    onChange={(e) => setVitals({ ...vitals, weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={vitals.height_cm}
                    onChange={(e) => setVitals({ ...vitals, height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Calculated BMI</label>
                  <div className="px-3 py-2 text-xs font-mono font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 rounded-xl">
                    {(vitals.weight_kg / Math.pow(vitals.height_cm / 100, 2)).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Notes & Diagnosis Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                3. Clinical Diagnosis & Examination
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chief Complaints *
                </label>
                <textarea
                  rows={2}
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Low grade fever and dry cough for 3 days, body aches, sore throat"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Provisional Diagnosis *
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Upper Respiratory Infection"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ICD-10 Code
                  </label>
                  <select
                    value={icd10}
                    onChange={(e) => setIcd10(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="J06.9">J06.9 - Acute upper respiratory infection</option>
                    <option value="I25.10">I25.10 - Atherosclerotic heart disease</option>
                    <option value="I10">I10 - Essential (primary) hypertension</option>
                    <option value="E11.9">E11.9 - Type 2 diabetes mellitus</option>
                    <option value="M17.9">M17.9 - Osteoarthritis of knee, unspecified</option>
                    <option value="R50.9">R50.9 - Fever, unspecified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Findings & Advice
                </label>
                <textarea
                  rows={2}
                  value={examFindings}
                  onChange={(e) => setExamFindings(e.target.value)}
                  placeholder="e.g. Pharynx congested, chest clear, no cervical lymphadenopathy"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Integrated Prescription Writer */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center">
                  <Pill className="w-4 h-4 mr-1.5" />
                  4. Digital Prescription Writer
                </h3>
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/60 rounded-lg hover:bg-teal-100"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={med.medicine_name}
                        onChange={(e) => updateMedicine(idx, 'medicine_name', e.target.value)}
                        placeholder="Medicine name (e.g. Tab. Augmentin 625 Duo)"
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                      />
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                        placeholder="Dosage"
                        className="w-24 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={med.frequency}
                        onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="1-0-1 (After Food)">1-0-1 (Morning & Night)</option>
                        <option value="1-0-0 (Morning)">1-0-0 (Morning only)</option>
                        <option value="0-0-1 (Night)">0-0-1 (Night only)</option>
                        <option value="1-1-1 (TID)">1-1-1 (Three times daily)</option>
                        <option value="1-0-1 (SOS)">SOS (When required)</option>
                      </select>

                      <input
                        type="number"
                        value={med.duration_days}
                        onChange={(e) => updateMedicine(idx, 'duration_days', Number(e.target.value))}
                        placeholder="Days (e.g. 5)"
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />

                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                        placeholder="Instructions (e.g. with warm water)"
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Review / Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                className="flex items-center px-6 py-3 bg-[#0F766E] hover:bg-[#0D6861] text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Finalize Consultation & Generate Rx & Bill
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Patient Snapshot & Recent Consultations */}
        <div className="space-y-6">
          {selectedPatient && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Active Patient Record
                </span>
                <span className="font-mono text-xs font-bold text-teal-600">{selectedPatient.uhid}</span>
              </div>
              <div>
                <p className="text-base font-black text-slate-900 dark:text-white">{selectedPatient.full_name}</p>
                <p className="text-xs text-slate-400">{selectedPatient.gender} • Blood Group: <strong className="text-rose-600">{selectedPatient.blood_group}</strong></p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedPatient.phone}</p>
              </div>

              {selectedPatient.allergies && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900">
                  <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-400 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Allergy Alert!</span>
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">{selectedPatient.allergies}</p>
                </div>
              )}

              {selectedPatient.chronic_conditions && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">Chronic Background:</span>
                  {selectedPatient.chronic_conditions}
                </div>
              )}
            </div>
          )}

          {/* Past Consultations */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Consultations
            </h3>
            <div className="space-y-2.5">
              {consultations.slice(0, 4).map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-900 dark:text-white truncate">{c.patient_name}</span>
                    <span className="text-[10px] text-teal-600">{c.consultation_date?.split('T')[0]}</span>
                  </div>
                  <p className="text-slate-500 truncate">{c.diagnosis}</p>
                  <p className="text-[11px] text-slate-400">Dr. {c.doctor_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
