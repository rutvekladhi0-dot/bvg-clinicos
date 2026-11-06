import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LabOrder, LabTest, RadiologyOrder, RadiologyInvestigation, Patient, Doctor } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  FlaskConical, Scan, CheckCircle, Clock, Plus, Search,
  FileCheck, ShieldAlert, AlertTriangle, Eye, Printer,
  Barcode, Layers, Image as ImageIcon, Activity, FileText,
  Filter, Calendar, ChevronRight
} from 'lucide-react';

export const LaboratoryPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radOrders, setRadOrders] = useState<RadiologyOrder[]>([]);
  const [radInvestigations, setRadInvestigations] = useState<RadiologyInvestigation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'all' | 'pathology' | 'radiology' | 'accessioning' | 'reports'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPatient, setOrderPatient] = useState('');
  const [orderDoctor, setOrderDoctor] = useState('');
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

  // Add Lab Test Modal
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    name: '',
    test_code: '',
    category: 'Biochemistry & Pathology',
    sample_type: 'Whole Blood EDTA',
    standard_fee: 450,
    turnaround_hours: 4,
    unit: 'mg/dL',
    reference_interval: 'Normal reference range varies by age/gender',
  });

  // Schedule Radiology Scan Modal
  const [showRadModal, setShowRadModal] = useState(false);
  const [radPatientId, setRadPatientId] = useState('');
  const [radDoctorId, setRadDoctorId] = useState('');
  const [radInvId, setRadInvId] = useState('');

  // Submit Radiology Report Modal
  const [reportingRadOrder, setReportingRadOrder] = useState<RadiologyOrder | null>(null);
  const [radFindings, setRadFindings] = useState('');
  const [radImpression, setRadImpression] = useState('');

  // View Modals
  const [viewLabOrder, setViewLabOrder] = useState<LabOrder | null>(null);
  const [viewRadOrder, setViewRadOrder] = useState<RadiologyOrder | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordList, testList, rOrdList, rInvList, pList, dList] = await Promise.all([
        api.getLabOrders(`branch=${branchId}`).catch(() => []),
        api.getLabTests().catch(() => []),
        api.getRadiologyOrders(`branch=${branchId}`).catch(() => []),
        api.getRadiologyInvestigations().catch(() => []),
        api.getPatients(`branch=${branchId}`).catch(() => []),
        api.getDoctors(`branch=${branchId}`).catch(() => []),
      ]);
      setLabOrders(ordList || []);
      setLabTests(testList || []);
      setRadOrders(rOrdList || []);
      setRadInvestigations(rInvList || []);
      setPatients(pList || []);
      setDoctors(dList || []);
    } catch (err) {
      console.error('Error fetching diagnostic data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  // Handle Lab Order Creation
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPatient || !orderDoctor || selectedTests.length === 0) {
      showToast('Please select patient, doctor and at least one lab test', 'warning');
      return;
    }
    try {
      const items = selectedTests.map((tId) => ({
        test: tId,
        result_value: '13.5',
        unit: 'g/dL',
        is_abnormal: false,
      }));
      await api.createLabOrder({
        patient: Number(orderPatient),
        doctor: Number(orderDoctor),
        branch: branchId,
        status: 'Ordered',
        items,
      });
      showToast('Lab investigation ordered successfully!', 'success');
      setShowOrderModal(false);
      setSelectedTests([]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Order failed', 'error');
    }
  };

  // Handle Add Lab Test
  const handleAddTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name) {
      showToast('Please enter a test name', 'warning');
      return;
    }
    try {
      await api.createLabTest({
        ...testForm,
        standard_fee: Number(testForm.standard_fee),
        turnaround_hours: Number(testForm.turnaround_hours),
      });
      showToast(`Diagnostic Test '${testForm.name}' added to Lab Catalog!`, 'success');
      setShowAddTestModal(false);
      setTestForm({
        name: '',
        test_code: '',
        category: 'Biochemistry & Pathology',
        sample_type: 'Whole Blood EDTA',
        standard_fee: 450,
        turnaround_hours: 4,
        unit: 'mg/dL',
        reference_interval: 'Normal reference range varies by age/gender',
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add test', 'error');
    }
  };

  // Handle Sample Collection
  const handleCollectSample = async (id: number) => {
    try {
      const updated = await api.collectLabSample(id);
      showToast(`Sample collected! Barcode: BAR-${updated.order_number}`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Handle Lab Report Approval
  const handleApproveOrder = async (id: number) => {
    try {
      await api.approveLabOrder(id);
      showToast('Lab report approved & published! Invoiced to patient bill.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  // Handle Schedule Radiology Scan
  const handleCreateRadOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radPatientId || !radDoctorId || !radInvId) {
      showToast('Please select patient, doctor and imaging scan', 'warning');
      return;
    }
    try {
      await api.createRadiologyOrder({
        patient: Number(radPatientId),
        doctor: Number(radDoctorId),
        investigation: Number(radInvId),
        branch: branchId,
        status: 'Requested',
      });
      showToast('Radiology scan scheduled successfully!', 'success');
      setShowRadModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Order failed', 'error');
    }
  };

  // Handle Submit Radiology Report
  const handleSubmitRadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingRadOrder) return;
    try {
      await api.submitRadiologyReport(reportingRadOrder.id, {
        findings: radFindings,
        impression: radImpression,
        image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600',
      });
      showToast('Radiology report verified & approved! Invoiced to patient bill.', 'success');
      setReportingRadOrder(null);
      setRadFindings('');
      setRadImpression('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Report submission failed', 'error');
    }
  };

  const toggleTest = (id: number) => {
    if (selectedTests.includes(id)) {
      setSelectedTests(selectedTests.filter((tId) => tId !== id));
    } else {
      setSelectedTests([...selectedTests, id]);
    }
  };

  // Filtered Lab Orders
  const filteredLabOrders = useMemo(() => {
    return labOrders.filter((ord) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (ord.order_number || '').toLowerCase().includes(q) ||
        (ord.patient_name || '').toLowerCase().includes(q) ||
        (ord.doctor_name || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [labOrders, searchQuery, statusFilter]);

  // Filtered Radiology Orders
  const filteredRadOrders = useMemo(() => {
    return radOrders.filter((ord) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (ord.order_number || '').toLowerCase().includes(q) ||
        (ord.patient_name || '').toLowerCase().includes(q) ||
        (ord.doctor_name || '').toLowerCase().includes(q) ||
        (ord.investigation_name || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [radOrders, searchQuery, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('laboratory')} & Radiology
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Integrated diagnostic center: Clinical pathology, biochemistry, 3T MRI, CT scan, Digital X-Ray & verified imaging reports
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddTestModal(true)}
            className="flex items-center justify-center px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs transition-colors"
          >
            <FlaskConical className="w-4 h-4 mr-1.5 text-teal-600 dark:text-teal-400" />
            {t('addLabTest')}
          </button>
          <button
            onClick={() => setShowRadModal(true)}
            className="flex items-center justify-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Scan className="w-4 h-4 mr-1.5" />
            Schedule Imaging Scan
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Order Lab Tests
          </button>
        </div>
      </div>

      {/* Diagnostic Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'all'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 mr-2" />
          Unified Diagnostics ({labOrders.length + radOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('pathology')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'pathology'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 mr-2" />
          Pathology Tests ({labOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('radiology')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'radiology'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Scan className="w-3.5 h-3.5 mr-2" />
          Radiology & Imaging ({radOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('accessioning')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'accessioning'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Barcode className="w-3.5 h-3.5 mr-2" />
          Sample Barcodes
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            activeTab === 'reports'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 mr-2" />
          Verified Reports & PACS
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders by Order #, Patient Name, or Doctor..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Ordered">Ordered / Requested</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="Approved">Approved / Completed</option>
          </select>
        </div>
      </div>

      {/* TAB 1: Unified Diagnostics & TAB 2: Pathology */}
      {(activeTab === 'all' || activeTab === 'pathology') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <FlaskConical className="w-4 h-4 mr-2 text-teal-600" />
                Pathology Laboratory Investigations ({filteredLabOrders.length})
              </h2>
              <p className="text-xs text-slate-400">Sample progression: Ordered → Sample Collected → Results Entered → Approved</p>
            </div>
          </div>

          {filteredLabOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching pathology lab orders.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Patient (UHID)</th>
                    <th className="py-3 px-4">Referring Doctor</th>
                    <th className="py-3 px-4">Diagnostic Tests</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredLabOrders.map((ord) => (
                    <tr key={`lab-${ord.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {ord.patient_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {ord.patient_uhid}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        Dr. {ord.doctor_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {ord.items?.map((it, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                it.is_abnormal
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {it.test_name}: {it.result_value || 'Pending'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            ord.status === 'Approved'
                              ? 'emerald'
                              : ord.status === 'Sample Collected'
                              ? 'teal'
                              : 'amber'
                          }
                        >
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {ord.status === 'Ordered' && (
                          <button
                            onClick={() => handleCollectSample(ord.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                          >
                            Collect Sample
                          </button>
                        )}
                        {ord.status === 'Sample Collected' && (
                          <button
                            onClick={() => handleApproveOrder(ord.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                          >
                            Approve Report
                          </button>
                        )}
                        <button
                          onClick={() => setViewLabOrder(ord)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          View
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

      {/* TAB 1 & TAB 3: Radiology & Imaging */}
      {(activeTab === 'all' || activeTab === 'radiology') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Scan className="w-4 h-4 mr-2 text-indigo-600" />
                Radiology & Medical Imaging Scans ({filteredRadOrders.length})
              </h2>
              <p className="text-xs text-slate-400">Digital Radiography, CT Scan, 3T MRI, Ultrasound & verified PACS impressions</p>
            </div>
          </div>

          {filteredRadOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching radiology scans.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Scan Order #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Referring Doctor</th>
                    <th className="py-3 px-4">Imaging Modality</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Radiologist Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredRadOrders.map((ro) => (
                    <tr key={`rad-${ro.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {ro.order_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {ro.patient_name}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        Dr. {ro.doctor_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md text-[11px]">
                          {ro.investigation_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{ro.created_at?.split('T')[0]}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={ro.status === 'Completed' ? 'emerald' : ro.status === 'In Progress' ? 'purple' : 'amber'}>
                          {ro.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {ro.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              setReportingRadOrder(ro);
                              setRadFindings(ro.findings || '');
                              setRadImpression(ro.impression || '');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                          >
                            Submit Findings
                          </button>
                        )}
                        <button
                          onClick={() => setViewRadOrder(ro)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          View PACS
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

      {/* TAB 4: Sample Accessioning & Barcoding */}
      {activeTab === 'accessioning' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Specimen Accessioning & Barcode Tracker
              </h2>
              <p className="text-xs text-slate-400">Real-time sample accessioning, chain-of-custody tracking & automated laboratory barcodes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {labOrders.map((ord) => (
              <div
                key={`acc-${ord.id}`}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Sample Token</span>
                    <p className="font-mono font-black text-sm text-teal-700 dark:text-teal-400">
                      BAR-{ord.order_number}
                    </p>
                  </div>
                  <Badge variant={ord.status === 'Sample Collected' ? 'teal' : ord.status === 'Approved' ? 'emerald' : 'amber'}>
                    {ord.status}
                  </Badge>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">{ord.patient_name}</p>
                  <p className="text-slate-400 font-mono">UHID: {ord.patient_uhid}</p>
                  <p className="text-slate-500">Ref: Dr. {ord.doctor_name}</p>
                </div>

                {ord.status === 'Ordered' ? (
                  <button
                    onClick={() => handleCollectSample(ord.id)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Scan & Collect Specimen
                  </button>
                ) : (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    ✓ Accessioned & In Processing
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Verified Reports & PACS */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Verified Diagnostic Archives & Digital PACS Imaging
              </h2>
              <p className="text-xs text-slate-400">Published pathology reports, DICOM scans, and validated specialist diagnostic impressions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Pathology Approved */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Verified Pathology Reports ({labOrders.filter(l => l.status === 'Approved').length})
              </h3>
              {labOrders.filter(l => l.status === 'Approved').map(ord => (
                <div key={`rep-lab-${ord.id}`} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-teal-700">{ord.order_number}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{ord.patient_name}</p>
                    <p className="text-[11px] text-slate-400">Dr. {ord.doctor_name}</p>
                  </div>
                  <button
                    onClick={() => setViewLabOrder(ord)}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold rounded-lg"
                  >
                    View Report
                  </button>
                </div>
              ))}
            </div>

            {/* Radiology Approved */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                PACS Medical Imaging Impressions ({radOrders.filter(r => r.status === 'Completed').length})
              </h3>
              {radOrders.filter(r => r.status === 'Completed').map(ord => (
                <div key={`rep-rad-${ord.id}`} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-indigo-700">{ord.order_number}</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{ord.patient_name}</p>
                    <p className="text-[11px] text-indigo-600 font-medium">{ord.investigation_name}</p>
                  </div>
                  <button
                    onClick={() => setViewRadOrder(ord)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg"
                  >
                    View PACS
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Order Lab Tests */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Order Laboratory Investigations"
        subtitle="Select patient, referring clinician and test catalog items"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={orderPatient}
              onChange={(e) => setOrderPatient(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Referring Clinician *
            </label>
            <select
              required
              value={orderDoctor}
              onChange={(e) => setOrderDoctor(e.target.value)}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Lab Tests from Catalog
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {labTests.map((t) => {
                const isChecked = selectedTests.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isChecked ? 'bg-teal-100/70 dark:bg-teal-950/60 font-bold text-teal-900 dark:text-teal-200' : 'hover:bg-slate-200/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTest(t.id)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1 truncate">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">₹{t.standard_fee} • {t.sample_type}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Place Lab Order
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Schedule Radiology Scan */}
      <Modal
        isOpen={showRadModal}
        onClose={() => setShowRadModal(false)}
        title="Schedule Radiology & Medical Imaging Scan"
        subtitle="Schedule Digital X-Ray, 3T MRI, Multislice CT or Ultrasound investigation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRadOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={radPatientId}
              onChange={(e) => setRadPatientId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Referring Clinician *
            </label>
            <select
              required
              value={radDoctorId}
              onChange={(e) => setRadDoctorId(e.target.value)}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Imaging Investigation Scan *
            </label>
            <select
              required
              value={radInvId}
              onChange={(e) => setRadInvId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="">-- Choose Imaging Scan --</option>
              {radInvestigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.modality_name || 'Imaging'}) - ₹{inv.standard_fee}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowRadModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
            >
              Schedule Scan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Submit Radiology Report */}
      {reportingRadOrder && (
        <Modal
          isOpen={!!reportingRadOrder}
          onClose={() => setReportingRadOrder(null)}
          title={`Radiologist Report - ${reportingRadOrder.order_number}`}
          subtitle={`Patient: ${reportingRadOrder.patient_name} • Scan: ${reportingRadOrder.investigation_name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitRadReport} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Imaging Findings *
              </label>
              <textarea
                rows={3}
                required
                value={radFindings}
                onChange={(e) => setRadFindings(e.target.value)}
                placeholder="Detailed radiological observations across all acquisition planes..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Impression & Conclusion *
              </label>
              <textarea
                rows={2}
                required
                value={radImpression}
                onChange={(e) => setRadImpression(e.target.value)}
                placeholder="Final summary diagnosis and recommended clinical correlation..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReportingRadOrder(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                Approve & Publish Impression
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: View Verified Lab Report */}
      {viewLabOrder && (
        <Modal
          isOpen={!!viewLabOrder}
          onClose={() => setViewLabOrder(null)}
          title={`Diagnostic Report - ${viewLabOrder.order_number}`}
          subtitle={`Patient: ${viewLabOrder.patient_name} (${viewLabOrder.patient_uhid})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Pathology & Clinical Biochemistry Dept.</p>
                <p className="text-slate-500">Referring Doctor: Dr. {viewLabOrder.doctor_name}</p>
              </div>
              <div className="text-right">
                <Badge variant={viewLabOrder.status === 'Approved' ? 'emerald' : 'amber'}>
                  {viewLabOrder.status}
                </Badge>
                <p className="text-[10px] text-slate-400 mt-1">{viewLabOrder.created_at?.split('T')[0]}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2">Investigation</th>
                  <th className="py-2">Result Value</th>
                  <th className="py-2">Biological Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewLabOrder.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{it.test_name}</td>
                    <td className={`py-2.5 font-mono font-bold ${it.is_abnormal ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {it.result_value} {it.unit}
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">{it.reference_interval || 'Standard Range'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-[#0F766E] text-white font-bold rounded-xl shadow-sm text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Verified Lab Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: View PACS Radiology Scan & Impression */}
      {viewRadOrder && (
        <Modal
          isOpen={!!viewRadOrder}
          onClose={() => setViewRadOrder(null)}
          title={`PACS Medical Imaging - ${viewRadOrder.order_number}`}
          subtitle={`Investigation: ${viewRadOrder.investigation_name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900">
              <div>
                <p className="font-bold text-indigo-950 dark:text-indigo-200">{viewRadOrder.investigation_name}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">Patient: {viewRadOrder.patient_name}</p>
              </div>
              <Badge variant={viewRadOrder.status === 'Completed' ? 'emerald' : 'purple'}>
                {viewRadOrder.status}
              </Badge>
            </div>

            {viewRadOrder.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black flex justify-center items-center max-h-72">
                <img
                  src={viewRadOrder.image_url}
                  alt="Radiology Scan"
                  className="max-h-72 object-contain"
                />
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">Findings:</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{viewRadOrder.findings || 'Pending acquisition and review.'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">Impression:</span>
                <p className="text-indigo-700 dark:text-indigo-300 font-bold mt-0.5">{viewRadOrder.impression || 'Awaiting radiologist verification.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print PACS Impression
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 6: Add Lab Test to Catalog */}
      <Modal
        isOpen={showAddTestModal}
        onClose={() => setShowAddTestModal(false)}
        title={t('addLabTest')}
        subtitle="Configure investigation parameters, specimen requirements and biological reference intervals"
        maxWidth="lg"
      >
        <form onSubmit={handleAddTestSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Investigation / Test Name *
              </label>
              <input
                type="text"
                required
                value={testForm.name}
                onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                placeholder="e.g. HbA1c Glycated Hemoglobin"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Test Code (Unique Identifier)
              </label>
              <input
                type="text"
                value={testForm.test_code}
                onChange={(e) => setTestForm({ ...testForm, test_code: e.target.value })}
                placeholder="e.g. HBA1C-01 (Auto-generated if empty)"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Diagnostic Category
              </label>
              <select
                value={testForm.category}
                onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Biochemistry & Pathology">Biochemistry & Pathology</option>
                <option value="Hematology & Complete Blood">Hematology & Complete Blood</option>
                <option value="Microbiology & Serology">Microbiology & Serology</option>
                <option value="Immunology & Hormones">Immunology & Hormones</option>
                <option value="Histopathology & Cytology">Histopathology & Cytology</option>
                <option value="Molecular Diagnostics">Molecular Diagnostics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Specimen / Sample Type
              </label>
              <select
                value={testForm.sample_type}
                onChange={(e) => setTestForm({ ...testForm, sample_type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Whole Blood EDTA">Whole Blood EDTA (Purple Top)</option>
                <option value="Serum Clot Activator">Serum Clot Activator (Red/Gold Top)</option>
                <option value="Sodium Fluoride Plasma">Sodium Fluoride Plasma (Grey Top)</option>
                <option value="Mid-stream Clean Urine">Mid-stream Clean Urine</option>
                <option value="Sterile Throat Swab">Sterile Throat Swab</option>
                <option value="Synovial / CSF Fluid">Synovial / CSF Fluid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Standard Fee (₹)
              </label>
              <input
                type="number"
                value={testForm.standard_fee}
                onChange={(e) => setTestForm({ ...testForm, standard_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Turnaround (Hrs)
              </label>
              <input
                type="number"
                value={testForm.turnaround_hours}
                onChange={(e) => setTestForm({ ...testForm, turnaround_hours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Measurement Unit
              </label>
              <input
                type="text"
                value={testForm.unit}
                onChange={(e) => setTestForm({ ...testForm, unit: e.target.value })}
                placeholder="e.g. mg/dL, g/dL"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Biological Reference Range / Interval
            </label>
            <input
              type="text"
              value={testForm.reference_interval}
              onChange={(e) => setTestForm({ ...testForm, reference_interval: e.target.value })}
              placeholder="e.g. 70 - 110 mg/dL (Normal Fasting)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddTestModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              Save Diagnostic Test
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
