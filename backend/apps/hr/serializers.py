from rest_framework import serializers
from .models import StaffProfile, Attendance, LeaveRequest, PayrollRecord
from apps.core.serializers import UserSerializer

class StaffProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = StaffProfile
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    employee_id = serializers.CharField(source='staff.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'

class PayrollRecordSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.user.get_full_name', read_only=True)
    designation = serializers.CharField(source='staff.designation', read_only=True)
    employee_id = serializers.CharField(source='staff.employee_id', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = '__all__'
