from rest_framework import serializers
from .models import Ward, Bed, Admission, NursingNote, MedicationAdministration
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class BedSerializer(serializers.ModelSerializer):
    ward_name = serializers.CharField(source='ward.name', read_only=True)
    ward_type = serializers.CharField(source='ward.ward_type', read_only=True)

    class Meta:
        model = Bed
        fields = '__all__'

class WardSerializer(serializers.ModelSerializer):
    beds = BedSerializer(many=True, read_only=True)
    available_beds = serializers.SerializerMethodField()
    occupied_beds = serializers.SerializerMethodField()

    class Meta:
        model = Ward
        fields = '__all__'

    def get_available_beds(self, obj):
        return obj.beds.filter(status='Available').count()

    def get_occupied_beds(self, obj):
        return obj.beds.filter(status='Occupied').count()

class NursingNoteSerializer(serializers.ModelSerializer):
    nurse_name = serializers.CharField(source='nurse.get_full_name', read_only=True)

    class Meta:
        model = NursingNote
        fields = '__all__'

class MedicationAdministrationSerializer(serializers.ModelSerializer):
    administered_by_name = serializers.CharField(source='administered_by.get_full_name', read_only=True)

    class Meta:
        model = MedicationAdministration
        fields = '__all__'

class AdmissionSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_name = serializers.CharField(source='primary_doctor.full_name', read_only=True)
    ward_name = serializers.CharField(source='ward.name', read_only=True)
    bed_number = serializers.CharField(source='bed.bed_number', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    nursing_notes = NursingNoteSerializer(many=True, read_only=True)
    mar_records = MedicationAdministrationSerializer(many=True, read_only=True)

    class Meta:
        model = Admission
        fields = '__all__'
        read_only_fields = ['admission_number']
