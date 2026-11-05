import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Bell, MessageSquare, Mail, Smartphone, Send,
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { t, showToast } = useAuth();
  const [logs, setLogs] = useState([
    {
      id: 1,
      channel: 'SMS',
      recipient: '+91 98220 99881 (Rajesh Kumar)',
      title: 'Appointment Reminder: Dr. Sharma today at 10:00 AM',
      status: 'Delivered',
      time: '09:00 AM',
    },
    {
      id: 2,
      channel: 'WhatsApp',
      recipient: '+91 98221 88772 (Sunita Patil)',
      title: 'Verified Diagnostic Lab Report is ready to download',
      status: 'Delivered',
      time: '11:15 AM',
    },
    {
      id: 3,
      channel: 'Email',
      recipient: 'suresh.deshmukh@bvgclinicos.com',
      title: 'Monthly Hospital Executive Summary Report Generated',
      status: 'Delivered',
      time: '08:00 AM',
    },
    {
      id: 4,
      channel: 'SMS',
      recipient: '+91 98227 22118 (Suresh More)',
      title: 'Emergency Triage Admission Confirmed - Bed ICU-01',
      status: 'Delivered',
      time: '12:45 PM',
    },
  ]);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [channel, setChannel] = useState('SMS & WhatsApp');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setLogs([
      {
        id: Date.now(),
        channel,
        recipient: 'All Hospital Duty Consultants & Staff',
        title: broadcastMessage,
        status: 'Delivered',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...logs,
    ]);

    showToast(`Broadcast notification dispatched via ${channel}!`, 'success');
    setShowBroadcastModal(false);
    setBroadcastMessage('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('notifications')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Omni-channel patient reminders (SMS, WhatsApp, Email), stock alerts & emergency hospital broadcasts
          </p>
        </div>
        <button
          onClick={() => setShowBroadcastModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Hospital Alert
        </button>
      </div>

      {/* Gateway Channel Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">SMS Gateway</p>
              <p className="text-xs text-slate-400">DLT Template Verified</p>
            </div>
          </div>
          <Badge variant="emerald">Online</Badge>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">WhatsApp Business</p>
              <p className="text-xs text-slate-400">Cloud API Connected</p>
            </div>
          </div>
          <Badge variant="emerald">Online</Badge>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">SMTP Email Gateway</p>
              <p className="text-xs text-slate-400">Encrypted TLS Relay</p>
            </div>
          </div>
          <Badge variant="emerald">Online</Badge>
        </div>
      </div>

      {/* Dispatched Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Dispatch Audit Log & Notification Activity ({logs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Message Summary</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-teal-700 dark:text-teal-400 font-mono">
                    {log.channel}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {log.recipient}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {log.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {log.time}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="emerald">{log.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Modal */}
      <Modal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        title="Send Emergency / Operational Alert"
        subtitle="Broadcast announcement to medical staff, consultants and duty nurses"
        maxWidth="md"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Broadcast Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="SMS & WhatsApp">SMS & WhatsApp Urgent Alert</option>
              <option value="SMS">SMS Gateway Only</option>
              <option value="WhatsApp">WhatsApp Business Group</option>
              <option value="Email">Staff Broadcast Email</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alert Message *
            </label>
            <textarea
              required
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Critical Trauma Code Red: Attending orthopedic and vascular team to report to OT Suite 1 immediately."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowBroadcastModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Transmit Broadcast
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
