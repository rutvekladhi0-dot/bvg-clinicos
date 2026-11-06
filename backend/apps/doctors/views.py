from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from apps.core.models import User, Department, Branch
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

    def create(self, request, *args, **kwargs):
        data = request.data
        user_id = data.get('user')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', 'Clinicos@2026').strip()
        specialization = data.get('specialization', 'General Medicine').strip()
        qualification = data.get('qualification', 'MBBS').strip()
        registration_no = data.get('registration_council_number', 'MMC-2026-0001').strip()
        consultation_fee = data.get('consultation_fee', 500.00)
        follow_up_fee = data.get('follow_up_fee', 300.00)
        telemedicine_fee = data.get('telemedicine_fee', 600.00)
        room_number = data.get('room_number', 'OPD-101').strip()
        department_id = data.get('department')
        branch_id = data.get('branch')

        # Resolve branch and department
        branch = Branch.objects.filter(id=branch_id).first() or Branch.objects.first()
        department = Department.objects.filter(id=department_id).first()
        if not department:
            department = Department.objects.filter(name__icontains=specialization[:5]).first() or Department.objects.first()

        if user_id:
            user = User.objects.get(id=user_id)
        else:
            if not username:
                base_username = f"dr_{first_name.lower() or 'doc'}_{last_name.lower() or 'specialist'}"
                username = base_username.replace(' ', '_')
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='DOCTOR',
                phone=phone,
                branch=branch,
                department=department
            )

        doctor = Doctor.objects.create(
            user=user,
            department=department,
            branch=branch,
            specialization=specialization,
            qualification=qualification,
            registration_council_number=registration_no,
            consultation_fee=consultation_fee,
            follow_up_fee=follow_up_fee,
            telemedicine_fee=telemedicine_fee,
            room_number=room_number,
            is_available=True
        )

        # Create default schedules Monday - Saturday
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']:
            DoctorSchedule.objects.get_or_create(
                doctor=doctor,
                day_of_week=day,
                defaults={
                    'start_time': '09:00:00',
                    'end_time': '17:00:00',
                    'slot_duration_minutes': 15,
                    'max_patients': 25,
                    'is_active': True
                }
            )

        return Response(DoctorSerializer(doctor).data, status=status.HTTP_201_CREATED)

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
