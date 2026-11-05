from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import StaffProfile, Attendance, LeaveRequest, PayrollRecord
from .serializers import StaffProfileSerializer, AttendanceSerializer, LeaveRequestSerializer, PayrollRecordSerializer

class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['user__first_name', 'user__last_name', 'employee_id', 'designation']

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Attendance.objects.all()
        date_param = self.request.query_params.get('date')
        if date_param:
            qs = qs.filter(date=date_param)
        return qs

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_leave(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'Approved'
        if request.user.is_authenticated:
            leave.approved_by = request.user
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.all()
    serializer_class = PayrollRecordSerializer
    permission_classes = [permissions.AllowAny]
