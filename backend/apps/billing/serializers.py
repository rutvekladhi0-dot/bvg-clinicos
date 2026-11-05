from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment
from apps.patients.serializers import PatientSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        extra_kwargs = {'invoice': {'required': False}}

class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['payment_number', 'payment_date']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    payments = PaymentSerializer(many=True, read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        invoice.recalculate_totals()
        return invoice
