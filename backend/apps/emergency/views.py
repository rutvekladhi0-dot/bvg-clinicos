import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import EmergencyCase, VitalMonitoringRecord
from .serializers import EmergencyCaseSerializer, VitalMonitoringRecordSerializer
from apps.patients.models import PatientTimeline

class EmergencyCaseViewSet(viewsets.ModelViewSet):
    queryset = EmergencyCase.objects.all()
    serializer_class = EmergencyCaseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['case_number', 'patient__first_name', 'patient__last_name', 'patient__uhid']
    ordering_fields = ['arrival_time', 'triage_level']

    def get_queryset(self):
        qs = EmergencyCase.objects.all()
        branch_id = self.request.query_params.get('branch')
        status_param = self.request.query_params.get('status')
        triage_level = self.request.query_params.get('triage_level')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if triage_level:
            qs = qs.filter(triage_level=triage_level)
        return qs

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_case = EmergencyCase.objects.filter(case_number__startswith=f"EM-{year}-").order_by('-id').first()
        if last_case:
            try:
                last_num = int(last_case.case_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = EmergencyCase.objects.count() + 101
        else:
            new_num = 101

        case_number = f"EM-{year}-{new_num:04d}"
        emergency_case = serializer.save(case_number=case_number)

        # Log timeline
        PatientTimeline.objects.create(
            patient=emergency_case.patient,
            event_type='Emergency',
            title=f"Emergency Arrival - Triage [{emergency_case.triage_level}]",
            description=f"Complaint: {emergency_case.chief_complaint}. Vitals: BP {emergency_case.systolic_bp}/{emergency_case.diastolic_bp}, Pulse {emergency_case.pulse}",
            reference_id=emergency_case.case_number
        )

    @action(detail=True, methods=['post'], url_path='log-vitals')
    def log_vitals(self, request, pk=None):
        case = self.get_object()
        data = request.data
        vital = VitalMonitoringRecord.objects.create(
            emergency_case=case,
            recorded_by=request.user if request.user.is_authenticated else None,
            heart_rate=data.get('heart_rate', case.pulse),
            systolic_bp=data.get('systolic_bp', case.systolic_bp),
            diastolic_bp=data.get('diastolic_bp', case.diastolic_bp),
            spo2=data.get('spo2', case.spo2),
            respiratory_rate=data.get('respiratory_rate', 18),
            ventilator_mode=data.get('ventilator_mode', 'Room Air'),
            critical_alert=data.get('critical_alert', False),
            alert_notes=data.get('alert_notes', '')
        )
        return Response(VitalMonitoringRecordSerializer(vital).data, status=status.HTTP_201_CREATED)

class VitalMonitoringRecordViewSet(viewsets.ModelViewSet):
    queryset = VitalMonitoringRecord.objects.all()
    serializer_class = VitalMonitoringRecordSerializer
    permission_classes = [permissions.AllowAny]
