import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Patient, PatientDocument, PatientTimeline
from .serializers import PatientSerializer, PatientDocumentSerializer, PatientTimelineSerializer
from apps.core.models import Branch, AuditLog

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['uhid', 'first_name', 'last_name', 'phone', 'email']
    ordering_fields = ['registered_at', 'first_name', 'last_name']

    def get_queryset(self):
        qs = Patient.objects.all()
        branch_id = self.request.query_params.get('branch') or self.request.headers.get('X-Branch-ID')
        status_param = self.request.query_params.get('status')
        gender = self.request.query_params.get('gender')
        blood_group = self.request.query_params.get('blood_group')

        # Multi-tenant hospital/branch data isolation
        if self.request.user.is_authenticated and self.request.user.branch and self.request.user.role not in ['SUPER_ADMIN', 'HOSPITAL_ADMIN']:
            qs = qs.filter(branch=self.request.user.branch)
        elif branch_id:
            qs = qs.filter(branch_id=branch_id)

        if status_param:
            qs = qs.filter(status=status_param)
        if gender:
            qs = qs.filter(gender=gender)
        if blood_group:
            qs = qs.filter(blood_group=blood_group)

        search_q = self.request.query_params.get('search')
        if search_q:
            qs = qs.filter(
                Q(first_name__icontains=search_q) |
                Q(last_name__icontains=search_q) |
                Q(uhid__icontains=search_q) |
                Q(phone__icontains=search_q)
            )
        return qs

    def perform_create(self, serializer):
        # Auto generate UHID
        year = datetime.date.today().year
        last_patient = Patient.objects.filter(uhid__startswith=f"BVG-{year}-").order_by('-id').first()
        if last_patient and last_patient.uhid:
            try:
                last_num = int(last_patient.uhid.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = Patient.objects.count() + 1001
        else:
            new_num = 1001

        uhid = f"BVG-{year}-{new_num:04d}"
        
        # If branch not supplied, select first active branch
        branch = serializer.validated_data.get('branch')
        if not branch:
            branch = Branch.objects.first()

        patient = serializer.save(uhid=uhid, branch=branch)

        # Create Timeline Event
        PatientTimeline.objects.create(
            patient=patient,
            event_type='Registration',
            title='Patient Registered in ClinicOS',
            description=f'UHID assigned: {patient.uhid} at {branch.name if branch else "Main Campus"}',
            reference_id=patient.uhid
        )

        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            branch=patient.branch,
            action='PATIENT_REGISTERED',
            model_name='Patient',
            object_id=str(patient.id),
            details={'uhid': patient.uhid, 'name': patient.full_name},
            ip_address=self.request.META.get('REMOTE_ADDR', '127.0.0.1')
        )

    @action(detail=True, methods=['get'])
    def medical_timeline(self, request, pk=None):
        patient = self.get_object()
        timeline = patient.timeline_events.all()
        return Response(PatientTimelineSerializer(timeline, many=True).data)

    @action(detail=True, methods=['get'])
    def complete_emr(self, request, pk=None):
        patient = self.get_object()
        from apps.clinical.serializers import OPDConsultationSerializer, PrescriptionSerializer
        from apps.laboratory.serializers import LabOrderSerializer
        from apps.radiology.serializers import RadiologyOrderSerializer
        from apps.billing.serializers import InvoiceSerializer
        from apps.ipd.serializers import AdmissionSerializer

        return Response({
            'patient': PatientSerializer(patient).data,
            'consultations': OPDConsultationSerializer(patient.consultations.all()[:10], many=True).data,
            'prescriptions': PrescriptionSerializer(patient.prescriptions.all()[:10], many=True).data,
            'admissions': AdmissionSerializer(patient.admissions.all()[:5], many=True).data,
            'lab_orders': LabOrderSerializer(patient.lab_orders.all()[:10], many=True).data,
            'radiology_orders': RadiologyOrderSerializer(patient.radiology_orders.all()[:10], many=True).data,
            'invoices': InvoiceSerializer(patient.invoices.all()[:10], many=True).data,
            'timeline': PatientTimelineSerializer(patient.timeline_events.all()[:20], many=True).data,
        })

class PatientDocumentViewSet(viewsets.ModelViewSet):
    queryset = PatientDocument.objects.all()
    serializer_class = PatientDocumentSerializer
    permission_classes = [permissions.AllowAny]

class PatientTimelineViewSet(viewsets.ModelViewSet):
    queryset = PatientTimeline.objects.all()
    serializer_class = PatientTimelineSerializer
    permission_classes = [permissions.AllowAny]
