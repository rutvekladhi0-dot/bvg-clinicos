import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EmergencyCase, Patient, Doctor } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  AlertOctagon, Activity, Plus, Heart, ShieldAlert,
  ArrowRight, Clock, Siren, Bed, CheckCircle2
} from 'lucide-react';

export const EmergencyPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Emergency Case Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    patient: '',
    attending_doctor: '',
    triage_level: 'Red' as EmergencyCase['triage_level'],
    arrival_mode: 'Ambulance 108',
    chief_complaint: '',
    gcs_score: 15,
    systolic_bp: 120,
    diastolic_bp: 80,
    pulse: 88,
    spo2: 96,
    initial_management: 'Supplemental O2 initiated. IV access secured.',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emCases, pList, dList] = await Promise.all([
        api.getEmergencyCases(`branch=${branchId}`),
        api.getPatients(`branch=${branchId}`),
        api.getDoctors(`branch=${branchId}`),
      ]);
      setCases(emCases);
      setPatients(pList);
      setDoctors(dList);
    } catch (err) {
      console.error('Error fetching emergency data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.patient || !newForm.chief_complaint) {
      showToast('Please select a patient and enter chief complaint', 'warning');
      return;
    }
    try {
      await api.createEmergencyCase({ ...newForm, branch: branchId });
      showToast('Emergency case registered! Triage alert active.', 'success');
      setShowNewModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  const redCases = cases.filter((c) => c.triage_level === 'Red');
  const orangeCases = cases.filter((c) => c.triage_level === 'Orange');
  const yellowCases = cases.filter((c) => c.triage_level === 'Yellow');
  const greenCases = cases.filter((c) => c.triage_level === 'Green');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('emergency')}
            </h1>
            <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              <Siren className="w-3 h-3 mr-1 text-rose-600 animate-bounce" />
              24x7 Level-1 Trauma
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Emergency triage categories, critical vital monitors, rapid ICU transfer & resuscitation
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Emergency Rapid Intake
        </button>
      </div>

      {/* Triage Overview Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Red Box */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-300 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mr-1.5 animate-ping" />
              Red - Resuscitation
            </span>
            <span className="text-lg font-black text-rose-700">{redCases.length}</span>
          </div>
          <p className="text-[11px] text-rose-600/80">Immediate life threat (Within 0 mins)</p>
        </div>

        {/* Orange Box */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
              Orange - Very Urgent
            </span>
            <span className="text-lg font-black text-amber-700">{orangeCases.length}</span>
          </div>
          <p className="text-[11px] text-amber-600/80">Critical pain / vitals (Within 10 mins)</p>
        </div>

        {/* Yellow Box */}
        <div className="bg-yellow-50/70 dark:bg-yellow-950/30 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-900">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase text-yellow-700 dark:text-yellow-400 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5" />
              Yellow - Urgent
            </span>
            <span className="text-lg font-black text-yellow-700">{yellowCases.length}</span>
          </div>
          <p className="text-[11px] text-yellow-600/80">Stable acute condition (Within 30 mins)</p>
        </div>

        {/* Green Box */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Green - Standard
            </span>
            <span className="text-lg font-black text-emerald-700">{greenCases.length}</span>
          </div>
          <p className="text-[11px] text-emerald-600/80">Minor injuries / non-urgent</p>
        </div>
      </div>

      {/* Emergency Cases Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Emergency Cases Log ({cases.length})
          </h2>
        </div>

        {cases.length === 0 ? (
          <EmptyState
            icon={AlertOctagon}
            title="Emergency Ward Clear"
            description="No active emergency admissions registered in this shift."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {cases.map((c) => {
              const isRed = c.triage_level === 'Red';
              const isOrange = c.triage_level === 'Orange';
              return (
                <div
                  key={c.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {c.case_number}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          isRed
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isOrange
                            ? 'bg-amber-500 text-white'
                            : 'bg-yellow-400 text-slate-900'
                        }`}
                      >
                        {c.triage_level} Triage
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Arrived via {c.arrival_mode}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.patient_name} • <span className="font-normal text-slate-500">GCS: {c.gcs_score}/15</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Chief Complaint: {c.chief_complaint}
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      Management: {c.initial_management}
                    </p>
                  </div>

                  {/* Vitals Pill */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-xs">
                    <div className="text-center px-2">
                      <span className="text-[10px] text-slate-400 block">BP</span>
                      <strong className="text-slate-800 dark:text-slate-200">{c.systolic_bp}/{c.diastolic_bp}</strong>
                    </div>
                    <div className="text-center px-2 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Pulse</span>
                      <strong className={c.pulse > 100 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}>{c.pulse} bpm</strong>
                    </div>
                    <div className="text-center px-2 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">SpO2</span>
                      <strong className={c.spo2 < 92 ? 'text-rose-600 font-black' : 'text-emerald-600'}>{c.spo2}%</strong>
                    </div>
                    <div className="text-center px-2 border-l border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Status</span>
                      <strong className="text-teal-600">{c.status}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Admission Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Emergency Case Registration"
        subtitle="Rapid triage protocol & physiological parameters"
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={newForm.patient}
              onChange={(e) => setNewForm({ ...newForm, patient: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid}) - {p.gender}, Blood: {p.blood_group}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Triage Category *
              </label>
              <select
                value={newForm.triage_level}
                onChange={(e) => setNewForm({ ...newForm, triage_level: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="Red">Red (Resuscitation - Immediate)</option>
                <option value="Orange">Orange (Very Urgent - 10m)</option>
                <option value="Yellow">Yellow (Urgent - 30m)</option>
                <option value="Green">Green (Standard)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Arrival Mode
              </label>
              <select
                value={newForm.arrival_mode}
                onChange={(e) => setNewForm({ ...newForm, arrival_mode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Ambulance 108">Ambulance 108</option>
                <option value="Private Ambulance">Private Hospital Ambulance</option>
                <option value="Private Vehicle">Private Vehicle / Auto</option>
                <option value="Walk-in">Walk-in Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chief Presenting Complaint *
            </label>
            <textarea
              required
              rows={2}
              value={newForm.chief_complaint}
              onChange={(e) => setNewForm({ ...newForm, chief_complaint: e.target.value })}
              placeholder="e.g. Acute crushing chest pain radiating to left jaw, profuse diaphoresis"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">BP Sys</label>
              <input
                type="number"
                value={newForm.systolic_bp}
                onChange={(e) => setNewForm({ ...newForm, systolic_bp: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">BP Dia</label>
              <input
                type="number"
                value={newForm.diastolic_bp}
                onChange={(e) => setNewForm({ ...newForm, diastolic_bp: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Pulse</label>
              <input
                type="number"
                value={newForm.pulse}
                onChange={(e) => setNewForm({ ...newForm, pulse: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">SpO2 %</label>
              <input
                type="number"
                value={newForm.spo2}
                onChange={(e) => setNewForm({ ...newForm, spo2: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Initial Emergency Management
            </label>
            <input
              type="text"
              value={newForm.initial_management}
              onChange={(e) => setNewForm({ ...newForm, initial_management: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
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
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
            >
              Confirm Emergency Triage
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
