from django.db import models
from django.contrib.auth.models import AbstractUser

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    registration_number = models.CharField(max_length=100, blank=True)
    tagline = models.CharField(max_length=255, default='Complete Healthcare Management')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    logo_url = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Branch(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, default='Pune')
    is_main_branch = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('hospital', 'code')

    def __str__(self):
        return f"{self.hospital.name} - {self.name}"

class Department(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=30)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.branch.name})"

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    HOSPITAL_ADMIN = 'HOSPITAL_ADMIN', 'Hospital Admin'
    BRANCH_ADMIN = 'BRANCH_ADMIN', 'Branch Admin'
    DOCTOR = 'DOCTOR', 'Doctor'
    RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'
    NURSE = 'NURSE', 'Nurse'
    PHARMACIST = 'PHARMACIST', 'Pharmacist'
    LAB_TECHNICIAN = 'LAB_TECHNICIAN', 'Lab Technician'
    RADIOLOGIST = 'RADIOLOGIST', 'Radiologist'
    ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
    HR_MANAGER = 'HR_MANAGER', 'HR Manager'
    OT_STAFF = 'OT_STAFF', 'Operation Theatre Staff'
    PATIENT = 'PATIENT', 'Patient'

class User(AbstractUser):
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.PATIENT)
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=20, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True)
    is_mfa_enabled = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=10, default='en', choices=[('en', 'English'), ('mr', 'Marathi'), ('hi', 'Hindi')])

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user} - {self.action} on {self.model_name}"

class SystemSetting(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True)
    key = models.CharField(max_length=100)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('branch', 'key')

    def __str__(self):
        return f"{self.key}: {self.value}"
