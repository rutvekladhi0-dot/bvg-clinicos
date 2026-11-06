import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Doctor, Appointment, QueueToken } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import {
  Stethoscope, Activity, Plus, Trash2, Heart, Save,
  FileCheck, ShieldAlert, Pill, Calendar, Clock,
  Volume2, AlertTriangle, ArrowRight, UserCheck, Flame,
  Users, CheckCircle2, ChevronRight, Siren
} from 'lucide-react';

export const OPDConsultationPage: React.FC = () => {
  const { branchId, t, showToast, user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [waitingTokens, setWaitingTokens] = useState<QueueToken[]>([]);
  const [nowServingToken, setNowServingToken] = useState<QueueToken | null>(null);
  const [emergencyCases, setEmergencyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCallingNext, setIsCallingNext] = useState(false);

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
      const [pats, docs, apts, consults, tokens, emerg] = await Promise.all([
        api.getPatients(`branch=${branchId}`).catch(() => []),
        api.getDoctors(`branch=${branchId}`).catch(() => []),
        api.getAppointments(`branch=${branchId}&status=Checked-in`).catch(() => []),
        api.getConsultations(`branch=${branchId}`).catch(() => []),
        api.getQueueTokens(`branch=${branchId}`).catch(() => []),
        api.getEmergencyCases(`branch=${branchId}`).catch(() => []),
      ]);

      setPatients(pats);
      setDoctors(docs);
      setAppointments(apts);
      setConsultations(consults);

      // Filter tokens
      const waiting = (tokens || []).filter((tk: any) => tk.status === 'Waiting');
      const serving = (tokens || []).find((tk: any) => tk.status === 'Serving');
      setWaitingTokens(waiting);
      setNowServingToken(serving || null);

      // Active emergency cases (Triage or Under Treatment)
      const activeEmerg = (emerg || []).filter((ec: any) => ec.status === 'Triage' || ec.status === 'Under Treatment');
      setEmergencyCases(activeEmerg);

      if (docs.length > 0 && !selectedDoctorId) {
        // Try finding doctor matching current user
        const matched = docs.find((d: any) => d.user === user?.id || d.full_name?.toLowerCase().includes(user?.username?.toLowerCase() || ''));
        setSelectedDoctorId(String(matched ? matched.id : docs[0].id));
      }
      if (pats.length > 0 && !selectedPatientId) {
        setSelectedPatientId(String(pats[0].id));
      }
    } catch (err) {
      console.error('Error loading OPD data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll queue status periodically
    const timer = setInterval(() => {
      api.getQueueTokens(`branch=${branchId}`).then((tokens) => {
        if (tokens) {
          setWaitingTokens(tokens.filter((tk: any) => tk.status === 'Waiting'));
          setNowServingToken(tokens.find((tk: any) => tk.status === 'Serving') || null);
        }
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [branchId]);

  const selectedDoctor = doctors.find((d) => d.id === Number(selectedDoctorId));
  const selectedPatient = patients.find((p) => p.id === Number(selectedPatientId));

  // Trigger Reception Buzzer
  const broadcastBuzzer = (tokenNumber: string, patientName: string, docName: string, room: string) => {
    const payload = {
      id: Date.now(),
      tokenNumber,
      patientName,
      doctorName: docName,
      roomNumber: room,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. BroadcastChannel
    try {
      const bc = new BroadcastChannel('bvg_buzzer_channel');
      bc.postMessage(payload);
      bc.close();
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    // 2. Storage event
    localStorage.setItem('bvg_buzzer_event', JSON.stringify(payload));
  };

  // Next Patient Workflow
  const handleCallNextPatient = async () => {
    setIsCallingNext(true);
    try {
      // Find next token for this doctor or general waiting queue
      const docWaiting = waitingTokens.filter(t => !selectedDoctorId || Number(t.doctor) === Number(selectedDoctorId));
      const nextToken = docWaiting.length > 0 ? docWaiting[0] : waitingTokens[0];

      if (!nextToken) {
        showToast('No more patients waiting in the consultation queue!', 'info');
        setIsCallingNext(false);
        return;
      }

      // Call API to mark serving
      const called = await api.callQueueToken(nextToken.id);

      // Select patient in OPD form
      setSelectedPatientId(String(called.patient));
      if (called.appointment) {
        setSelectedAppointmentId(String(called.appointment));
      }

      // Pre-populate patient complaints / vitals from timeline or patient info
      const pat = patients.find(p => p.id === Number(called.patient));
      if (pat) {
        setChiefComplaint(`OPD Consultation for Token ${called.token_number} - Priority: ${called.priority || 'Normal'}`);
      }

      const docName = selectedDoctor?.full_name || called.doctor_name || 'Consultant Doctor';
      const roomNum = selectedDoctor?.room_number || called.room_number || 'OPD-101';
      const patName = pat?.full_name || called.patient_name || 'Patient';

      // Buzzer notification to Reception
      broadcastBuzzer(called.token_number, patName, docName, roomNum);

      showToast(`🔔 Token ${called.token_number} (${patName}) called! Receptionist buzzer alert triggered.`, 'success');

      // Refresh queues
      const refreshedTokens = await api.getQueueTokens(`branch=${branchId}`);
      setWaitingTokens(refreshedTokens.filter((tk: any) => tk.status === 'Waiting'));
      setNowServingToken(refreshedTokens.find((tk: any) => tk.status === 'Serving') || null);
    } catch (err: any) {
      showToast(err.message || 'Failed to call next patient', 'error');
    } finally {
      setIsCallingNext(false);
    }
  };

  // Call Specific Token from waiting list
  const handleCallSpecificToken = async (token: QueueToken) => {
    try {
      const called = await api.callQueueToken(token.id);
      setSelectedPatientId(String(called.patient));
      if (called.appointment) setSelectedAppointmentId(String(called.appointment));

      const pat = patients.find(p => p.id === Number(called.patient));
      const docName = selectedDoctor?.full_name || called.doctor_name || 'Consultant Doctor';
      const roomNum = selectedDoctor?.room_number || called.room_number || 'OPD-101';
      const patName = pat?.full_name || called.patient_name || 'Patient';

      broadcastBuzzer(called.token_number, patName, docName, roomNum);
      showToast(`🔔 Token ${called.token_number} called to ${roomNum}!`, 'success');

      const refreshedTokens = await api.getQueueTokens(`branch=${branchId}`);
      setWaitingTokens(refreshedTokens.filter((tk: any) => tk.status === 'Waiting'));
      setNowServingToken(refreshedTokens.find((tk: any) => tk.status === 'Serving') || null);
    } catch (err: any) {
      showToast(err.message || 'Call failed', 'error');
    }
  };

  // Start Emergency Treatment
  const handleStartEmergencyTreatment = async (ec: any) => {
    try {
      // 1. Preload patient
      setSelectedPatientId(String(ec.patient));

      // 2. Preload emergency vitals & biometrics
      setVitals({
        systolic_bp: ec.systolic_bp || 120,
        diastolic_bp: ec.diastolic_bp || 80,
        heart_rate: ec.pulse || 90,
        temperature_f: Number(ec.temp_f || 98.6),
        spo2: ec.spo2 || 95,
        respiratory_rate: 20,
        weight_kg: 70.0,
        height_cm: 170.0,
      });

      // 3. Preload Chief Complaint & Treatment Plan
      setChiefComplaint(`[CRITICAL EMERGENCY - ${ec.triage_level?.toUpperCase()}] ${ec.chief_complaint} (Mode: ${ec.arrival_mode || 'Ambulance'})`);
      setDiagnosis(`Emergency Case ${ec.case_number}: Acute Medical Resuscitation`);
      setTreatmentPlan(ec.initial_management || 'Immediate emergency resuscitation, supplemental oxygen and continuous cardiac monitoring initiated.');

      // 4. Update status on backend
      await api.request(`/emergency-cases/${ec.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Under Treatment' }),
      });

      showToast(`🚨 Emergency case ${ec.case_number} loaded into clinical consultation! Status set to Under Treatment.`, 'success');

      // Refresh emergency list
      const updatedEmerg = await api.getEmergencyCases(`branch=${branchId}`);
      setEmergencyCases(updatedEmerg.filter((e: any) => e.status === 'Triage' || e.status === 'Under Treatment'));
    } catch (err: any) {
      showToast(err.message || 'Failed to start emergency treatment', 'error');
    }
  };

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

      // 3. Mark current serving token as completed
      if (nowServingToken && Number(nowServingToken.patient) === Number(selectedPatientId)) {
        await api.completeQueueToken(nowServingToken.id).catch(() => {});
      }

      showToast('OPD Consultation completed! Electronic Prescription & Invoice generated.', 'success');
      setDiagnosis('');
      setChiefComplaint('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Consultation saving failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Next Patient Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('opd')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Clinical examination, vital parameters, ICD-10 diagnosis & digital prescription generator
          </p>
        </div>

        {/* Doctor Next Patient Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCallNextPatient}
            disabled={isCallingNext || waitingTokens.length === 0}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <Volume2 className="w-4 h-4 mr-2 animate-pulse group-hover:scale-110 transition-transform" />
            <span>Next Patient</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
              {waitingTokens.length} waiting
            </span>
          </button>
        </div>
      </div>

      {/* Emergency Priority Alert Banner (Req 7) */}
      {emergencyCases.length > 0 && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-rose-300 animate-in fade-in duration-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-white/20 rounded-xl animate-pulse">
                <Siren className="w-5 h-5 text-white" />
              </span>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase bg-white text-rose-800 px-2 py-0.5 rounded-md">
                  Emergency Priority Alert
                </span>
                <h3 className="text-sm font-black text-white mt-1">
                  {emergencyCases.length} Critical Emergency {emergencyCases.length === 1 ? 'Patient' : 'Patients'} Awaiting Immediate Medical Attention!
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {emergencyCases.map((ec: any) => (
              <div
                key={ec.id}
                className="bg-black/25 backdrop-blur-xs p-3.5 rounded-xl border border-white/20 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-rose-200">{ec.case_number}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white uppercase">
                      Triage: {ec.triage_level}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white mt-1">{ec.patient_name || 'Emergency Patient'}</h4>
                  <p className="text-xs text-rose-100 line-clamp-1 mt-0.5">
                    <strong>Complaint:</strong> {ec.chief_complaint}
                  </p>
                  <p className="text-[11px] text-rose-200 font-mono mt-0.5">
                    BP: {ec.systolic_bp}/{ec.diastolic_bp} • Pulse: {ec.pulse} bpm • SpO2: {ec.spo2}% • Mode: {ec.arrival_mode}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleStartEmergencyTreatment(ec)}
                    className="flex items-center px-3.5 py-1.5 bg-white text-rose-800 hover:bg-rose-50 font-black text-xs rounded-lg shadow-sm transition-transform active:scale-95"
                  >
                    <Flame className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    Start Emergency Treatment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Consultation Queue Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Consulting: {selectedDoctor?.full_name || 'Assigned Consultant'} ({selectedDoctor?.room_number || 'Room 101'})
            </div>
            <div className="text-[11px] text-slate-400">
              Now Serving: <strong className="font-mono text-teal-600 dark:text-teal-400">{nowServingToken ? `${nowServingToken.token_number} (${nowServingToken.patient_name})` : 'None'}</strong>
            </div>
          </div>
        </div>

        {/* Live waiting queue tokens chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {waitingTokens.length === 0 ? (
            <span className="text-xs text-slate-400 font-medium">No patients currently in waiting queue</span>
          ) : (
            waitingTokens.slice(0, 5).map((tk: any) => (
              <button
                key={tk.id}
                type="button"
                onClick={() => handleCallSpecificToken(tk)}
                className="flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 border border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-xl text-xs transition-colors shrink-0 font-medium"
              >
                <span className="font-mono font-bold text-teal-700 dark:text-teal-300 mr-1.5">{tk.token_number}</span>
                <span className="text-slate-700 dark:text-slate-200 max-w-[90px] truncate">{tk.patient_name}</span>
                <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md ${tk.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                  {tk.priority}
                </span>
              </button>
            ))
          )}
        </div>
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
                        {d.full_name} ({d.specialization}) - {d.room_number || 'OPD'}
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
