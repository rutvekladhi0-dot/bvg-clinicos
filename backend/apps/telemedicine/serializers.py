from rest_framework import serializers
from .models import TelemedicineSession
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class TelemedicineSessionSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = TelemedicineSession
        fields = '__all__'
        read_only_fields = ['room_id']
