from rest_framework import serializers
from .models import OPDConsultation, Prescription, PrescriptionItem
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = '__all__'
        extra_kwargs = {'prescription': {'required': False}}

class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, required=False)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_qualification = serializers.CharField(source='doctor.qualification', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['prescription_number', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        prescription = Prescription.objects.create(**validated_data)
        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)
        return prescription

class OPDConsultationSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = OPDConsultation
        fields = '__all__'
        read_only_fields = ['consultation_date']
