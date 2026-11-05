from rest_framework import serializers
from .models import QueueToken
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class QueueTokenSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    room_number = serializers.CharField(source='doctor.room_number', read_only=True)

    class Meta:
        model = QueueToken
        fields = '__all__'
