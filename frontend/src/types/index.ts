export type Role =
  | 'SUPER_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'BRANCH_ADMIN'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'NURSE'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'RADIOLOGIST'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'OT_STAFF'
  | 'PATIENT';

export type Language = 'en' | 'mr' | 'hi';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  phone?: string;
  avatar_url?: string;
  hospital?: number;
  branch?: number;
  branch_name?: string;
  department?: number;
  department_name?: string;
  preferred_language: Language;
}

export interface Hospital {
  id: number;
  name: string;
  code: string;
  registration_number: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logo_url?: string;
  is_active: boolean;
  branches_count?: number;
}

export interface Branch {
  id: number;
  hospital: number;
  hospital_name?: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  is_main_branch: boolean;
  is_active: boolean;
  departments_count?: number;
}

export interface Department {
  id: number;
  branch: number;
  branch_name?: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface Patient {
  id: number;
  uhid: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  allergies?: string;
  chronic_conditions?: string;
  medical_history?: string;
  status: 'Active' | 'Inpatient' | 'Discharged' | 'Emergency';
  registered_at: string;
  branch?: number;
  branch_name?: string;
}

export interface Doctor {
  id: number;
  user: number;
  user_details?: User;
  full_name: string;
  specialization: string;
  qualification: string;
  registration_council_number: string;
  experience_years: number;
  consultation_fee: string | number;
  follow_up_fee: string | number;
  telemedicine_fee: string | number;
  room_number: string;
  is_available: boolean;
  bio?: string;
  department: number;
  department_name?: string;
  branch: number;
  branch_name?: string;
}

export interface Appointment {
  id: number;
  appointment_number: string;
  patient: number;
  patient_name?: string;
  patient_phone?: string;
  doctor: number;
  doctor_name?: string;
  department: number;
  department_name?: string;
  branch: number;
  branch_name?: string;
  appointment_date: string;
  time_slot: string;
  appointment_type: 'Walk-in' | 'Scheduled' | 'Follow-up' | 'Telemedicine';
  status: 'Scheduled' | 'Confirmed' | 'Checked-in' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show';
  notes?: string;
  created_at: string;
}

export interface QueueToken {
  id: number;
  token_number: string;
  patient: number;
  patient_name?: string;
  doctor: number;
  doctor_name?: string;
  room_number?: string;
  priority: 'Normal' | 'Senior Citizen' | 'Pediatric' | 'Emergency';
  status: 'Waiting' | 'Serving' | 'Completed' | 'Skipped' | 'Cancelled';
  estimated_wait_minutes: number;
  created_at: string;
  called_at?: string;
}

export interface Ward {
  id: number;
  name: string;
  ward_type: string;
  floor: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
}

export interface Bed {
  id: number;
  ward: number;
  ward_name?: string;
  ward_type?: string;
  bed_number: string;
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
  daily_charge: string | number;
  features?: string;
}

export interface Admission {
  id: number;
  admission_number: string;
  patient: number;
  patient_name?: string;
  patient_uhid?: string;
  primary_doctor: number;
  doctor_name?: string;
  ward: number;
  ward_name?: string;
  bed: number;
  bed_number?: string;
  admission_date: string;
  discharge_date?: string;
  admission_reason: string;
  diagnosis: string;
  status: 'Admitted' | 'Discharged' | 'Transferred';
  discharge_summary?: string;
}

export interface EmergencyCase {
  id: number;
  case_number: string;
  patient: number;
  patient_name?: string;
  attending_doctor?: number;
  doctor_name?: string;
  triage_level: 'Red' | 'Orange' | 'Yellow' | 'Green';
  arrival_mode: string;
  chief_complaint: string;
  gcs_score: number;
  systolic_bp: number;
  diastolic_bp: number;
  pulse: number;
  spo2: number;
  temp_f: string | number;
  initial_management: string;
  status: string;
  arrival_time: string;
}

export interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  category: number;
  category_name?: string;
  dosage_form: string;
  strength: string;
  manufacturer: string;
  reorder_threshold: number;
  total_stock?: number;
}

export interface MedicineBatch {
  id: number;
  medicine: number;
  medicine_name?: string;
  strength?: string;
  batch_number: string;
  expiry_date: string;
  purchase_rate: string | number;
  mrp: string | number;
  selling_price: string | number;
  current_stock: number;
  supplier_name?: string;
}

export interface LabTest {
  id: number;
  test_code: string;
  name: string;
  category: number;
  category_name?: string;
  sample_type: string;
  standard_fee: string | number;
  turnaround_hours: number;
  reference_interval: string;
  unit: string;
}

export interface LabOrder {
  id: number;
  order_number: string;
  patient: number;
  patient_name?: string;
  patient_uhid?: string;
  doctor: number;
  doctor_name?: string;
  status: 'Ordered' | 'Sample Collected' | 'In Testing' | 'Results Entered' | 'Approved' | 'Cancelled';
  clinical_remarks?: string;
  created_at: string;
  items?: Array<{
    id: number;
    test: number;
    test_name: string;
    test_code: string;
    result_value: string;
    unit: string;
    reference_interval: string;
    is_abnormal: boolean;
  }>;
}

export interface RadiologyInvestigation {
  id: number;
  code: string;
  name: string;
  modality_name?: string;
  standard_fee: string | number;
}

export interface RadiologyOrder {
  id: number;
  order_number: string;
  patient: number;
  patient_name?: string;
  doctor: number;
  doctor_name?: string;
  investigation: number;
  investigation_name?: string;
  status: string;
  image_url?: string;
  findings?: string;
  impression?: string;
  radiologist_name?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient: number;
  patient_name?: string;
  patient_phone?: string;
  patient_uhid?: string;
  invoice_type: string;
  subtotal: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  discount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  balance_amount: string | number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled' | 'Refunded';
  notes?: string;
  created_at: string;
  items?: Array<{
    id: number;
    service_category: string;
    description: string;
    quantity: number;
    unit_price: string | number;
    total_price: string | number;
  }>;
}

export interface Payment {
  id: number;
  payment_number: string;
  invoice: number;
  invoice_number?: string;
  amount: string | number;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
  payment_date: string;
}

export interface InsuranceClaim {
  id: number;
  claim_number: string;
  patient: number;
  patient_name?: string;
  provider_name?: string;
  policy_number?: string;
  claimed_amount: string | number;
  approved_amount: string | number;
  status: string;
  remarks?: string;
  submission_date: string;
}

export interface BloodUnit {
  id: number;
  unit_number: string;
  blood_group: string;
  component_type: string;
  expiry_date: string;
  status: string;
  storage_fridge: string;
}

export interface DashboardStats {
  total_patients: number;
  today_appointments: number;
  total_doctors: number;
  available_doctors: number;
  opd_today: number;
  ipd_admissions: number;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  bed_occupancy_rate: number;
  emergency_cases: number;
  today_revenue: number;
  monthly_revenue: number;
  pending_payments: number;
  pharmacy_stock_alerts: number;
  pending_lab_reports: number;
  revenue_trend: Array<{ month: string; revenue: number; target: number }>;
  department_performance: Array<{ name: string; consultations: number; doctors: number }>;
  recent_activities: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    time: string;
    status: string;
  }>;
}
