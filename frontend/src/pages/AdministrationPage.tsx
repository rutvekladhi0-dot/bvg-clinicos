import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Building2,
  Mail,
  User as UserIcon,
  Eye,
  KeyRound,
  FileCheck2,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

interface UserItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  branch: number | null;
  branch_name?: string;
  is_active: boolean;
  phone?: string;
}

const ROLES_LIST = [
  { key: 'SUPER_ADMIN', name: 'Super Administrator', color: 'red' },
  { key: 'HOSPITAL_ADMIN', name: 'Hospital Admin', color: 'purple' },
  { key: 'BRANCH_ADMIN', name: 'Branch Admin', color: 'indigo' },
  { key: 'DOCTOR', name: 'Doctor / Physician', color: 'teal' },
  { key: 'RECEPTIONIST', name: 'Receptionist / Front Desk', color: 'blue' },
  { key: 'NURSE', name: 'Nursing Staff', color: 'cyan' },
  { key: 'PHARMACIST', name: 'Pharmacist', color: 'emerald' },
  { key: 'LAB_TECHNICIAN', name: 'Lab Technician', color: 'amber' },
  { key: 'RADIOLOGIST', name: 'Radiologist', color: 'orange' },
  { key: 'ACCOUNTANT', name: 'Financial Accountant', color: 'green' },
  { key: 'HR_MANAGER', name: 'HR Manager', color: 'rose' },
  { key: 'OT_STAFF', name: 'OT / Surgical Staff', color: 'violet' },
  { key: 'PATIENT', name: 'Patient Portal', color: 'slate' },
];

const PERMISSION_MODULES = [
  { name: 'Patient EMR & Registration', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
  { name: 'Appointments & Scheduling', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
  { name: 'OPD Clinical Consultations & Rx', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
  { name: 'Inpatient IPD & Bed Allocation', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE'] },
  { name: 'Emergency & ICU Triage', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] },
  { name: 'Operation Theatre & Surgery', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'OT_STAFF'] },
  { name: 'Pharmacy POS & Inventory', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'] },
  { name: 'Laboratory Orders & Approval', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'] },
  { name: 'Radiology PACS & Reports', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RADIOLOGIST'] },
  { name: 'Billing, Invoicing & Payments', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
  { name: 'Insurance TPA & Claims', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'] },
  { name: 'Blood Bank Transfusions', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE'] },
  { name: 'HR, Staff & Payroll', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'HR_MANAGER'] },
  { name: 'Financial Accounts & Ledgers', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'] },
  { name: 'Telemedicine WebRTC', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PATIENT'] },
  { name: 'AI Clinical Insights & NLP', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'] },
  { name: 'System Settings & Audit Logs', roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
];

export const AdministrationPage: React.FC = () => {
  const { addToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'DOCTOR',
    branch: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, branchData] = await Promise.all([
        api.getUsers(),
        api.getBranches(),
      ]);
      setUsers(userData);
      setBranches(branchData);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to load user administration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      addToast('Please enter all required fields', 'warning');
      return;
    }

    try {
      await api.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        branch: formData.branch ? Number(formData.branch) : null,
      });

      addToast(`User ${formData.username} created successfully!`, 'success');
      setIsAddUserOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'DOCTOR',
        branch: '',
      });
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to create user', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Administration & RBAC</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise role-based access control, 13 healthcare roles, user provisioning, and HIPAA/DPDP governance.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'users'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff & User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'roles'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          13 Roles & Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'security'
              ? 'border-teal-600 text-teal-700 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Lock className="w-4 h-4" />
          Compliance & Security Policy
        </button>
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by username, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Roles</option>
              {ROLES_LIST.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No users match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs uppercase">
                              {u.first_name ? u.first_name[0] : u.username[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{u.email || `@${u.username}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="teal">{u.role.replace('_', ' ')}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.branch_name || 'All Branches (Enterprise)'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Lock className="w-3 h-3 text-teal-600" />
                            2FA / JWT Ready
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Roles Matrix */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Healthcare Role Access Control Matrix</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Deterministic privilege matrix across 17 clinical and administrative hospital subsystems.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Subsystem / Module</th>
                  {ROLES_LIST.map((r) => (
                    <th key={r.key} className="py-3 px-2 text-center whitespace-nowrap min-w-[70px]">
                      {r.key.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {PERMISSION_MODULES.map((mod, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {mod.name}
                    </td>
                    {ROLES_LIST.map((r) => {
                      const hasAccess = r.key === 'SUPER_ADMIN' || mod.roles.includes(r.key);
                      return (
                        <td key={r.key} className="py-2.5 px-2 text-center">
                          {hasAccess ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Compliance & Security Policy */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-xl">
                <FileCheck2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">DPDP Act (India 2023) Compliant</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Digital Personal Data Protection Architecture</p>
              </div>
            </div>
            <ul className="text-sm space-y-2.5 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Consent tracking on patient record access and automated audit trail generation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Right to Erasure & Data Portability exports in JSON and PDF formats.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Data fiduciary accountability with designated Data Protection Officer (DPO) logging.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl">
                <Lock className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">HIPAA & Security Standards</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Health Insurance Portability & Accountability</p>
              </div>
            </div>
            <ul className="text-sm space-y-2.5 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>AES-256 equivalent database at-rest storage and TLS 1.3 transit encryption.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Zero Trust Multi-Factor Authentication & Automatic 15-minute Idle Logouts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Strict multi-tenant branch partitioning ensuring data isolation across hospital campuses.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Provision New Hospital Staff / User"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                placeholder="Dr. Rajesh"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
                placeholder="Patil"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              placeholder="rajesh.patil"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              placeholder="r.patil@bvghospital.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Temporary Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Assignment *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              >
                {ROLES_LIST.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch Location
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-semibold transition-all"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AdministrationPage;
