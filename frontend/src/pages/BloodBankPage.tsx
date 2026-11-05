import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BloodUnit } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Droplets, UserPlus, Heart, CheckCircle2, AlertTriangle,
  RefreshCw, ShieldCheck
} from 'lucide-react';

export const BloodBankPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [requests, setRequests] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uList, sumData, reqList, dList] = await Promise.all([
        api.getBloodUnits(),
        api.getBloodSummary(),
        api.getBloodRequests(),
        api.getBloodDonors(),
      ]);
      setUnits(uList);
      setSummary(sumData);
      setRequests(reqList);
      setDonors(dList);
    } catch (err) {
      console.error('Error fetching blood bank data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleCrossMatch = async (id: number) => {
    try {
      await api.crossMatchBlood(id);
      showToast('Cross-matching completed! Unit compatible & reserved.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleIssue = async (id: number) => {
    try {
      await api.issueBlood(id);
      showToast('Blood unit issued to Operating Room / ICU!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('bloodBank')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ABO/Rh inventory management, donor screening, cross-matching & transfusion safety
          </p>
        </div>
      </div>

      {/* Blood Group Inventory Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {groups.map((g) => {
          const data = summary[g] || { available: 0, reserved: 0, status: 'Moderate' };
          const isCritical = data.available < 2;
          return (
            <div
              key={g}
              className={`p-4 rounded-2xl border text-center transition-all ${
                isCritical
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-black text-sm flex items-center justify-center mx-auto mb-2">
                {g}
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {data.available}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Units Available</p>
              <span className={`text-[9px] font-bold mt-1 inline-block ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                {data.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Blood Requests Worklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Blood Transfusion Requests ({requests.length})
            </h2>
            <p className="text-xs text-slate-400">Cross-match verification & unit dispatching</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="No Pending Blood Requests"
            description="No active transfusion requisitions from ICU or OT."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Blood Group & Component</th>
                  <th className="py-3 px-4">Units Needed</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Cross-Match</th>
                  <th className="py-3 px-4 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                      {req.request_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {req.patient_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-rose-600 mr-2">{req.blood_group}</span>
                      <span className="text-slate-500">{req.component_type}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      {req.units_requested} Unit(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={req.priority === 'Emergency' ? 'rose' : 'amber'}>
                        {req.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {req.cross_match_result}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {req.status === 'Requested' && (
                        <button
                          onClick={() => handleCrossMatch(req.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                        >
                          Run Cross-Match
                        </button>
                      )}
                      {req.status === 'Cross-Matched' && (
                        <button
                          onClick={() => handleIssue(req.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                        >
                          Issue Unit
                        </button>
                      )}
                      {req.status === 'Issued' && (
                        <span className="text-emerald-600 font-bold text-[11px]">Issued</span>
                      )}
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
