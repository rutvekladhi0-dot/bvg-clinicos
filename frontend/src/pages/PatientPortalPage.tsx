import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users, Calendar, FileText, FlaskConical, CreditCard,
  Download, Printer, Heart, Clock, User
} from 'lucide-react';

export const PatientPortalPage: React.FC = () => {
  const { branchId, t } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [emr, setEmr] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const pList = await api.getPatients(`branch=${branchId}`);
        setPatients(pList);
        if (pList.length > 0) {
          setActivePatient(pList[0]);
          const fullEmr = await api.getPatientEMR(pList[0].id);
          setEmr(fullEmr);
        }
      } catch (err) {
        console.error('Error loading patient portal', err);
      } finally {
        setLoading(false);
      }
    }
    load();
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

  if (loading || !activePatient) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('patientPortal')}
            </h1>
            <Badge variant="teal">Patient Self-Service</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal health record, prescription history, lab reports & billing receipts
          </p>
        </div>

        {/* Demo Patient Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">View as Patient:</span>
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
      </div>

      {/* Patient Welcome Hero Card */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-2xl text-white border border-white/20">
              {activePatient.first_name[0]}
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-teal-300">
                UHID: {activePatient.uhid}
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {activePatient.full_name}
              </h2>
              <p className="text-xs text-teal-100 mt-1">
                {activePatient.gender} • Blood Group: <strong className="text-white">{activePatient.blood_group}</strong> • {activePatient.phone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[10px] text-teal-200 block uppercase font-bold">Allergy Alert</span>
              <p className="font-bold text-rose-300 truncate max-w-[140px]">{activePatient.allergies || 'Nil Known'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[10px] text-teal-200 block uppercase font-bold">Health Status</span>
              <p className="font-bold text-emerald-300">{activePatient.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Portal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-teal-600" />
              Digital Prescriptions ({emr?.prescriptions?.length || 0})
            </h3>
          </div>

          {emr?.prescriptions?.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No prescriptions on record.</p>
          ) : (
            <div className="space-y-3">
              {emr?.prescriptions?.map((rx: any) => (
                <div key={rx.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-teal-600">{rx.prescription_number}</span>
                    <span className="text-slate-400">{rx.created_at?.split('T')[0]}</span>
                  </div>
                  <div className="space-y-1">
                    {rx.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-lg">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{it.medicine_name} ({it.dosage})</span>
                        <span className="text-teal-600 font-bold">{it.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Reports Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <FlaskConical className="w-4 h-4 mr-1.5 text-blue-600" />
              Diagnostic Lab & Radiology Reports ({emr?.lab_orders?.length || 0})
            </h3>
          </div>

          {emr?.lab_orders?.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No diagnostic reports on record.</p>
          ) : (
            <div className="space-y-3">
              {emr?.lab_orders?.map((lab: any) => (
                <div key={lab.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono font-bold">{lab.order_number}</span>
                    <Badge variant={lab.status === 'Approved' ? 'emerald' : 'amber'}>{lab.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    {lab.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-lg">
                        <span className="font-semibold">{it.test_name}</span>
                        <span className={it.is_abnormal ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
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
      </div>

      {/* Hospital Invoices & Payment Receipts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Billing & Invoices History ({emr?.invoices?.length || 0})
          </h2>
        </div>

        {emr?.invoices?.length === 0 ? (
          <p className="text-xs text-slate-400 p-6 text-center">No invoices issued for this patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Bill Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 font-mono">Total (₹)</th>
                  <th className="py-3 px-4 font-mono">Paid (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {emr?.invoices?.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{inv.invoice_number}</td>
                    <td className="py-3 px-4">{inv.invoice_type}</td>
                    <td className="py-3 px-4 text-slate-500">{inv.created_at?.split('T')[0]}</td>
                    <td className="py-3 px-4 font-mono font-bold">₹{Number(inv.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">₹{Number(inv.paid_amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={inv.status === 'Paid' ? 'emerald' : 'amber'}>{inv.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 text-slate-500 hover:text-slate-700"
                        title="Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
