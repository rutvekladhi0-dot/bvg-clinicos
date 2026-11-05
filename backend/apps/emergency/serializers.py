from rest_framework import serializers
from .models import EmergencyCase, VitalMonitoringRecord
from apps.patients.serializers import PatientSerializer

class VitalMonitoringRecordSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = VitalMonitoringRecord
        fields = '__all__'

class EmergencyCaseSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_name = serializers.CharField(source='attending_doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    vital_logs = VitalMonitoringRecordSerializer(many=True, read_only=True)

    class Meta:
        model = EmergencyCase
        fields = '__all__'
        read_only_fields = ['case_number', 'arrival_time']
