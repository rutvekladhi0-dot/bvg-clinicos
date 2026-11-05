from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

def health_check(request):
    db_status = "healthy"
    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    is_ok = db_status == "healthy"
    return JsonResponse({
        "status": "healthy" if is_ok else "degraded",
        "service": "BVG ClinicOS Backend API",
        "environment": "production" if not settings.DEBUG else "development",
        "database": db_status,
        "version": "2.4.0-enterprise"
    }, status=200 if is_ok else 503)

# Core
from apps.core.views import (
    HospitalViewSet, BranchViewSet, DepartmentViewSet, UserViewSet,
    AuditLogViewSet, SystemSettingViewSet, AuthLoginView, CurrentUserView,
    ForgotPasswordView, ResetPasswordView, GlobalSearchView, InitAdminView
)
# Patients
from apps.patients.views import PatientViewSet, PatientDocumentViewSet, PatientTimelineViewSet
# Doctors
from apps.doctors.views import DoctorViewSet, DoctorScheduleViewSet
# Appointments
from apps.appointments.views import AppointmentViewSet
# Queues
from apps.queues.views import QueueTokenViewSet
# Clinical
from apps.clinical.views import OPDConsultationViewSet, PrescriptionViewSet
# IPD
from apps.ipd.views import (
    WardViewSet, BedViewSet, AdmissionViewSet,
    NursingNoteViewSet, MedicationAdministrationViewSet
)
# Emergency
from apps.emergency.views import EmergencyCaseViewSet, VitalMonitoringRecordViewSet
# Operation Theatre
from apps.operation_theatre.views import OTRoomViewSet, SurgeryViewSet, OTEquipmentViewSet
# Pharmacy
from apps.pharmacy.views import (
    MedicineCategoryViewSet, SupplierViewSet, MedicineViewSet,
    MedicineBatchViewSet, PharmacySaleViewSet
)
# Laboratory
from apps.laboratory.views import LabCategoryViewSet, LabTestViewSet, LabOrderViewSet
# Radiology
from apps.radiology.views import (
    RadiologyModalityViewSet, RadiologyInvestigationViewSet, RadiologyOrderViewSet
)
# Billing
from apps.billing.views import InvoiceViewSet, PaymentViewSet
# Insurance
from apps.insurance.views import (
    InsuranceProviderViewSet, PatientInsuranceViewSet, InsuranceClaimViewSet
)
# Blood Bank
from apps.blood_bank.views import BloodDonorViewSet, BloodUnitViewSet, BloodRequestViewSet
# HR
from apps.hr.views import (
    StaffProfileViewSet, AttendanceViewSet, LeaveRequestViewSet, PayrollRecordViewSet
)
# Accounting
from apps.accounting.views import (
    AccountHeadViewSet, TransactionVoucherViewSet, DoctorCommissionViewSet, FinancialSummaryView
)
# Telemedicine
from apps.telemedicine.views import TelemedicineSessionViewSet
# AI Insights
from apps.ai_insights.views import (
    AIProviderConfigViewSet, AIInsightViewSet, AIAnalysisEngineView, AINaturalLanguageQueryView
)
# Analytics
from apps.analytics.views import (
    DashboardStatsView, AdvancedAnalyticsView, ExportExcelReportView, ExportPDFReportView
)

router = DefaultRouter()

# Core
router.register(r'hospitals', HospitalViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'users', UserViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'settings', SystemSettingViewSet)

# Patients
router.register(r'patients', PatientViewSet)
router.register(r'patient-documents', PatientDocumentViewSet)
router.register(r'patient-timelines', PatientTimelineViewSet)

# Doctors
router.register(r'doctors', DoctorViewSet)
router.register(r'doctor-schedules', DoctorScheduleViewSet)

# Appointments
router.register(r'appointments', AppointmentViewSet)

# Queues
router.register(r'queues', QueueTokenViewSet)

# Clinical
router.register(r'consultations', OPDConsultationViewSet)
router.register(r'prescriptions', PrescriptionViewSet)

# IPD
router.register(r'wards', WardViewSet)
router.register(r'beds', BedViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'nursing-notes', NursingNoteViewSet)
router.register(r'medication-administrations', MedicationAdministrationViewSet)

# Emergency
router.register(r'emergency-cases', EmergencyCaseViewSet)
router.register(r'vital-logs', VitalMonitoringRecordViewSet)

# Operation Theatre
router.register(r'ot-rooms', OTRoomViewSet)
router.register(r'surgeries', SurgeryViewSet)
router.register(r'ot-equipment', OTEquipmentViewSet)

# Pharmacy
router.register(r'medicine-categories', MedicineCategoryViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'medicine-batches', MedicineBatchViewSet)
router.register(r'pharmacy-sales', PharmacySaleViewSet)

# Laboratory
router.register(r'lab-categories', LabCategoryViewSet)
router.register(r'lab-tests', LabTestViewSet)
router.register(r'lab-orders', LabOrderViewSet)

# Radiology
router.register(r'radiology-modalities', RadiologyModalityViewSet)
router.register(r'radiology-investigations', RadiologyInvestigationViewSet)
router.register(r'radiology-orders', RadiologyOrderViewSet)

# Billing
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)

# Insurance
router.register(r'insurance-providers', InsuranceProviderViewSet)
router.register(r'patient-insurances', PatientInsuranceViewSet)
router.register(r'insurance-claims', InsuranceClaimViewSet)

# Blood Bank
router.register(r'blood-donors', BloodDonorViewSet)
router.register(r'blood-units', BloodUnitViewSet)
router.register(r'blood-requests', BloodRequestViewSet)

# HR
router.register(r'staff-profiles', StaffProfileViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'payrolls', PayrollRecordViewSet)

# Accounting
router.register(r'account-heads', AccountHeadViewSet)
router.register(r'vouchers', TransactionVoucherViewSet)
router.register(r'doctor-commissions', DoctorCommissionViewSet)

# Telemedicine
router.register(r'telemedicine-sessions', TelemedicineSessionViewSet)

# AI Insights
router.register(r'ai-configs', AIProviderConfigViewSet)
router.register(r'ai-insights', AIInsightViewSet)

urlpatterns = [
    # Health checks for Render, AWS & load balancers
    path('health/', health_check, name='health-check'),
    path('api/health/', health_check, name='api-health-check'),
    
    path('admin/', admin.site.urls),
    
    # Auth endpoints
    path('api/auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('api/auth/init-admin/', InitAdminView.as_view(), name='auth-init-admin'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    
    # Global Search
    path('api/global-search/', GlobalSearchView.as_view(), name='global-search'),
    
    # Analytics & Dashboard
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/analytics/advanced/', AdvancedAnalyticsView.as_view(), name='analytics-advanced'),
    path('api/analytics/export/excel/', ExportExcelReportView.as_view(), name='analytics-export-excel'),
    path('api/analytics/export/pdf/', ExportPDFReportView.as_view(), name='analytics-export-pdf'),
    
    # Accounting Summary
    path('api/accounting/summary/', FinancialSummaryView.as_view(), name='accounting-summary'),
    
    # AI Engine
    path('api/ai/analysis/', AIAnalysisEngineView.as_view(), name='ai-analysis'),
    path('api/ai/query/', AINaturalLanguageQueryView.as_view(), name='ai-natural-query'),

    # DRF Router endpoints
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
