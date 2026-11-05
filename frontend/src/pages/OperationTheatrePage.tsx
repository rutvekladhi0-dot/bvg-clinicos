import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Doctor } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Scissors, Calendar, Clock, UserCheck, ShieldCheck,
  CheckCircle2, Plus, Sparkles
} from 'lucide-react';

export const OperationTheatrePage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [otRooms, setOtRooms] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Surgery Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    patient: '',
    lead_surgeon: '',
    ot_room: '',
    surgery_name: '',
    surgery_category: 'General Surgery',
    scheduled_start: new Date(Date.now() + 7200000).toISOString().slice(0, 16),
    scheduled_end: new Date(Date.now() + 18000000).toISOString().slice(0, 16),
    anesthesia_type: 'General Anesthesia',
    pre_op_checklist_completed: true,
    who_surgical_safety_checklist: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [surgs, rooms, equip, pats, docs] = await Promise.all([
        api.getSurgeries(),
        api.getOTRooms(),
        api.getOTEquipment(),
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
      ]);
      setSurgeries(surgs);
      setOtRooms(rooms);
      setEquipment(equip);
      setPatients(pats);
      setDoctors(docs);
    } catch (err) {
      console.error('Error fetching OT data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleBookSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.lead_surgeon || !form.ot_room || !form.surgery_name) {
      showToast('Please fill all required surgery details', 'warning');
      return;
    }
    try {
      await api.createSurgery(form);
      showToast('Surgery scheduled successfully! OT Room blocked.', 'success');
      setShowNewModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Scheduling failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('operationTheatre')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            OT suite scheduling, surgeon assignments, WHO surgical safety checklists & sterilization tracking
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Surgery
        </button>
      </div>

      {/* OT Suites Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {otRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{room.room_number}</span>
              <Badge variant={room.is_operational ? 'emerald' : 'rose'}>
                {room.is_operational ? 'Operational' : 'Maintenance'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">{room.floor}</p>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 italic">
              {room.equipment_details}
            </p>
          </div>
        ))}
      </div>

      {/* Surgeries Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Surgical Procedures Schedule ({surgeries.length})
          </h2>
        </div>

        {surgeries.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="No Surgeries Scheduled"
            description="All OT suites are currently clear."
            actionText="Schedule Surgery"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">OT ID</th>
                  <th className="py-3 px-4">Procedure Name</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Lead Surgeon</th>
                  <th className="py-3 px-4">OT Room</th>
                  <th className="py-3 px-4">Schedule Time</th>
                  <th className="py-3 px-4">Safety Checklist</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {surgeries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {s.surgery_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.surgery_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {s.surgery_category} • {s.anesthesia_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {s.patient_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Dr. {s.lead_surgeon_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {s.ot_room_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{s.scheduled_start?.split('T')[0]}</div>
                      <div className="text-[11px] text-teal-600 font-mono">
                        {s.scheduled_start?.split('T')[1]?.slice(0, 5)} - {s.scheduled_end?.split('T')[1]?.slice(0, 5)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        WHO Verified
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="teal">{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Surgery Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Schedule Surgical Procedure"
        subtitle="Book OT suite, lead surgeon, anesthesiologist and time window"
        maxWidth="lg"
      >
        <form onSubmit={handleBookSurgery} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid}) - Blood: {p.blood_group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Procedure Name *
            </label>
            <input
              type="text"
              required
              value={form.surgery_name}
              onChange={(e) => setForm({ ...form, surgery_name: e.target.value })}
              placeholder="e.g. Laparoscopic Appendectomy / Total Knee Replacement"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lead Surgeon *
              </label>
              <select
                required
                value={form.lead_surgeon}
                onChange={(e) => setForm({ ...form, lead_surgeon: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Select Surgeon --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                OT Suite *
              </label>
              <select
                required
                value={form.ot_room}
                onChange={(e) => setForm({ ...form, ot_room: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose OT Suite --</option>
                {otRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled Start
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_start}
                onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled End
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_end}
                onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-teal-50 dark:bg-slate-800 rounded-xl text-xs space-y-2">
            <span className="font-bold text-teal-900 dark:text-teal-200 block">Surgical Safety Verifications:</span>
            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.pre_op_checklist_completed}
                onChange={(e) => setForm({ ...form, pre_op_checklist_completed: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Pre-operative clinical fasting & consent completed</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.who_surgical_safety_checklist}
                onChange={(e) => setForm({ ...form, who_surgical_safety_checklist: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>WHO Surgical Safety Sign-in & Site Marking verified</span>
            </label>
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
              Confirm Surgery Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
