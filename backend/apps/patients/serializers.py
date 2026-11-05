from rest_framework import serializers
from .models import Patient, PatientDocument, PatientTimeline

class PatientTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTimeline
        fields = '__all__'

class PatientDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientDocument
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    documents = PatientDocumentSerializer(many=True, read_only=True)
    timeline_events = PatientTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['uhid', 'registered_at']
