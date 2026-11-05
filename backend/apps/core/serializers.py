from rest_framework import serializers
from .models import Hospital, Branch, Department, User, AuditLog, SystemSetting

class HospitalSerializer(serializers.ModelSerializer):
    branches_count = serializers.IntegerField(source='branches.count', read_only=True)
    class Meta:
        model = Hospital
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    departments_count = serializers.IntegerField(source='departments.count', read_only=True)
    class Meta:
        model = Branch
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    class Meta:
        model = Department
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'avatar_url', 'hospital', 'branch', 'branch_name',
            'department', 'department_name', 'is_active', 'is_mfa_enabled',
            'preferred_language', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = '__all__'
