import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Appointment
from .serializers import AppointmentSerializer
from apps.patients.models import PatientTimeline
from apps.queues.models import QueueToken

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['appointment_number', 'patient__first_name', 'patient__last_name', 'patient__uhid', 'doctor__user__first_name']
    ordering_fields = ['appointment_date', 'time_slot', 'created_at']

    def get_queryset(self):
        qs = Appointment.objects.all()
        branch_id = self.request.query_params.get('branch')
        doctor_id = self.request.query_params.get('doctor')
        patient_id = self.request.query_params.get('patient')
        status_param = self.request.query_params.get('status')
        date_param = self.request.query_params.get('date')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if date_param:
            qs = qs.filter(appointment_date=date_param)

        return qs

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_apt = Appointment.objects.filter(appointment_number__startswith=f"APT-{year}-").order_by('-id').first()
        if last_apt:
            try:
                last_num = int(last_apt.appointment_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = Appointment.objects.count() + 1001
        else:
            new_num = 1001

        apt_number = f"APT-{year}-{new_num:04d}"
        apt = serializer.save(appointment_number=apt_number)

        # Log timeline
        PatientTimeline.objects.create(
            patient=apt.patient,
            event_type='Appointment',
            title=f"Appointment Booked with {apt.doctor.full_name}",
            description=f"Slot: {apt.time_slot} on {apt.appointment_date} ({apt.appointment_type})",
            reference_id=apt.appointment_number
        )

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        apt = self.get_object()
        apt.status = 'Checked-in'
        apt.save()

        # Generate live queue token if not exists
        token = QueueToken.objects.filter(appointment=apt).first()
        if not token:
            today = timezone.localdate()
            tokens_today = QueueToken.objects.filter(
                branch=apt.branch,
                doctor=apt.doctor,
                created_at__date=today
            ).count()
            token_number = f"T-{tokens_today + 1:02d}"

            token = QueueToken.objects.create(
                token_number=token_number,
                branch=apt.branch,
                doctor=apt.doctor,
                patient=apt.patient,
                appointment=apt,
                priority='Normal',
                status='Waiting',
                estimated_wait_minutes=tokens_today * 15
            )

        return Response({
            'status': 'Checked-in',
            'token_number': token.token_number,
            'estimated_wait_minutes': token.estimated_wait_minutes
        })

    @action(detail=True, methods=['post'], url_path='cancel-appointment')
    def cancel_appointment(self, request, pk=None):
        apt = self.get_object()
        reason = request.data.get('reason', 'Cancelled by patient/reception')
        apt.status = 'Cancelled'
        apt.cancellation_reason = reason
        apt.save()
        return Response({'status': 'Cancelled', 'appointment_number': apt.appointment_number})

    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        apt = self.get_object()
        new_date = request.data.get('appointment_date')
        new_slot = request.data.get('time_slot')
        if new_date:
            apt.appointment_date = new_date
        if new_slot:
            apt.time_slot = new_slot
        apt.status = 'Scheduled'
        apt.save()
        return Response({'status': 'Rescheduled', 'appointment_number': apt.appointment_number})
