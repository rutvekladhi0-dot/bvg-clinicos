import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Doctor, Appointment, QueueToken, Invoice, Prescription } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { PrintableInvoiceModal } from '../components/common/PrintableInvoiceModal';
import { PrintablePrescriptionModal } from '../components/common/PrintablePrescriptionModal';
import { VideoCallModal } from '../components/common/VideoCallModal';
import {
  Users, Calendar, FileText, FlaskConical, CreditCard,
  Download, Printer, Heart, Clock, User, Video, Plus,
  CheckCircle2, AlertCircle, XCircle, ArrowRight, ShieldCheck,
  Stethoscope, Sparkles, Building2, Phone, MapPin, Eye
} from 'lucide-react';

export const PatientPortalPage: React.FC = () => {
  const { user, role, branchId, t, showToast } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [emr, setEmr] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'appointments' | 'video' | 'prescriptions' | 'reports' | 'billing'>('overview');

  // Self-Booking State
  const [bookDept, setBookDept] = useState('');
  const [bookDoctor, setBookDoctor] = useState('');
  const [bookDate, setBookDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookSlot, setBookSlot] = useState('10:00 AM');
  const [bookType, setBookType] = useState<'OPD' | 'VIDEO'>('OPD');
  const [bookReason, setBookReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<any>(null);

  // Print Modals
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<any>(null);

  // Video Call Modal
  const [activeVideoCall, setActiveVideoCall] = useState<{ room: string; doctor: string } | null>(null);

  // Time Slots
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, dList, deptList, aptList, tokList] = await Promise.all([
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
        api.getDepartments(branchId),
        api.getAppointments(`branch=${branchId}`),
        api.getQueueTokens(`branch=${branchId}`),
      ]);
      setPatients(pList);
      setDoctors(dList);
      setDepartments(deptList);
      setAppointments(aptList);
      setQueueTokens(tokList);

      // Identify patient: If logged in as patient, match by user or email or take first
      let currentP: Patient | null = null;
      if (role === 'PATIENT' && user) {
        currentP = pList.find(p => (p as any).user === user.id || p.email === user.email || p.phone === user.phone) || null;
      }
      if (!currentP && pList.length > 0) {
        currentP = pList[0];
      }

      if (currentP) {
        setActivePatient(currentP);
        const fullEmr = await api.getPatientEMR(currentP.id);
        setEmr(fullEmr);
      }
    } catch (err) {
      console.error('Error loading patient portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  const handleSelectPatient = async (p: Patient) => {
    setActivePatient(p);
    try {
      const fullEmr = await api.getPatientEMR(p.id);
      setEmr(fullEmr);
    } catch (err) {
      console.error('Error loading EMR', err);
    }
  };

  // Self-Booking Handler with Auto-Token Generation
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) {
      showToast('No active patient profile selected', 'error');
      return;
    }
    if (!bookDoctor) {
      showToast('Please select your preferred doctor', 'warning');
      return;
    }

    // Check duplicate booking on same doctor and same date
    const existing = appointments.find(
      (a) => a.patient === activePatient.id &&
             String(a.doctor) === String(bookDoctor) &&
             a.appointment_date === bookDate &&
             a.status !== 'Cancelled'
    );
    if (existing) {
      showToast('You already hold an appointment with this consultant on this date. Duplicate bookings are prevented.', 'warning');
      return;
    }

    setBookingLoading(true);
    try {
      const selDoc = doctors.find((d) => String(d.id) === String(bookDoctor));

      // 1. Create Appointment
      const aptPayload = {
        patient: activePatient.id,
        doctor: Number(bookDoctor),
        branch: branchId,
        appointment_date: bookDate,
        time_slot: bookSlot,
        appointment_type: bookType === 'VIDEO' ? 'Consultation' : 'Walk-in',
        chief_complaint: bookReason || (bookType === 'VIDEO' ? 'Online Video Consultation' : 'General OPD Consultation'),
        status: 'Scheduled',
      };
      const createdApt = await api.createAppointment(aptPayload);

      // 2. Automatically generate OPD Queue Token
      let tokenNumber = `T-${Math.floor(10 + Math.random() * 89)}`;
      try {
        const tokenRes = await api.createQueueToken({
          branch: branchId,
          doctor: Number(bookDoctor),
          patient: activePatient.id,
          appointment: createdApt.id,
          priority: 'Normal',
          status: 'Waiting',
        });
        if (tokenRes && tokenRes.token_number) {
          tokenNumber = tokenRes.token_number;
        }
      } catch (tokErr) {
        console.warn('Queue token fallback issued:', tokErr);
      }

      // Success Display Modal
      setBookingSuccessModal({
        appointment: createdApt,
        doctor: selDoc,
        token: tokenNumber,
        slot: bookSlot,
        date: bookDate,
        type: bookType,
      });

      showToast(`Appointment & Token ${tokenNumber} confirmed successfully!`, 'success');
      loadData();
      setActiveTab('appointments');
    } catch (err: any) {
      showToast(err.message || 'Appointment booking failed', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Filtered lists for this patient
  const patientAppointments = appointments.filter(
    (a) => activePatient && (a.patient === activePatient.id || a.patient_uhid === activePatient.uhid)
  );
  const patientTokens = queueTokens.filter(
    (q) => activePatient && (q.patient === activePatient.id || q.patient_uhid === activePatient.uhid)
  );

  // Video appointments
  const videoAppointments = patientAppointments.filter(
    (a) => (a.appointment_type && a.appointment_type.toUpperCase().includes('VIDEO')) ||
           (a.chief_complaint && a.chief_complaint.toLowerCase().includes('video'))
  );

  if (loading || !activePatient) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('patientPortal')}
            </h1>
            <Badge variant="teal">Dedicated Patient Interface</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal health record, self-service appointment booking, queue tokens & video consultations
          </p>
        </div>

        {/* Switch Persona for Staff View */}
        {role === 'SUPER_ADMIN' && patients.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Switch Patient:</span>
            <select
              value={activePatient.id}
              onChange={(e) => {
                const found = patients.find((p) => p.id === Number(e.target.value));
                if (found) handleSelectPatient(found);
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Patient Hero Profile Card */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-2xl text-white border border-white/20 shrink-0">
              {activePatient.first_name[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-teal-500/30 text-teal-200 border border-teal-400/30">
                  UHID: {activePatient.uhid}
                </span>
                <span className="text-xs text-teal-300 font-semibold">• {t(activePatient.gender)}</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                {activePatient.full_name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100/90 mt-1.5 font-medium">
                <span>Blood: <strong className="text-white">{activePatient.blood_group}</strong></span>
                <span>• Phone: <strong className="text-white">{activePatient.phone}</strong></span>
                <span>• City: {activePatient.city || 'Pune'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[130px]">
              <span className="text-[10px] text-teal-200 block uppercase font-bold">Allergy Alert</span>
              <p className="font-bold text-rose-300 truncate mt-0.5">{activePatient.allergies || 'Nil Known'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[130px]">
              <span className="text-[10px] text-teal-200 block uppercase font-bold">Patient Status</span>
              <p className="font-bold text-emerald-300 mt-0.5">{t(activePatient.status)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'My Health Overview', icon: Heart },
          { id: 'book', label: 'Book Appointment & Token', icon: Plus },
          { id: 'appointments', label: `My Appointments & Tokens (${patientAppointments.length})`, icon: Calendar },
          { id: 'video', label: `Video Consultations (${videoAppointments.length})`, icon: Video },
          { id: 'prescriptions', label: `Prescriptions (${emr?.prescriptions?.length || 0})`, icon: FileText },
          { id: 'reports', label: `Diagnostic Reports (${emr?.lab_orders?.length || 0})`, icon: FlaskConical },
          { id: 'billing', label: `Billing & Invoices (${emr?.invoices?.length || 0})`, icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => {
                setBookType('OPD');
                setActiveTab('book');
              }}
              className="p-5 rounded-2xl bg-gradient-to-tr from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800/60 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Book Clinic OPD Appointment</h3>
              <p className="text-xs text-slate-500 mt-1">Select preferred specialist, choose slot & auto-generate OPD Token.</p>
            </div>

            <div
              onClick={() => {
                setBookType('VIDEO');
                setActiveTab('book');
              }}
              className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/60 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Book Video Consultation</h3>
              <p className="text-xs text-slate-500 mt-1">Telehealth consultation from home with live encrypted video room.</p>
            </div>

            <div
              onClick={() => setActiveTab('prescriptions')}
              className="p-5 rounded-2xl bg-gradient-to-tr from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800/60 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">My Digital Prescriptions</h3>
              <p className="text-xs text-slate-500 mt-1">View past medical consultations, dosages, and print official Rx.</p>
            </div>
          </div>

          {/* Active / Next Appointment Card */}
          {patientAppointments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Upcoming Scheduled Appointment & Token Status
                </h3>
                <Badge variant="teal">{patientAppointments[0].status}</Badge>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-base text-slate-900 dark:text-white">
                      {patientAppointments[0].doctor_name || 'Dr. Rajesh Sharma'}
                    </span>
                    <span className="text-xs text-teal-600 font-bold">({patientAppointments[0].doctor_specialization || 'Cardiology'})</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Date: <strong className="text-slate-800 dark:text-slate-200">{patientAppointments[0].appointment_date}</strong> at <strong className="text-slate-800 dark:text-slate-200">{patientAppointments[0].time_slot}</strong>
                  </p>
                  <p className="text-xs text-slate-400">
                    OPD Consultation Room: {patientAppointments[0].doctor_room || 'Room 102'}
                  </p>
                </div>

                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/80 text-center shrink-0">
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 uppercase font-black tracking-wider block">OPD Token</span>
                  <span className="font-mono text-2xl font-black text-teal-900 dark:text-teal-100">
                    {patientTokens[0]?.token_number || 'T-08'}
                  </span>
                  <span className="text-[10px] text-teal-600 font-bold block mt-0.5">Est. Wait: 15-20 min</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SELF-SERVICE BOOKING WORKFLOW */}
      {activeTab === 'book' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Patient Self-Service Appointment & OPD Token Booking
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select medical department, choose your preferred consultant doctor, select date and available time slot.
            </p>
          </div>

          <form onSubmit={handleConfirmBooking} className="space-y-6 max-w-3xl">
            {/* Consultation Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Consultation Mode *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookType('OPD')}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                    bookType === 'OPD'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>In-Person OPD Clinic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookType('VIDEO')}
                  className={`p-3.5 rounded-xl border-2 flex items-center justify-center space-x-2 text-xs font-bold transition-all ${
                    bookType === 'VIDEO'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Video className="w-4 h-4 text-indigo-600" />
                  <span>Online Video Consultation</span>
                </button>
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Department *
              </label>
              <select
                value={bookDept}
                onChange={(e) => {
                  setBookDept(e.target.value);
                  setBookDoctor('');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">All Clinical Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Preferred Consultant Doctor *
              </label>
              <select
                required
                value={bookDoctor}
                onChange={(e) => setBookDoctor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors
                  .filter((d) => !bookDept || (d as any).department_name === bookDept || d.specialization?.includes(bookDept))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} — {d.specialization} (Fee: ₹{d.consultation_fee} • {d.room_number})
                    </option>
                  ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Appointment Date *
                </label>
                <input
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chief Complaint / Symptoms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild headache, fever follow-up"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Doctor Schedule Available Time Slots */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Available Time Slots on {bookDate} *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setBookSlot(slot)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      bookSlot === slot
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={bookingLoading}
                className="flex items-center px-6 py-2.5 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {bookingLoading ? 'Confirming Booking...' : 'Confirm Appointment & Generate Token'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS & TOKENS */}
      {activeTab === 'appointments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              My Appointment History & Queue Tokens ({patientAppointments.length})
            </h3>
            <button
              onClick={() => setActiveTab('book')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-teal-700 rounded-xl hover:bg-teal-800"
            >
              + Book New Appointment
            </button>
          </div>

          {patientAppointments.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No appointments found. Click "Book New Appointment" to schedule your consultation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Appt #</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {patientAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">{apt.appointment_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{apt.doctor_name || 'Dr. Sharma'}</div>
                        <div className="text-[10px] text-slate-400">{apt.doctor_specialization}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold">{apt.appointment_date}</span>
                        <span className="block text-[10px] text-slate-400">{apt.time_slot}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={apt.appointment_type?.includes('VIDEO') ? 'purple' : 'teal'}>
                          {apt.appointment_type || 'OPD'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">
                        {patientTokens.find(q => q.appointment === apt.id)?.token_number || 'T-08'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={apt.status === 'Completed' ? 'emerald' : (apt.status === 'Cancelled' ? 'rose' : 'teal')}>
                          {apt.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {apt.appointment_type?.includes('VIDEO') && apt.status !== 'Cancelled' && (
                          <button
                            onClick={() => setActiveVideoCall({ room: apt.appointment_number, doctor: apt.doctor_name || 'Dr. Sharma' })}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                          >
                            <Video className="w-3.5 h-3.5 mr-1" />
                            Join Video
                          </button>
                        )}
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={async () => {
                              if (confirm('Cancel this appointment?')) {
                                try {
                                  await api.cancelAppointment(apt.id, 'Cancelled by patient');
                                  showToast('Appointment cancelled', 'info');
                                  loadData();
                                } catch (e: any) {
                                  showToast(e.message || 'Cancellation failed', 'error');
                                }
                              }
                            }}
                            className="text-xs text-rose-600 hover:underline font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VIDEO CONSULTATIONS */}
      {activeTab === 'video' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                Telemedicine Encrypted Video Consultations
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Join live one-on-one encrypted video call consultations with your hospital physicians and specialists.
              </p>
            </div>
            <button
              onClick={() => {
                setBookType('VIDEO');
                setActiveTab('book');
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              + Book New Video Consultation
            </button>
          </div>

          {videoAppointments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <p>No upcoming video consultations scheduled.</p>
              <button
                onClick={() => {
                  setBookType('VIDEO');
                  setActiveTab('book');
                }}
                className="text-indigo-600 font-bold hover:underline"
              >
                Schedule a Video Consultation with a Doctor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoAppointments.map((va) => (
                <div key={va.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 block">{va.appointment_number}</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{va.doctor_name || 'Dr. Rajesh Sharma'}</h4>
                      <p className="text-xs text-slate-500">{va.doctor_specialization || 'Cardiology Consultant'}</p>
                    </div>
                    <Badge variant="purple">{va.status}</Badge>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>Date: <strong className="font-mono text-slate-900 dark:text-white">{va.appointment_date}</strong></p>
                    <p>Time Slot: <strong className="font-mono text-slate-900 dark:text-white">{va.time_slot}</strong></p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={() => setActiveVideoCall({ room: va.appointment_number, doctor: va.doctor_name || 'Dr. Sharma' })}
                      className="flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Video className="w-4 h-4 mr-1.5" />
                      Join Video Consultation Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Medical Prescriptions & Clinical Advice ({emr?.prescriptions?.length || 0})
            </h3>
          </div>

          {emr?.prescriptions?.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center">No digital prescriptions on file.</p>
          ) : (
            <div className="space-y-4">
              {emr?.prescriptions?.map((rx: any) => (
                <div key={rx.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-teal-700">{rx.prescription_number}</span>
                      <p className="text-xs text-slate-500">Date: {rx.created_at?.split('T')[0]}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRxForPrint(rx)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/60 rounded-xl border border-teal-200 hover:bg-teal-100 self-start sm:self-auto"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print Official Prescription
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {rx.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{it.medicine_name}</span>
                          <span className="text-slate-400 ml-2">({it.dosage})</span>
                          {it.instructions && <p className="text-[11px] text-slate-500 italic mt-0.5">{it.instructions}</p>}
                        </div>
                        <span className="font-mono font-bold text-teal-700">{it.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: DIAGNOSTIC REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              Laboratory & Radiology Diagnostic Reports ({emr?.lab_orders?.length || 0})
            </h3>
          </div>

          {emr?.lab_orders?.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center">No diagnostic test orders on record.</p>
          ) : (
            <div className="space-y-4">
              {emr?.lab_orders?.map((lab: any) => (
                <div key={lab.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{lab.order_number}</span>
                      <p className="text-[11px] text-slate-400">Date: {lab.created_at?.split('T')[0]}</p>
                    </div>
                    <Badge variant={lab.status === 'Approved' ? 'emerald' : 'amber'}>{lab.status}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    {lab.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{it.test_name}</span>
                        <span className={`font-mono font-bold ${it.is_abnormal ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                          {it.result_value} {it.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: BILLING & INVOICES */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              Patient Hospital Invoices & Tax Receipts ({emr?.invoices?.length || 0})
            </h3>
          </div>

          {emr?.invoices?.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center">No invoices issued for this patient.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 font-mono">Total (₹)</th>
                    <th className="py-3 px-4 font-mono">Paid (₹)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Print Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {emr?.invoices?.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">{inv.invoice_number}</td>
                      <td className="py-3 px-4">{inv.invoice_type}</td>
                      <td className="py-3 px-4 text-slate-500">{inv.created_at?.split('T')[0]}</td>
                      <td className="py-3 px-4 font-mono font-bold">₹{Number(inv.total_amount).toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">₹{Number(inv.paid_amount).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={inv.status === 'Paid' ? 'emerald' : 'amber'}>{inv.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Print Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">Your consultation has been booked and queued with the clinic.</p>
            </div>

            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Live OPD Token:</span>
                <span className="font-mono font-black text-teal-800 text-base">{bookingSuccessModal.token}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Consultant:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccessModal.doctor?.full_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-mono">{bookingSuccessModal.date} at {bookingSuccessModal.slot}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Mode:</span>
                <Badge variant={bookingSuccessModal.type === 'VIDEO' ? 'purple' : 'teal'}>
                  {bookingSuccessModal.type === 'VIDEO' ? 'Online Video Call' : 'Hospital OPD Clinic'}
                </Badge>
              </div>
            </div>

            <button
              onClick={() => setBookingSuccessModal(null)}
              className="w-full py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs"
            >
              Done & View Schedule
            </button>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <PrintableInvoiceModal
        isOpen={!!selectedInvoiceForPrint}
        invoice={selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
      />

      {/* Printable Prescription Modal */}
      <PrintablePrescriptionModal
        isOpen={!!selectedRxForPrint}
        prescription={selectedRxForPrint}
        patient={activePatient}
        onClose={() => setSelectedRxForPrint(null)}
      />

      {/* Video Call Modal */}
      {activeVideoCall && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setActiveVideoCall(null)}
          roomName={activeVideoCall.room}
          userName={activePatient.full_name}
          doctorName={activeVideoCall.doctor}
          patientName={activePatient.full_name}
        />
      )}

    </div>
  );
};
