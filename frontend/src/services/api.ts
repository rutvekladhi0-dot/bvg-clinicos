const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://bvg-clinicos-api.onrender.com/api' : 'http://127.0.0.1:8000/api');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bvg_token');
  const branchId = localStorage.getItem('bvg_branch_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(branchId ? { 'X-Branch-ID': branchId } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.error || parsed.detail || JSON.stringify(parsed);
    } catch {
      // ignore json parse error
    }
    throw new Error(message);
  }

  // Handle empty or file responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    // If it's a DRF paginated list response, unwrap results array so frontend components receive the array directly
    if (
      data &&
      typeof data === 'object' &&
      'results' in data &&
      'count' in data &&
      'next' in data &&
      Array.isArray(data.results)
    ) {
      const list = data.results;
      (list as any).totalCount = data.count;
      (list as any).next = data.next;
      (list as any).previous = data.previous;
      return list as unknown as T;
    }
    return data;
  }
  return response as unknown as T;
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login/', { method: 'POST', body: JSON.stringify(data) }),
  register: async (data: any) => {
    try {
      return await request<any>('/auth/register/', { method: 'POST', body: JSON.stringify(data) });
    } catch (err: any) {
      // Robust permanent fallback to create-user if register route returns 404
      if (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) {
        return await request<any>('/users/create-user/', { method: 'POST', body: JSON.stringify(data) });
      }
      throw err;
    }
  },
  getMe: () => request<any>('/auth/me/'),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password/', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { email: string; otp: string; new_password: string }) => request<any>('/auth/reset-password/', { method: 'POST', body: JSON.stringify(data) }),

  // Global Search
  globalSearch: (q: string) => request<{ results: any[] }>(`/global-search/?q=${encodeURIComponent(q)}`),

  // Dashboard & Analytics
  getDashboardStats: (branchId?: number) => request<any>(`/dashboard/stats/${branchId ? `?branch=${branchId}` : ''}`),
  getAdvancedAnalytics: (branchId?: number) => request<any>(`/analytics/advanced/${branchId ? `?branch=${branchId}` : ''}`),
  getExcelExportUrl: () => `${API_BASE}/analytics/export/excel/`,
  getPdfExportUrl: () => `${API_BASE}/analytics/export/pdf/`,

  // Core Multi-Tenant
  getHospitals: () => request<any[]>('/hospitals/'),
  getBranches: () => request<any[]>('/branches/'),
  getDepartments: (branchId?: number) => request<any[]>(`/departments/${branchId ? `?branch=${branchId}` : ''}`),
  getUsers: () => request<any[]>('/users/'),
  createUser: (data: any) => request<any>('/users/create-user/', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: () => request<any[]>('/audit-logs/'),
  getSettings: () => request<any[]>('/settings/'),

  // Patients
  getPatients: (params: string = '') => request<any[]>(`/patients/${params ? `?${params}` : ''}`),
  getPatient: (id: number) => request<any>(`/patients/${id}/`),
  createPatient: (data: any) => request<any>('/patients/', { method: 'POST', body: JSON.stringify(data) }),
  getPatientTimeline: (id: number) => request<any[]>(`/patients/${id}/medical_timeline/`),
  getPatientEMR: (id: number) => request<any>(`/patients/${id}/complete_emr/`),

  // Doctors
  getDoctors: (params: string = '') => request<any[]>(`/doctors/${params ? `?${params}` : ''}`),
  getDoctor: (id: number) => request<any>(`/doctors/${id}/`),
  createDoctor: (data: any) => request<any>('/doctors/', { method: 'POST', body: JSON.stringify(data) }),
  toggleDoctorAvailability: (id: number) => request<any>(`/doctors/${id}/toggle-availability/`, { method: 'POST' }),

  // Appointments
  getAppointments: (params: string = '') => request<any[]>(`/appointments/${params ? `?${params}` : ''}`),
  createAppointment: (data: any) => request<any>('/appointments/', { method: 'POST', body: JSON.stringify(data) }),
  checkInAppointment: (id: number) => request<any>(`/appointments/${id}/check-in/`, { method: 'POST' }),
  cancelAppointment: (id: number, reason: string) => request<any>(`/appointments/${id}/cancel-appointment/`, { method: 'POST', body: JSON.stringify({ reason }) }),
  rescheduleAppointment: (id: number, date: string, time_slot: string) => request<any>(`/appointments/${id}/reschedule/`, { method: 'POST', body: JSON.stringify({ appointment_date: date, time_slot }) }),

  // Live Queues
  getQueueTokens: (params: string = '') => request<any[]>(`/queues/${params ? `?${params}` : ''}`),
  createQueueToken: (data: any) => request<any>('/queues/', { method: 'POST', body: JSON.stringify(data) }),
  getLiveQueueDisplay: (branchId?: number, doctorId?: number) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch', String(branchId));
    if (doctorId) params.append('doctor', String(doctorId));
    return request<any>(`/queues/live-display/?${params.toString()}`);
  },
  callQueueToken: (id: number) => request<any>(`/queues/${id}/call-token/`, { method: 'POST' }),
  completeQueueToken: (id: number) => request<any>(`/queues/${id}/complete-token/`, { method: 'POST' }),

  // Clinical & OPD
  getConsultations: (params: string = '') => request<any[]>(`/consultations/${params ? `?${params}` : ''}`),
  createConsultation: (data: any) => request<any>('/consultations/', { method: 'POST', body: JSON.stringify(data) }),
  getPrescriptions: (params: string = '') => request<any[]>(`/prescriptions/${params ? `?${params}` : ''}`),
  createPrescription: (data: any) => request<any>('/prescriptions/', { method: 'POST', body: JSON.stringify(data) }),

  // IPD & Beds
  getWards: () => request<any[]>('/wards/'),
  getBeds: (params: string = '') => request<any[]>(`/beds/${params ? `?${params}` : ''}`),
  createBed: (data: any) => request<any>('/beds/', { method: 'POST', body: JSON.stringify(data) }),
  getAdmissions: (params: string = '') => request<any[]>(`/admissions/${params ? `?${params}` : ''}`),
  createAdmission: (data: any) => request<any>('/admissions/', { method: 'POST', body: JSON.stringify(data) }),
  dischargePatient: (id: number, data: any) => request<any>(`/admissions/${id}/discharge/`, { method: 'POST', body: JSON.stringify(data) }),
  getNursingNotes: () => request<any[]>('/nursing-notes/'),
  createNursingNote: (data: any) => request<any>('/nursing-notes/', { method: 'POST', body: JSON.stringify(data) }),

  // Emergency & ICU
  getEmergencyCases: (params: string = '') => request<any[]>(`/emergency-cases/${params ? `?${params}` : ''}`),
  createEmergencyCase: (data: any) => request<any>('/emergency-cases/', { method: 'POST', body: JSON.stringify(data) }),
  logEmergencyVitals: (id: number, data: any) => request<any>(`/emergency-cases/${id}/log-vitals/`, { method: 'POST', body: JSON.stringify(data) }),

  // Operation Theatre
  getOTRooms: () => request<any[]>('/ot-rooms/'),
  createOTRoom: (data: any) => request<any>('/ot-rooms/', { method: 'POST', body: JSON.stringify(data) }),
  getSurgeries: (params: string = '') => request<any[]>(`/surgeries/${params ? `?${params}` : ''}`),
  createSurgery: (data: any) => request<any>('/surgeries/', { method: 'POST', body: JSON.stringify(data) }),
  getOTEquipment: () => request<any[]>('/ot-equipment/'),

  // Pharmacy
  getMedicines: (params: string = '') => request<any[]>(`/medicines/${params ? `?${params}` : ''}`),
  createMedicine: (data: any) => request<any>('/medicines/', { method: 'POST', body: JSON.stringify(data) }),
  getMedicineBatches: () => request<any[]>('/medicine-batches/'),
  getStockAlerts: () => request<any>('/medicine-batches/alerts/'),
  getMedicineAnalytics: (params: string = '') => request<any>(`/medicines/monthly-analytics/${params ? `?${params}` : ''}`),
  getPharmacySales: () => request<any[]>('/pharmacy-sales/'),
  createPharmacySale: (data: any) => request<any>('/pharmacy-sales/', { method: 'POST', body: JSON.stringify(data) }),
  getSuppliers: () => request<any[]>('/suppliers/'),

  // Laboratory
  getLabCategories: () => request<any[]>('/lab-categories/'),
  getLabTests: () => request<any[]>('/lab-tests/'),
  createLabTest: (data: any) => request<any>('/lab-tests/', { method: 'POST', body: JSON.stringify(data) }),
  getLabOrders: (params: string = '') => request<any[]>(`/lab-orders/${params ? `?${params}` : ''}`),
  createLabOrder: (data: any) => request<any>('/lab-orders/', { method: 'POST', body: JSON.stringify(data) }),
  collectLabSample: (id: number) => request<any>(`/lab-orders/${id}/collect-sample/`, { method: 'POST' }),
  approveLabOrder: (id: number) => request<any>(`/lab-orders/${id}/approve/`, { method: 'POST' }),

  // Radiology
  getRadiologyModalities: () => request<any[]>('/radiology-modalities/'),
  getRadiologyInvestigations: () => request<any[]>('/radiology-investigations/'),
  getRadiologyOrders: (params: string = '') => request<any[]>(`/radiology-orders/${params ? `?${params}` : ''}`),
  createRadiologyOrder: (data: any) => request<any>('/radiology-orders/', { method: 'POST', body: JSON.stringify(data) }),
  submitRadiologyReport: (id: number, data: any) => request<any>(`/radiology-orders/${id}/submit-report/`, { method: 'POST', body: JSON.stringify(data) }),

  // Billing
  getInvoices: (params: string = '') => request<any[]>(`/invoices/${params ? `?${params}` : ''}`),
  createInvoice: (data: any) => request<any>('/invoices/', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (invoiceId: number, data: any) => request<any>(`/invoices/${invoiceId}/record-payment/`, { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => request<any[]>('/payments/'),

  // Insurance
  getInsuranceProviders: () => request<any[]>('/insurance-providers/'),
  getInsuranceClaims: () => request<any[]>('/insurance-claims/'),
  createInsuranceClaim: (data: any) => request<any>('/insurance-claims/', { method: 'POST', body: JSON.stringify(data) }),

  // Blood Bank
  getBloodDonors: () => request<any[]>('/blood-donors/'),
  getBloodUnits: (params: string = '') => request<any[]>(`/blood-units/${params ? `?${params}` : ''}`),
  getBloodSummary: () => request<any>('/blood-units/summary/'),
  getBloodRequests: () => request<any[]>('/blood-requests/'),
  createBloodRequest: (data: any) => request<any>('/blood-requests/', { method: 'POST', body: JSON.stringify(data) }),
  crossMatchBlood: (id: number) => request<any>(`/blood-requests/${id}/cross-match/`, { method: 'POST' }),
  issueBlood: (id: number) => request<any>(`/blood-requests/${id}/issue/`, { method: 'POST' }),

  // HR & Staff
  getStaffProfiles: () => request<any[]>('/staff-profiles/'),
  createStaffProfile: (data: any) => request<any>('/staff-profiles/', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: () => request<any[]>('/attendance/'),
  getLeaveRequests: () => request<any[]>('/leave-requests/'),
  approveLeaveRequest: (id: number) => request<any>(`/leave-requests/${id}/approve/`, { method: 'POST' }),
  getPayrolls: () => request<any[]>('/payrolls/'),

  // Accounting
  getAccountHeads: () => request<any[]>('/account-heads/'),
  getVouchers: () => request<any[]>('/vouchers/'),
  createVoucher: (data: any) => request<any>('/vouchers/', { method: 'POST', body: JSON.stringify(data) }),
  getFinancialSummary: (branchId?: number) => request<any>(`/accounting/summary/${branchId ? `?branch=${branchId}` : ''}`),
  getDoctorCommissions: () => request<any[]>('/doctor-commissions/'),

  // Telemedicine
  getTelemedicineSessions: () => request<any[]>('/telemedicine-sessions/'),
  createTelemedicineSession: (data: any) => request<any>('/telemedicine-sessions/', { method: 'POST', body: JSON.stringify(data) }),
  startTelemedicineCall: (id: number) => request<any>(`/telemedicine-sessions/${id}/start-call/`, { method: 'POST' }),
  endTelemedicineCall: (id: number, notes?: string) => request<any>(`/telemedicine-sessions/${id}/end-call/`, { method: 'POST', body: JSON.stringify({ doctor_notes: notes }) }),

  // AI Insights
  getAIAnalysis: () => request<any>('/ai/analysis/'),
  queryAINaturalLanguage: (query: string) => request<any>('/ai/query/', { method: 'POST', body: JSON.stringify({ query }) }),
  getAIConfigs: () => request<any[]>('/ai-configs/'),

  // Generic Request & Emergency Case update
  updateEmergencyCase: (id: number, data: any) => request<any>(`/emergency-cases/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  request,
};
