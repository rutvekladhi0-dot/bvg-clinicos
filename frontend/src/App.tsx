import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { Role } from './types';
import { ShieldAlert, ArrowLeft, Activity } from 'lucide-react';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { QueuePage } from './pages/QueuePage';
import { DoctorsPage } from './pages/DoctorsPage';
import { OPDConsultationPage } from './pages/OPDConsultationPage';
import { IPDManagementPage } from './pages/IPDManagementPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { OperationTheatrePage } from './pages/OperationTheatrePage';
import { PharmacyPage } from './pages/PharmacyPage';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { RadiologyPage } from './pages/RadiologyPage';
import { BillingPage } from './pages/BillingPage';
import { InsurancePage } from './pages/InsurancePage';
import { BloodBankPage } from './pages/BloodBankPage';
import { HRStaffPage } from './pages/HRStaffPage';
import { AccountingPage } from './pages/AccountingPage';
import { TelemedicinePage } from './pages/TelemedicinePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { BranchesPage } from './pages/BranchesPage';
import { PatientPortalPage } from './pages/PatientPortalPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { EMRPage } from './pages/EMRPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdministrationPage } from './pages/AdministrationPage';
import { SettingsPage } from './pages/SettingsPage';

// Unauthorized Access Screen
const UnauthorizedAccess: React.FC<{ moduleName: string }> = ({ moduleName }) => {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Restricted Clinical Area</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your current active role <span className="font-semibold text-teal-600 dark:text-teal-400">({role.replace('_', ' ')})</span> does not hold authorized cryptographic privileges to access the <span className="font-semibold">{moduleName}</span> module.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Authorized Dashboard
        </button>
      </div>
    </div>
  );
};

// Route Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Role[];
  moduleName?: string;
}> = ({ children, allowedRoles, moduleName = 'This' }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin & Hospital Admin have enterprise-wide privilege
  if (role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN') {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <UnauthorizedAccess moduleName={moduleName} />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Initializing BVG ClinicOS...</p>
        </div>
      </div>
    );
  }

  // If user is unauthenticated and visits any route, show Login Page
  if (!user) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  // If authenticated user specifically navigates to /login, redirect to /
  if (location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Routes>
            {/* Dashboard - Accessible to all roles */}
            <Route path="/" element={<ProtectedRoute moduleName="Dashboard"><DashboardPage /></ProtectedRoute>} />

            {/* Patients & EMR */}
            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE']} moduleName="Patients Master">
                <PatientsPage />
              </ProtectedRoute>
            } />
            <Route path="/emr" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE']} moduleName="Electronic Medical Records">
                <EMRPage />
              </ProtectedRoute>
            } />

            {/* Appointments & Live Queue */}
            <Route path="/appointments" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST']} moduleName="Appointments & Scheduling">
                <AppointmentsPage />
              </ProtectedRoute>
            } />
            <Route path="/queue" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE']} moduleName="Live Token Queue">
                <QueuePage />
              </ProtectedRoute>
            } />
            <Route path="/queues" element={<Navigate to="/queue" replace />} />

            {/* Clinical Consultations & Prescriptions */}
            <Route path="/opd" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR']} moduleName="OPD Consultations">
                <OPDConsultationPage />
              </ProtectedRoute>
            } />
            <Route path="/prescriptions" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE', 'RECEPTIONIST']} moduleName="Prescription Management">
                <PrescriptionsPage />
              </ProtectedRoute>
            } />

            {/* Inpatient (IPD) & Emergency */}
            <Route path="/ipd" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE']} moduleName="Inpatient (IPD) & Bed Allocation">
                <IPDManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/emergency" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'NURSE', 'OT_STAFF']} moduleName="Emergency & ICU Triage">
                <EmergencyPage />
              </ProtectedRoute>
            } />

            {/* Operation Theatre */}
            <Route path="/operation-theatre" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'OT_STAFF']} moduleName="Operation Theatre & Surgery">
                <OperationTheatrePage />
              </ProtectedRoute>
            } />
            <Route path="/ot" element={<Navigate to="/operation-theatre" replace />} />

            {/* Diagnostics & Pharmacy */}
            <Route path="/pharmacy" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'PHARMACIST', 'DOCTOR']} moduleName="Pharmacy POS & Stock">
                <PharmacyPage />
              </ProtectedRoute>
            } />
            <Route path="/laboratory" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'LAB_TECHNICIAN', 'DOCTOR']} moduleName="Laboratory Diagnostics">
                <LaboratoryPage />
              </ProtectedRoute>
            } />
            <Route path="/radiology" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'RADIOLOGIST', 'DOCTOR']} moduleName="Radiology PACS & Imaging">
                <RadiologyPage />
              </ProtectedRoute>
            } />
            <Route path="/blood-bank" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'LAB_TECHNICIAN', 'NURSE', 'DOCTOR']} moduleName="Blood Bank Transfusions">
                <BloodBankPage />
              </ProtectedRoute>
            } />

            {/* Billing, Insurance & Accounting */}
            <Route path="/billing" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']} moduleName="Billing & Invoicing">
                <BillingPage />
              </ProtectedRoute>
            } />
            <Route path="/insurance" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT']} moduleName="Insurance TPA Claims">
                <InsurancePage />
              </ProtectedRoute>
            } />
            <Route path="/accounting" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT']} moduleName="Financial Accounting & Ledgers">
                <AccountingPage />
              </ProtectedRoute>
            } />

            {/* Operations, HR, Branches, Telemedicine & Portal */}
            <Route path="/doctors" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'RECEPTIONIST', 'HR_MANAGER']} moduleName="Doctor Rosters & Availability">
                <DoctorsPage />
              </ProtectedRoute>
            } />
            <Route path="/hr" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'HR_MANAGER', 'ACCOUNTANT']} moduleName="HR & Staff Management">
                <HRStaffPage />
              </ProtectedRoute>
            } />
            <Route path="/branches" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN']} moduleName="Multi-Branch Management">
                <BranchesPage />
              </ProtectedRoute>
            } />
            <Route path="/telemedicine" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'PATIENT']} moduleName="Telemedicine Video Consultations">
                <TelemedicinePage />
              </ProtectedRoute>
            } />
            <Route path="/portal" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PATIENT']} moduleName="Patient Self-Service Portal">
                <PatientPortalPage />
              </ProtectedRoute>
            } />
            <Route path="/patient-portal" element={<Navigate to="/portal" replace />} />

            {/* Intelligence, Notifications & Administration */}
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT', 'DOCTOR']} moduleName="Advanced Analytics & BI">
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/ai-insights" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BRANCH_ADMIN', 'DOCTOR']} moduleName="AI Predictive Clinical Insights">
                <AIInsightsPage />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={<ProtectedRoute moduleName="Notifications"><NotificationsPage /></ProtectedRoute>} />
            <Route path="/administration" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']} moduleName="User Administration & RBAC">
                <AdministrationPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']} moduleName="System Settings & Security">
                <SettingsPage />
              </ProtectedRoute>
            } />

            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Interactive Overlays */}
      <MobileNav />
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
