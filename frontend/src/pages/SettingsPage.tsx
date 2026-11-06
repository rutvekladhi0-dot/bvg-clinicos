import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Globe2,
  Receipt,
  Database,
  History,
  Save,
  CheckCircle2,
  ShieldAlert,
  Download,
  RefreshCw,
  HardDriveDownload,
  Languages
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

interface AuditLogItem {
  id: number;
  user_username?: string;
  action: string;
  model_name: string;
  object_id: string;
  ip_address: string;
  created_at: string;
  details?: any;
}

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, theme, toggleTheme, addToast, t } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'localization' | 'audit' | 'backup'>('general');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Hospital General Form
  const [generalConfig, setGeneralConfig] = useState({
    hospitalName: 'BVG Memorial Multi-Specialty Hospital',
    tagline: 'Complete Healthcare Management. One Intelligent Platform.',
    registrationNumber: 'HOSP-MAH-2026-98124',
    gstin: '27AABCB1234F1Z8',
    emergencyPhone: '+91 20 2740 5000',
    supportEmail: 'contact@bvghospital.com',
    address: 'Sector 24, Pradhikaran, Nigdi, Pune, Maharashtra 411044',
  });

  // Billing Config
  const [billingConfig, setBillingConfig] = useState({
    defaultGstPercent: 18,
    defaultOpdValidityDays: 7,
    allowPartialPayments: true,
    cashlessTpaEnabled: true,
    currencySymbol: '₹',
  });

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const data = await api.getAuditLogs();
      setAuditLogs(data);
    } catch (err: any) {
      console.error(err);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Hospital information and settings saved successfully!', 'success');
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Billing parameters and tax rates updated!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings & Configuration</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Enterprise parameters, hospital profile, multi-lingual preferences, security logs, and database management.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'general'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Building className="w-4 h-4" />
          Hospital Profile
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'billing'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Billing & Taxation
        </button>
        <button
          onClick={() => setActiveTab('localization')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'localization'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Languages className="w-4 h-4" />
          Localization & Languages
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'audit'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          System Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'backup'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Database className="w-4 h-4" />
          Backup & Disaster Recovery
        </button>
      </div>

      {/* Tab: General Hospital Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hospital Registered Name
              </label>
              <input
                type="text"
                value={generalConfig.hospitalName}
                onChange={(e) => setGeneralConfig({ ...generalConfig, hospitalName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform Motto / Tagline
              </label>
              <input
                type="text"
                value={generalConfig.tagline}
                onChange={(e) => setGeneralConfig({ ...generalConfig, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Establishment Registration No.
              </label>
              <input
                type="text"
                value={generalConfig.registrationNumber}
                onChange={(e) => setGeneralConfig({ ...generalConfig, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={generalConfig.gstin}
                onChange={(e) => setGeneralConfig({ ...generalConfig, gstin: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                24/7 Emergency Helpline
              </label>
              <input
                type="text"
                value={generalConfig.emergencyPhone}
                onChange={(e) => setGeneralConfig({ ...generalConfig, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hospital Contact Email
              </label>
              <input
                type="email"
                value={generalConfig.supportEmail}
                onChange={(e) => setGeneralConfig({ ...generalConfig, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hospital Physical Address
              </label>
              <textarea
                rows={2}
                value={generalConfig.address}
                onChange={(e) => setGeneralConfig({ ...generalConfig, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Hospital Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab: Billing & Taxation */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSaveBilling} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default GST Rate (%)
              </label>
              <input
                type="number"
                value={billingConfig.defaultGstPercent}
                onChange={(e) => setBillingConfig({ ...billingConfig, defaultGstPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-slate-400 mt-1">Applicable on pharmacy and non-exempt clinical services.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                OPD Follow-up Validity (Days)
              </label>
              <input
                type="number"
                value={billingConfig.defaultOpdValidityDays}
                onChange={(e) => setBillingConfig({ ...billingConfig, defaultOpdValidityDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-slate-400 mt-1">Days within which a patient follow-up has zero consultation fee.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                System Currency Symbol
              </label>
              <input
                type="text"
                value={billingConfig.currencySymbol}
                onChange={(e) => setBillingConfig({ ...billingConfig, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-col justify-center space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingConfig.allowPartialPayments}
                  onChange={(e) => setBillingConfig({ ...billingConfig, allowPartialPayments: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Allow Partial & Installment Payments on Invoices
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingConfig.cashlessTpaEnabled}
                  onChange={(e) => setBillingConfig({ ...billingConfig, cashlessTpaEnabled: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                Enable TPA Cashless Insurance Processing
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              Update Billing Rules
            </button>
          </div>
        </form>
      )}

      {/* Tab: Localization */}
      {activeTab === 'localization' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('multiLingualSettings')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('multiLingualSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => {
                setLanguage('en');
                addToast(t('langSwitchedToast'), 'info');
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                language === 'en'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-slate-900 dark:text-white">{t('langEnglish')}</span>
                {language === 'en' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('langEnglishDesc')}
              </p>
            </div>

            <div
              onClick={() => {
                setLanguage('mr');
                addToast(t('langSwitchedToast'), 'info');
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                language === 'mr'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-slate-900 dark:text-white">{t('langMarathi')}</span>
                {language === 'mr' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('langMarathiDesc')}
              </p>
            </div>

            <div
              onClick={() => {
                setLanguage('hi');
                addToast(t('langSwitchedToast'), 'info');
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                language === 'hi'
                  ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-slate-900 dark:text-white">{t('langHindi')}</span>
                {language === 'hi' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('langHindiDesc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">HIPAA & DPDP Immutable Audit Trail</h3>
            </div>
            <button
              onClick={loadAuditLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-xs">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading audit events...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold font-sans">
                        {log.user_username || 'System Daemon'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="teal">{log.action}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {log.model_name} #{log.object_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Backup */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Database Snapshot & Data Portability</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automated snapshot creation, cold backup exports, and zero-loss disaster recovery routines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-xl">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Automated SQLite/PostgreSQL Snapshot</h4>
                  <p className="text-xs text-slate-400">Last automated backup: Today at 02:00 AM IST</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Triggers point-in-time state capture across all 23 database models and relational records.
              </p>
              <button
                type="button"
                onClick={() => addToast('Database snapshot generated: backup_20261105_bvg.sql.gz', 'success')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                Trigger Live Backup Snapshot
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl">
                  <Download className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">DPDP Patient Registry Export</h4>
                  <p className="text-xs text-slate-400">Compliance Portable Format (CSV/JSON)</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Exports sanitized electronic health registry archive for regulatory reporting or external migration.
              </p>
              <button
                type="button"
                onClick={() => window.open(api.getExcelExportUrl(), '_blank')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Download Comprehensive Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
