from rest_framework import serializers
from .models import InsuranceProvider, PatientInsurance, InsuranceClaim
from apps.patients.serializers import PatientSerializer

class InsuranceProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceProvider
        fields = '__all__'

class PatientInsuranceSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = PatientInsurance
        fields = '__all__'

class InsuranceClaimSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    provider_name = serializers.CharField(source='insurance.provider.name', read_only=True)
    policy_number = serializers.CharField(source='insurance.policy_number', read_only=True)

    class Meta:
        model = InsuranceClaim
        fields = '__all__'
        read_only_fields = ['claim_number', 'submission_date']
