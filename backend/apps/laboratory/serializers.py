from rest_framework import serializers
from .models import LabCategory, LabTest, LabOrder, LabOrderItem
from apps.patients.serializers import PatientSerializer
from apps.doctors.serializers import DoctorSerializer

class LabCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LabCategory
        fields = '__all__'

class LabTestSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = LabTest
        fields = '__all__'

class LabOrderItemSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source='test.name', read_only=True)
    test_code = serializers.CharField(source='test.test_code', read_only=True)

    class Meta:
        model = LabOrderItem
        fields = '__all__'
        extra_kwargs = {'order': {'required': False}}

class LabOrderSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    technician_name = serializers.CharField(source='technician.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    items = LabOrderItemSerializer(many=True, required=False)

    class Meta:
        model = LabOrder
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = LabOrder.objects.create(**validated_data)
        for item_data in items_data:
            LabOrderItem.objects.create(order=order, **item_data)
        return order
