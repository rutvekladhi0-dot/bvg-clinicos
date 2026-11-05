from rest_framework import serializers
from .models import AccountHead, TransactionVoucher, DoctorCommission

class AccountHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountHead
        fields = '__all__'

class TransactionVoucherSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account_head.name', read_only=True)
    account_type = serializers.CharField(source='account_head.account_type', read_only=True)

    class Meta:
        model = TransactionVoucher
        fields = '__all__'
        read_only_fields = ['voucher_number', 'created_at']

class DoctorCommissionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    department_name = serializers.CharField(source='doctor.department.name', read_only=True)

    class Meta:
        model = DoctorCommission
        fields = '__all__'
