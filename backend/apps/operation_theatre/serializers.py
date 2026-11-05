from rest_framework import serializers
from .models import OTRoom, Surgery, OTEquipment
from apps.patients.serializers import PatientSerializer

class OTEquipmentSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='ot_room.room_number', read_only=True)
    class Meta:
        model = OTEquipment
        fields = '__all__'

class OTRoomSerializer(serializers.ModelSerializer):
    equipment = OTEquipmentSerializer(many=True, read_only=True)
    class Meta:
        model = OTRoom
        fields = '__all__'

class SurgerySerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    lead_surgeon_name = serializers.CharField(source='lead_surgeon.full_name', read_only=True)
    assistant_surgeon_name = serializers.CharField(source='assistant_surgeon.full_name', read_only=True)
    anesthetist_name = serializers.CharField(source='anesthetist.full_name', read_only=True)
    ot_room_name = serializers.CharField(source='ot_room.room_number', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = Surgery
        fields = '__all__'
        read_only_fields = ['surgery_number']
