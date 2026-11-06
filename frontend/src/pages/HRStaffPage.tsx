import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import {
  UserCog, Users, Calendar, CheckCircle2, XCircle,
  FileText, DollarSign, Clock, ShieldCheck, Search,
  Filter, ArrowUpDown, Plus, Phone, Mail, Award,
  Building, UserCheck, Stethoscope, User, LayoutGrid, List
} from 'lucide-react';

export interface UnifiedStaff {
  id: number;
  userId?: number;
  employee_id: string;
  full_name: string;
  role: string;
  department_name: string;
  designation: string;
  qualification: string;
  phone: string;
  email: string;
  is_active: boolean;
  joining_date: string;
  salary: number;
  emergency_contact?: string;
  avatar_url?: string;
}

export const HRStaffPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [staff, setStaff] = useState<UnifiedStaff[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'directory' | 'leaves' | 'payroll'>('directory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'dept' | 'date' | 'role'>('name');

  // Modals
  const [selectedStaffMember, setSelectedStaffMember] = useState<UnifiedStaff | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    username: '',
    password: 'Password@123',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'NURSE',
    department_name: 'Nursing & Patient Care',
    designation: 'Staff Registered Nurse',
    qualification: 'B.Sc Nursing / GNM',
    joining_date: new Date().toISOString().substring(0, 10),
    basic_salary: 38000,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sList, lList, pList, uList, dList] = await Promise.all([
        api.getStaffProfiles().catch(() => []),
        api.getLeaveRequests().catch(() => []),
        api.getPayrolls().catch(() => []),
        api.getUsers().catch(() => []),
        api.getDoctors(`branch=${branchId}`).catch(() => []),
      ]);

      setLeaves(lList);
      setPayrolls(pList);

      // Map users and enrich with staff profile / doctor profile
      const staffMap = new Map<number, any>();
      (sList || []).forEach((sp: any) => {
        const uId = typeof sp.user === 'object' ? sp.user?.id : sp.user;
        if (uId) staffMap.set(uId, sp);
      });

      const doctorMap = new Map<number, any>();
      (dList || []).forEach((doc: any) => {
        const uId = typeof doc.user === 'object' ? doc.user?.id : doc.user;
        if (uId) doctorMap.set(uId, doc);
      });

      // Filter out PATIENT users and build unified list
      const staffMembers: UnifiedStaff[] = (uList || [])
        .filter((u: any) => u.role !== 'PATIENT')
        .map((u: any) => {
          const sp = staffMap.get(u.id);
          const doc = doctorMap.get(u.id);

          const empId = sp?.employee_id || (doc ? `DOC-${doc.id.toString().padStart(4, '0')}` : `EMP-${u.id.toString().padStart(4, '0')}`);
          const designation = sp?.designation || (doc ? `Dr. Specialist (${doc.specialization || 'Clinical'})` : u.role.replace(/_/g, ' '));
          const qualification = doc?.qualification || (doc?.specialization ? `MD / MS (${doc.specialization})` : 'Certified Healthcare Specialist');
          const dept = u.department_name || sp?.department_name || doc?.department_name || getRoleDepartment(u.role);

          return {
            id: sp?.id || u.id,
            userId: u.id,
            employee_id: empId,
            full_name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            role: u.role,
            department_name: dept,
            designation,
            qualification,
            phone: u.phone || sp?.emergency_contact || '+91 98230 12345',
            email: u.email || `${u.username}@bvgclinicos.com`,
            is_active: u.is_active !== false,
            joining_date: sp?.joining_date || (u.date_joined ? u.date_joined.substring(0, 10) : '2024-01-15'),
            salary: Number(sp?.basic_salary || doc?.consultation_fee ? (doc.consultation_fee * 60) : 45000),
            emergency_contact: sp?.emergency_contact || '+91 98230 99999',
            avatar_url: u.avatar_url,
          };
        });

      // Also ensure any staff profiles that were not matched to users are included
      (sList || []).forEach((sp: any) => {
        const alreadyExists = staffMembers.some(sm => sm.employee_id === sp.employee_id);
        if (!alreadyExists) {
          staffMembers.push({
            id: sp.id,
            userId: typeof sp.user === 'object' ? sp.user?.id : sp.user,
            employee_id: sp.employee_id || `EMP-${sp.id}`,
            full_name: sp.full_name || sp.user_details?.full_name || `Staff ${sp.employee_id}`,
            role: sp.user_details?.role || 'NURSE',
            department_name: sp.department_name || 'General Health',
            designation: sp.designation || 'Healthcare Professional',
            qualification: 'Certified Specialist',
            phone: sp.emergency_contact || '+91 98230 12345',
            email: sp.user_details?.email || 'staff@bvgclinicos.com',
            is_active: true,
            joining_date: sp.joining_date || '2024-01-15',
            salary: Number(sp.basic_salary || 35000),
            emergency_contact: sp.emergency_contact,
          });
        }
      });

      // Ensure any Doctors without matching users are also included
      (dList || []).forEach((doc: any) => {
        const alreadyExists = staffMembers.some(sm => sm.full_name.toLowerCase().includes(doc.full_name.toLowerCase()));
        if (!alreadyExists) {
          staffMembers.push({
            id: doc.id + 1000,
            userId: typeof doc.user === 'object' ? doc.user?.id : doc.user,
            employee_id: `DOC-${doc.id.toString().padStart(4, '0')}`,
            full_name: doc.full_name.startsWith('Dr.') ? doc.full_name : `Dr. ${doc.full_name}`,
            role: 'DOCTOR',
            department_name: doc.department_name || 'Clinical Care',
            designation: `Consultant (${doc.specialization || 'General'})`,
            qualification: doc.qualification || 'MBBS, MD',
            phone: doc.user_details?.phone || '+91 98230 44556',
            email: doc.user_details?.email || `dr.${doc.full_name.replace(/\s+/g, '').toLowerCase()}@bvgclinicos.com`,
            is_active: doc.is_active !== false,
            joining_date: '2023-08-10',
            salary: 120000,
            emergency_contact: '+91 98230 88888',
          });
        }
      });

      setStaff(staffMembers);
    } catch (err) {
      console.error('Error fetching HR data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const getRoleDepartment = (role: string) => {
    switch (role) {
      case 'DOCTOR': return 'Medical Consultations & OPD';
      case 'NURSE': return 'Inpatient Nursing & Triage';
      case 'RECEPTIONIST': return 'Front Desk & Patient Services';
      case 'PHARMACIST': return 'Pharmacy & Drug Dispensing';
      case 'LAB_TECHNICIAN': return 'Pathology & Diagnostic Lab';
      case 'RADIOLOGIST': return 'Radiology & Medical Imaging';
      case 'ACCOUNTANT': return 'Finance, Billing & Accounts';
      case 'HR_MANAGER': return 'Human Resources & Personnel';
      case 'OT_STAFF': return 'Operation Theatre & Anaesthesia';
      case 'BRANCH_ADMIN': return 'Hospital Administration';
      case 'SUPER_ADMIN': return 'Executive Leadership';
      default: return 'General Healthcare';
    }
  };

  const handleApproveLeave = async (id: number) => {
    try {
      await api.approveLeaveRequest(id);
      showToast('Leave request approved by HR manager', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.first_name || !newStaffForm.username) {
      showToast('Please enter full name and login username', 'warning');
      return;
    }

    try {
      // 1. Create User
      const userRes = await api.createUser({
        username: newStaffForm.username.toLowerCase().trim(),
        password: newStaffForm.password,
        first_name: newStaffForm.first_name,
        last_name: newStaffForm.last_name,
        email: newStaffForm.email || `${newStaffForm.username}@bvgclinicos.com`,
        phone: newStaffForm.phone || '+91 98230 00000',
        role: newStaffForm.role,
        branch: branchId,
        is_active: true,
      });

      // 2. Create Staff Profile
      const empId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      await api.createStaffProfile({
        user: userRes.id,
        branch: branchId,
        employee_id: empId,
        designation: newStaffForm.designation,
        joining_date: newStaffForm.joining_date,
        basic_salary: Number(newStaffForm.basic_salary),
        emergency_contact: newStaffForm.phone,
      });

      showToast(`Staff member ${newStaffForm.first_name} registered successfully!`, 'success');
      setShowAddModal(false);
      setNewStaffForm({
        username: '',
        password: 'Password@123',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'NURSE',
        department_name: 'Nursing & Patient Care',
        designation: 'Staff Registered Nurse',
        qualification: 'B.Sc Nursing / GNM',
        joining_date: new Date().toISOString().substring(0, 10),
        basic_salary: 38000,
      });
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Staff registration failed', 'error');
    }
  };

  // Filtered & Sorted Staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.full_name.toLowerCase().includes(q) ||
        s.employee_id.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.department_name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'ALL' || s.department_name.toLowerCase().includes(selectedDept.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || s.role === selectedRole;

      return matchesSearch && matchesDept && matchesRole;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'dept') return a.department_name.localeCompare(b.department_name);
      if (sortBy === 'date') return new Date(b.joining_date).getTime() - new Date(a.joining_date).getTime();
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      return 0;
    });
  }, [staff, searchQuery, selectedDept, selectedRole, sortBy]);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.department_name) set.add(s.department_name);
    });
    return Array.from(set);
  }, [staff]);

  const getRoleBadgeVariant = (role: string): 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'slate' | 'teal' => {
    switch (role) {
      case 'DOCTOR': return 'teal';
      case 'NURSE': return 'emerald';
      case 'RECEPTIONIST': return 'blue';
      case 'PHARMACIST': return 'amber';
      case 'LAB_TECHNICIAN': return 'purple';
      case 'RADIOLOGIST': return 'purple';
      case 'ACCOUNTANT': return 'emerald';
      case 'HR_MANAGER': return 'rose';
      case 'OT_STAFF': return 'amber';
      default: return 'slate';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('hrStaff')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official hospital staff directory, employee credential profiles, leave workflows & monthly payroll disbursement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setTab('directory')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            tab === 'directory'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 mr-2" />
          Staff Directory ({staff.length})
        </button>
        <button
          onClick={() => setTab('leaves')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            tab === 'leaves'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 mr-2" />
          Leave Requests ({leaves.length})
        </button>
        <button
          onClick={() => setTab('payroll')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
            tab === 'payroll'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 mr-2" />
          Payroll Slips ({payrolls.length})
        </button>
      </div>

      {tab === 'directory' && (
        <div className="space-y-4">
          {/* Controls: Search, Filters, Sort & View Mode */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, employee ID, role, department or phone..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="LAB_TECHNICIAN">Lab Technician</option>
                <option value="RADIOLOGIST">Radiologist</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="OT_STAFF">OT Staff</option>
                <option value="BRANCH_ADMIN">Branch Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="dept">Sort: Department</option>
                <option value="date">Sort: Joining Date</option>
                <option value="role">Sort: Role</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-xs text-teal-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-xs text-teal-600' : 'text-slate-400'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Directory Content */}
          {filteredStaff.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Staff Found"
              description="No staff members matched your search criteria. Try modifying your filters."
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((s) => (
                <div
                  key={`${s.employee_id}-${s.id}`}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-400/60 dark:hover:border-teal-600/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-sm shrink-0 border border-teal-200/40 dark:border-teal-800/40">
                          {s.full_name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {s.full_name}
                          </h3>
                          <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{s.designation}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {s.employee_id}</span>
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(s.role)}>{s.role.replace(/_/g, ' ')}</Badge>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Department:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{s.department_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Contact:</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">{s.phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Qualification:</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{s.qualification}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Joined Date:</span>
                        <span className="font-mono text-slate-500">{s.joining_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      Active Staff
                    </span>
                    <button
                      onClick={() => setSelectedStaffMember(s)}
                      className="px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation & Credentials</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Joining Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStaff.map((s) => (
                      <tr key={`tbl-${s.employee_id}-${s.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{s.full_name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {s.employee_id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={getRoleBadgeVariant(s.role)}>{s.role.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">{s.department_name}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{s.designation}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.qualification}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          <div>{s.phone}</div>
                          <div className="text-[10px] text-slate-400">{s.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{s.joining_date}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedStaffMember(s)}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'leaves' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {leaves.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No pending leave applications.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{l.staff_name}</td>
                      <td className="py-3.5 px-4">{l.leave_type}</td>
                      <td className="py-3.5 px-4 font-mono">{l.start_date} to {l.end_date}</td>
                      <td className="py-3.5 px-4 font-bold">{l.days_count} d</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{l.reason}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={l.status === 'Approved' ? 'emerald' : 'amber'}>{l.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {l.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveLeave(l.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Month / Year</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">HRA + Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payrolls.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {p.staff_name} <span className="block text-[10px] text-slate-400 font-normal">{p.designation}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{p.month}/{p.year}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">₹{Number(p.basic_salary).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono">₹{(Number(p.hra) + Number(p.allowances)).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">₹{Number(p.deductions).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-600">₹{Number(p.net_salary).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="emerald">{p.payment_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Member Profile Modal */}
      {selectedStaffMember && (
        <Modal
          isOpen={!!selectedStaffMember}
          onClose={() => setSelectedStaffMember(null)}
          title="Staff Profile & Credentials"
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl">
                {selectedStaffMember.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {selectedStaffMember.full_name}
                </h3>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">{selectedStaffMember.designation}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(selectedStaffMember.role)}>{selectedStaffMember.role.replace(/_/g, ' ')}</Badge>
                  <span className="text-[11px] font-mono text-slate-400">ID: {selectedStaffMember.employee_id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Department</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedStaffMember.department_name}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Educational Qualification</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedStaffMember.qualification}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Phone Number</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedStaffMember.phone}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Official Email</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedStaffMember.email}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Joining Date</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedStaffMember.joining_date}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Emergency Contact</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedStaffMember.emergency_contact || '+91 98230 99999'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedStaffMember(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Staff Member Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Register New Hospital Staff Member"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={newStaffForm.first_name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patil"
                  value={newStaffForm.last_name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Login Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh_nurse"
                  value={newStaffForm.username}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Role *
                </label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setNewStaffForm({
                      ...newStaffForm,
                      role: r,
                      department_name: getRoleDepartment(r),
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="DOCTOR">Doctor</option>
                  <option value="NURSE">Nurse</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="RADIOLOGIST">Radiologist</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="OT_STAFF">OT Staff</option>
                  <option value="BRANCH_ADMIN">Branch Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newStaffForm.department_name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, department_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job Designation *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.designation}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98230 00000"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Basic Salary (₹)
                </label>
                <input
                  type="number"
                  value={newStaffForm.basic_salary}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, basic_salary: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save & Register Staff
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
