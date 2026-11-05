from rest_framework import serializers
from .models import Doctor, DoctorSchedule
from apps.core.serializers import UserSerializer

class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    schedules = DoctorScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'
