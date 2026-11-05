from rest_framework import serializers
from .models import BloodDonor, BloodUnit, BloodRequest
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class BloodDonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodDonor
        fields = '__all__'

class BloodUnitSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.name', read_only=True)
    class Meta:
        model = BloodUnit
        fields = '__all__'

class BloodRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

    class Meta:
        model = BloodRequest
        fields = '__all__'
        read_only_fields = ['request_number', 'created_at']
