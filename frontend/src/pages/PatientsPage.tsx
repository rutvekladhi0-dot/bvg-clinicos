import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users, Search, UserPlus, Phone, Calendar, Heart, ShieldAlert,
  Activity, FileText, ChevronRight, Filter, Eye
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Date Wise Filtering
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'DAY_BEFORE' | 'LAST_7_DAYS' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Registration Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1985-01-01',
    gender: 'Male',
    blood_group: 'B+',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    chronic_conditions: '',
  });

  // Patient Detail EMR Modal
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [emrData, setEmrData] = useState<any>(null);
  const [emrLoading, setEmrLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branch', String(branchId));
      if (search) params.append('search', search);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      // Date filtering logic
      const now = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      if (dateFilter === 'TODAY') {
        params.append('date', formatDate(now));
      } else if (dateFilter === 'YESTERDAY') {
        const yest = new Date(now.getTime() - 86400000);
        params.append('date', formatDate(yest));
      } else if (dateFilter === 'DAY_BEFORE') {
        const dayBefore = new Date(now.getTime() - 172800000);
        params.append('date', formatDate(dayBefore));
      } else if (dateFilter === 'LAST_7_DAYS') {
        const last7 = new Date(now.getTime() - 7 * 86400000);
        params.append('start_date', formatDate(last7));
        params.append('end_date', formatDate(now));
      } else if (dateFilter === 'CUSTOM' && customDate) {
        params.append('date', customDate);
      }

      const data = await api.getPatients(params.toString());
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [branchId, statusFilter, dateFilter, customDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.first_name || !regForm.phone) {
      showToast('First name and phone number are required', 'warning');
      return;
    }
    try {
      await api.createPatient({ ...regForm, branch: branchId });
      showToast('Patient registered successfully! UHID assigned.', 'success');
      setShowRegisterModal(false);
      setRegForm({
        first_name: '',
        last_name: '',
        date_of_birth: '1985-01-01',
        gender: 'Male',
        blood_group: 'B+',
        phone: '',
        email: '',
        address: '',
        allergies: '',
        chronic_conditions: '',
      });
      fetchPatients();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setEmrLoading(true);
    try {
      const fullEmr = await api.getPatientEMR(patient.id);
      setEmrData(fullEmr);
    } catch (err) {
      console.error('Error loading EMR', err);
    } finally {
      setEmrLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('patients')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete demographic master, clinical history & EMR tracking
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {t('registerPatient')}
        </button>
      </div>

      {/* Date-Wise Patient Filter Bar (Receptionist & Admin Feature) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {t('dateWisePatientFilter')}
              </span>
              <p className="text-[11px] text-slate-400">
                {t('dateWisePatientFilterSubtitle')}
              </p>
            </div>
          </div>

          {/* Quick Date Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('allRecords')}
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'TODAY'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('today')}
            </button>
            <button
              onClick={() => setDateFilter('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'YESTERDAY'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('yesterday')}
            </button>
            <button
              onClick={() => setDateFilter('DAY_BEFORE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'DAY_BEFORE'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('dayBefore')}
            </button>
            <button
              onClick={() => setDateFilter('LAST_7_DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'LAST_7_DAYS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('last7Days')}
            </button>
          </div>
        </div>

        {/* Custom Date Picker & Filter State Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">{t('selectCalendarDate')}</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('CUSTOM');
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {dateFilter !== 'ALL' && (
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-lg">
              <span>{t('showingFilteredPatients')} ({patients.length})</span>
              <button
                onClick={() => setDateFilter('ALL')}
                className="text-[11px] underline hover:text-teal-900 dark:hover:text-teal-100 font-bold ml-1"
              >
                {t('clearDateFilter')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Active', 'Inpatient', 'Discharged', 'Emergency'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full md:w-80 space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search UHID, Name, Phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-teal-600"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
          >
            {t('filter')}
          </button>
        </form>
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading patients...</div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Patients Found"
            description="No matching patient records in this branch."
            actionText={t('registerPatient')}
            onAction={() => setShowRegisterModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">{t('uhid')}</th>
                  <th className="py-3 px-4">{t('patientName')}</th>
                  <th className="py-3 px-4">{t('genderBlood')}</th>
                  <th className="py-3 px-4">{t('contactPhone')}</th>
                  <th className="py-3 px-4">{t('visitRegDate')}</th>
                  <th className="py-3 px-4">{t('allergiesAlerts')}</th>
                  <th className="py-3 px-4">{t('status')}</th>
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {p.uhid}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.city || 'Pune'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {t(p.gender)}
                      </span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {p.blood_group}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono font-semibold">
                        {(p as any).registered_at ? new Date((p as any).registered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : t('today')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.allergies ? (
                        <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1 shrink-0" />
                          {p.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400">Nil</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          p.status === 'Inpatient'
                            ? 'purple'
                            : p.status === 'Emergency'
                            ? 'rose'
                            : p.status === 'Active'
                            ? 'emerald'
                            : 'slate'
                        }
                      >
                        {t(p.status)}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewPatient(p)}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        EMR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Registration Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title={t('registerPatient')}
        subtitle="Generates unique UHID (Unique Healthcare Identifier)"
        maxWidth="2xl"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                required
                type="text"
                value={regForm.first_name}
                onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="e.g. Ramesh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={regForm.last_name}
                onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="e.g. Kadam"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={regForm.gender}
                onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Blood Group
              </label>
              <select
                value={regForm.blood_group}
                onChange={(e) => setRegForm({ ...regForm, blood_group: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={regForm.date_of_birth}
                onChange={(e) => setRegForm({ ...regForm, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                required
                type="tel"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="+91 98220 00000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="patient@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Known Drug Allergies (Critical)
            </label>
            <input
              type="text"
              value={regForm.allergies}
              onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chronic Medical Conditions
            </label>
            <input
              type="text"
              value={regForm.chronic_conditions}
              onChange={(e) => setRegForm({ ...regForm, chronic_conditions: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Complete Registration
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Patient EMR Drawer / Modal */}
      {selectedPatient && (
        <Modal
          isOpen={!!selectedPatient}
          onClose={() => setSelectedPatient(null)}
          title={`Electronic Medical Record (EMR) - ${selectedPatient.full_name}`}
          subtitle={`UHID: ${selectedPatient.uhid} | Phone: ${selectedPatient.phone}`}
          maxWidth="4xl"
        >
          {emrLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading complete clinical EMR...</div>
          ) : emrData ? (
            <div className="space-y-6">
              {/* Clinical Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-teal-50/60 dark:bg-slate-800/60 rounded-xl border border-teal-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Blood Group</span>
                  <p className="text-sm font-black text-rose-600">{selectedPatient.blood_group}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Allergies</span>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 truncate">{selectedPatient.allergies || 'None'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Chronic Illness</span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{selectedPatient.chronic_conditions || 'None'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Status</span>
                  <p className="text-xs font-bold text-teal-700 dark:text-teal-400">{selectedPatient.status}</p>
                </div>
              </div>

              {/* Consultations History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  OPD Doctor Consultations ({emrData.consultations?.length || 0})
                </h4>
                {emrData.consultations?.length === 0 ? (
                  <p className="text-xs text-slate-400">No consultations recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {emrData.consultations?.map((c: any) => (
                      <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              Diagnosis: {c.diagnosis} ({c.icd10_code})
                            </span>
                            <p className="text-xs text-slate-500">Dr. {c.doctor_name} | BP: {c.systolic_bp}/{c.diastolic_bp} mmHg, Pulse: {c.heart_rate} bpm</p>
                          </div>
                          <span className="text-[10px] text-slate-400">{c.consultation_date?.split('T')[0]}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-white dark:bg-slate-900 p-2 rounded-lg">
                          Chief Complaints: {c.chief_complaint}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Prescription History ({emrData.prescriptions?.length || 0})
                </h4>
                {emrData.prescriptions?.map((rx: any) => (
                  <div key={rx.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mb-2">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-xs text-teal-600">{rx.prescription_number}</span>
                      <span className="text-[10px] text-slate-400">{rx.created_at?.split('T')[0]}</span>
                    </div>
                    <div className="space-y-1">
                      {rx.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-xs bg-white dark:bg-slate-900 p-1.5 rounded">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{it.medicine_name} ({it.dosage})</span>
                          <span className="text-teal-600">{it.frequency} x {it.duration_days} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Lab Orders */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Laboratory Reports ({emrData.lab_orders?.length || 0})
                </h4>
                {emrData.lab_orders?.map((lab: any) => (
                  <div key={lab.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono font-bold">{lab.order_number}</span>
                      <Badge variant={lab.status === 'Approved' ? 'emerald' : 'amber'}>{lab.status}</Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      {lab.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs bg-white dark:bg-slate-900 p-1.5 rounded">
                          <span>{item.test_name}</span>
                          <span className={item.is_abnormal ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                            {item.result_value} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
};
