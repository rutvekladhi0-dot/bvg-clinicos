import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QueueToken } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Clock, Volume2, UserCheck, CheckCircle, AlertTriangle,
  Play, Users, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';

export const QueuePage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [liveData, setLiveData] = useState<{
    now_serving: QueueToken | null;
    waiting_list: QueueToken[];
    waiting_count: number;
    completed_count: number;
    total_tokens: number;
    average_wait_minutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLiveQueue = async () => {
    try {
      const data = await api.getLiveQueueDisplay(branchId);
      setLiveData(data);
    } catch (err) {
      console.error('Error fetching live queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveQueue();
    // Auto refresh every 5 seconds for live queue display
    const interval = setInterval(fetchLiveQueue, 5000);
    return () => clearInterval(interval);
  }, [branchId]);

  const handleCallToken = async (tokenId: number) => {
    try {
      const updated = await api.callQueueToken(tokenId);
      const docName = updated.doctor_name || 'Consultant Doctor';
      const room = updated.room_number || 'OPD-101';
      const pat = updated.patient_name || 'Patient';

      const payload = {
        id: Date.now(),
        tokenNumber: updated.token_number,
        patientName: pat,
        doctorName: docName,
        roomNumber: room,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      try {
        const bc = new BroadcastChannel('bvg_buzzer_channel');
        bc.postMessage(payload);
        bc.close();
      } catch (e) {}
      localStorage.setItem('bvg_buzzer_event', JSON.stringify(payload));

      showToast(`Token ${updated.token_number} is now being called! Reception buzzer chime triggered.`, 'success');
      fetchLiveQueue();
    } catch (err: any) {
      showToast(err.message || 'Call failed', 'error');
    }
  };

  const handleCompleteToken = async (tokenId: number) => {
    try {
      await api.completeQueueToken(tokenId);
      showToast('Consultation marked completed', 'info');
      fetchLiveQueue();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('queue')}
            </h1>
            <span className="flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
              ● Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Doctor consultation tokens, priority scheduling & OPD waiting room monitor
          </p>
        </div>
      </div>

      {/* Now Serving Big Display Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F766E] to-[#115E59] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-teal-300 animate-bounce" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-teal-200">
                Now Serving Display
              </span>
            </div>
            <div className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono mt-2">
              {liveData?.now_serving?.token_number || 'NONE'}
            </div>
            <p className="text-xs text-teal-100 font-medium">
              Consultation Room: <strong className="text-white">{liveData?.now_serving?.room_number || 'OPD-101'}</strong>
            </p>
          </div>

          <div className="space-y-2 border-y md:border-y-0 md:border-x border-teal-600/60 py-4 md:py-0 md:px-6">
            <span className="text-xs text-teal-200 uppercase font-bold tracking-wider">Patient Details</span>
            <p className="text-xl font-bold text-white">
              {liveData?.now_serving?.patient_name || 'No Patient Called Yet'}
            </p>
            <p className="text-xs text-teal-100">
              Doctor: <span className="font-semibold">{liveData?.now_serving?.doctor_name || 'Dr. Rajesh Sharma'}</span>
            </p>
            {liveData?.now_serving && (
              <Badge variant="emerald">In Consultation</Badge>
            )}
          </div>

          <div className="flex flex-col justify-center space-y-3">
            <div className="flex justify-between text-xs text-teal-100 border-b border-teal-600/50 pb-2">
              <span>Waiting Patients:</span>
              <strong className="text-white text-sm">{liveData?.waiting_count || 0}</strong>
            </div>
            <div className="flex justify-between text-xs text-teal-100 border-b border-teal-600/50 pb-2">
              <span>Avg Wait Time:</span>
              <strong className="text-white text-sm">~{liveData?.average_wait_minutes || 12} mins</strong>
            </div>
            {liveData?.now_serving && (
              <button
                onClick={() => handleCompleteToken(liveData.now_serving!.id)}
                className="w-full py-2.5 bg-white text-teal-900 font-bold text-xs rounded-xl hover:bg-teal-50 transition-colors shadow-md"
              >
                Mark Consultation Completed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Waiting Tokens Queue List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Live Waiting Queue ({liveData?.waiting_count || 0} Patients)
            </h2>
            <p className="text-xs text-slate-400">Tokens priority-ordered: Emergency &gt; Senior Citizens &gt; Pediatric &gt; Normal</p>
          </div>
          <button
            onClick={fetchLiveQueue}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 p-1.5"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading live tokens...</div>
        ) : !liveData?.waiting_list || liveData.waiting_list.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Queue Empty"
            description="All scheduled patients for this shift have been served or none are waiting."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {liveData.waiting_list.map((tok, idx) => (
              <div
                key={tok.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono font-black text-lg flex items-center justify-center shrink-0 border border-teal-200/60 dark:border-teal-800">
                    {tok.token_number}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {tok.patient_name}
                      </span>
                      <Badge
                        variant={
                          tok.priority === 'Emergency'
                            ? 'rose'
                            : tok.priority === 'Senior Citizen'
                            ? 'purple'
                            : tok.priority === 'Pediatric'
                            ? 'amber'
                            : 'slate'
                        }
                      >
                        {tok.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Doctor: {tok.doctor_name} ({tok.room_number || 'OPD-101'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className="text-xs text-slate-400 font-mono">
                    Est. wait: ~{tok.estimated_wait_minutes} min
                  </span>
                  <button
                    onClick={() => handleCallToken(tok.id)}
                    className="flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    {t('callNext')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
