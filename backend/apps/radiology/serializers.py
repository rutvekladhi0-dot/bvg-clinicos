from rest_framework import serializers
from .models import RadiologyModality, RadiologyInvestigation, RadiologyOrder
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class RadiologyModalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RadiologyModality
        fields = '__all__'

class RadiologyInvestigationSerializer(serializers.ModelSerializer):
    modality_name = serializers.CharField(source='modality.name', read_only=True)
    modality_code = serializers.CharField(source='modality.code', read_only=True)
    class Meta:
        model = RadiologyInvestigation
        fields = '__all__'

class RadiologyOrderSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    investigation_name = serializers.CharField(source='investigation.name', read_only=True)
    investigation_fee = serializers.DecimalField(source='investigation.standard_fee', max_digits=10, decimal_places=2, read_only=True)
    radiologist_name = serializers.CharField(source='radiologist.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = RadiologyOrder
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at']
