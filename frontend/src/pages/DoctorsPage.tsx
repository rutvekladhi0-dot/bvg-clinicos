import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Doctor } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  UserCheck, Stethoscope, Clock, Award, Building2,
  DollarSign, CheckCircle2, XCircle, Search
} from 'lucide-react';

export const DoctorsPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctors(`branch=${branchId}`);
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [branchId]);

  const handleToggleAvailability = async (id: number) => {
    try {
      const res = await api.toggleDoctorAvailability(id);
      showToast(`Doctor availability updated: ${res.is_available ? 'Available' : 'On Leave'}`, 'info');
      fetchDoctors();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const filtered = doctors.filter((d) => {
    if (deptFilter === 'All') return true;
    return d.department_name === deptFilter;
  });

  const departments = ['All', ...new Set(doctors.map((d) => d.department_name).filter(Boolean))];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('doctors')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consultant roster, duty rosters, availability management & consultation fees
          </p>
        </div>
      </div>

      {/* Dept Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {departments.map((dept) => (
          <button
            key={dept as string}
            onClick={() => setDeptFilter(dept as string)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              deptFilter === dept
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading doctor profiles...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Doctors in this Department"
          description="Try selecting another department filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={doc.user_details?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.full_name}`}
                      alt={doc.full_name}
                      className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-slate-800 object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {doc.full_name}
                      </h3>
                      <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                        {doc.specialization}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {doc.department_name} • Room: {doc.room_number}
                      </p>
                    </div>
                  </div>

                  <Badge variant={doc.is_available ? 'emerald' : 'slate'}>
                    {doc.is_available ? 'Available' : 'Off Duty'}
                  </Badge>
                </div>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      Qualifications:
                    </span>
                    <span className="font-semibold">{doc.qualification}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-blue-500" />
                      Experience:
                    </span>
                    <span className="font-semibold">{doc.experience_years} Years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Consultation Fee:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{doc.consultation_fee}</span>
                  </div>
                </div>

                {doc.bio && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 italic">
                    "{doc.bio}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Lic: {doc.registration_council_number}
                </span>
                <button
                  onClick={() => handleToggleAvailability(doc.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    doc.is_available
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {doc.is_available ? 'Mark Unavailable' : 'Mark Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
