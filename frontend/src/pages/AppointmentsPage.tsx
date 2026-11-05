import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Appointment, Doctor, Patient } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Calendar, Clock, UserCheck, Plus, CheckCircle, XCircle,
  Video, CalendarDays, Filter, ChevronRight
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    patient: '',
    doctor: '',
    appointment_date: new Date().toISOString().split('T')[0],
    time_slot: '10:00 AM',
    appointment_type: 'Scheduled',
    notes: '',
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branch', String(branchId));
      if (selectedDoctor) params.append('doctor', selectedDoctor);
      const data = await api.getAppointments(params.toString());
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [branchId, selectedDoctor]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [docs, pats] = await Promise.all([
          api.getDoctors(`branch=${branchId}`),
          api.getPatients(`branch=${branchId}`)
        ]);
        setDoctors(docs);
        setPatients(pats);
      } catch (err) {
        console.error('Error loading doctors/patients', err);
      }
    }
    loadMeta();
  }, [branchId]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.patient || !bookForm.doctor) {
      showToast('Please select both a patient and a doctor', 'warning');
      return;
    }
    try {
      const doc = doctors.find((d) => d.id === Number(bookForm.doctor));
      await api.createAppointment({
        ...bookForm,
        branch: branchId,
        department: doc?.department || 1
      });
      showToast('Appointment booked successfully!', 'success');
      setShowBookModal(false);
      setBookForm({
        patient: '',
        doctor: '',
        appointment_date: new Date().toISOString().split('T')[0],
        time_slot: '10:00 AM',
        appointment_type: 'Scheduled',
        notes: '',
      });
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message || 'Booking failed', 'error');
    }
  };

  const handleCheckIn = async (apt: Appointment) => {
    try {
      const res = await api.checkInAppointment(apt.id);
      showToast(`Patient checked in! Token generated: ${res.token_number}`, 'success');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    }
  };

  const handleCancel = async (apt: Appointment) => {
    try {
      await api.cancelAppointment(apt.id, 'Cancelled by receptionist/patient request');
      showToast(`Appointment ${apt.appointment_number} cancelled`, 'info');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('appointments')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Doctor consultation scheduling, walk-ins, calendar & token dispatch
          </p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('bookAppointment')}
        </button>
      </div>

      {/* Doctor Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Filter by Doctor:</span>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Doctors ({doctors.length})</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} ({d.specialization})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing {appointments.length} scheduled visits
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Appointments Scheduled"
            description="No appointment slots currently found for this selection."
            actionText={t('bookAppointment')}
            onAction={() => setShowBookModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">APT Number</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor & Specialization</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {apt.appointment_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {apt.patient_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {apt.patient_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {apt.doctor_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {apt.department_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {apt.appointment_date}
                      </div>
                      <div className="text-[11px] text-teal-600 dark:text-teal-400 font-mono flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {apt.time_slot}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {apt.appointment_type === 'Telemedicine' && <Video className="w-3.5 h-3.5 text-blue-500 mr-1" />}
                        {apt.appointment_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          apt.status === 'Completed'
                            ? 'emerald'
                            : apt.status === 'Checked-in' || apt.status === 'In Consultation'
                            ? 'teal'
                            : apt.status === 'Cancelled'
                            ? 'rose'
                            : 'blue'
                        }
                      >
                        {apt.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {apt.status === 'Scheduled' || apt.status === 'Confirmed' ? (
                        <>
                          <button
                            onClick={() => handleCheckIn(apt)}
                            className="inline-flex items-center px-2 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                            title="Check-in patient & issue live queue token"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Check-in
                          </button>
                          <button
                            onClick={() => handleCancel(apt)}
                            className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={t('bookAppointment')}
        subtitle="Book clinic consultation or telemedicine slot"
        maxWidth="lg"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={bookForm.patient}
              onChange={(e) => setBookForm({ ...bookForm, patient: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid}) - {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Doctor *
            </label>
            <select
              required
              value={bookForm.doctor}
              onChange={(e) => setBookForm({ ...bookForm, doctor: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Consultant --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.specialization}) - Fee: ₹{d.consultation_fee}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Appointment Date
              </label>
              <input
                type="date"
                required
                value={bookForm.appointment_date}
                onChange={(e) => setBookForm({ ...bookForm, appointment_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <select
                value={bookForm.time_slot}
                onChange={(e) => setBookForm({ ...bookForm, time_slot: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Consultation Mode
            </label>
            <select
              value={bookForm.appointment_type}
              onChange={(e) => setBookForm({ ...bookForm, appointment_type: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Scheduled">In-Clinic Consultation (Regular)</option>
              <option value="Walk-in">Walk-in Urgent</option>
              <option value="Follow-up">Post-op / Review Follow-up</option>
              <option value="Telemedicine">Telemedicine Video Call</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chief Symptoms / Notes
            </label>
            <textarea
              rows={2}
              value={bookForm.notes}
              onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
              placeholder="e.g. Mild chest uneasiness, routine BP checkup"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBookModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
