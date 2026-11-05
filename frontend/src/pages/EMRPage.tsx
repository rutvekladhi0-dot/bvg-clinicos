import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Activity, Search, Calendar, FileText, FlaskConical,
  Scan, Heart, ShieldAlert, Bed, Stethoscope, Clock
} from 'lucide-react';

export const EMRPage: React.FC = () => {
  const { branchId, t } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [emrData, setEmrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      setLoading(true);
      try {
        const pList = await api.getPatients(`branch=${branchId}`);
        setPatients(pList);
        if (pList.length > 0) {
          setSelectedPatientId(String(pList[0].id));
          const data = await api.getPatientEMR(pList[0].id);
          setEmrData(data);
        }
      } catch (err) {
        console.error('Error fetching patients for EMR', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [branchId]);

  const handlePatientChange = async (pId: string) => {
    setSelectedPatientId(pId);
    setLoading(true);
    try {
      const data = await api.getPatientEMR(Number(pId));
      setEmrData(data);
    } catch (err) {
      console.error('Error loading EMR', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('emr')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized digital health timeline, diagnosis archives, laboratory integration & clinical notes
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Select Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
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

      {emrData && (
        <div className="space-y-6">
          {/* Patient Top Summary Banner */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-teal-600">{emrData.patient?.uhid}</span>
                <Badge variant="emerald">{emrData.patient?.status}</Badge>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {emrData.patient?.full_name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {emrData.patient?.gender} • Blood Group: <strong className="text-rose-600">{emrData.patient?.blood_group}</strong> • Phone: {emrData.patient?.phone}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900">
                <span className="text-[10px] text-rose-500 uppercase font-bold block">Allergies</span>
                <span className="font-bold text-rose-800 dark:text-rose-300">{emrData.patient?.allergies || 'Nil'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Chronic Conditions</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{emrData.patient?.chronic_conditions || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Chronological Medical Timeline */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-teal-600" />
              Complete Patient Medical Timeline & Audit Stream
            </h3>

            {emrData.timeline?.length === 0 ? (
              <p className="text-xs text-slate-400">No events logged in patient timeline yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-500/30">
                {emrData.timeline?.map((evt: any) => (
                  <div key={evt.id} className="relative">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-teal-100 dark:ring-teal-950" />
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{evt.title}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{evt.created_at?.split('T')[0]}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{evt.description}</p>
                      {evt.reference_id && (
                        <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold block pt-1">
                          Ref: {evt.reference_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
