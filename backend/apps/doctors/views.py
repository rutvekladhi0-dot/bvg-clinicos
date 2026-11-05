from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Doctor, DoctorSchedule
from .serializers import DoctorSerializer, DoctorScheduleSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'specialization', 'qualification']

    def get_queryset(self):
        qs = Doctor.objects.all()
        branch_id = self.request.query_params.get('branch')
        department_id = self.request.query_params.get('department')
        is_available = self.request.query_params.get('is_available')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if department_id:
            qs = qs.filter(department_id=department_id)
        if is_available is not None:
            qs = qs.filter(is_available=(is_available.lower() == 'true'))
        return qs

    @action(detail=True, methods=['post'], url_path='toggle-availability')
    def toggle_availability(self, request, pk=None):
        doctor = self.get_object()
        doctor.is_available = not doctor.is_available
        doctor.save()
        return Response({'is_available': doctor.is_available, 'status': 'updated'})

class DoctorScheduleViewSet(viewsets.ModelViewSet):
    queryset = DoctorSchedule.objects.all()
    serializer_class = DoctorScheduleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = DoctorSchedule.objects.all()
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs
