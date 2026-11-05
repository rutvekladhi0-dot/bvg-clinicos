from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.core.models import Branch

class BloodDonor(models.Model):
    name = models.CharField(max_length=150)
    gender = models.CharField(max_length=10, default='Male')
    blood_group = models.CharField(max_length=10)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    age = models.PositiveIntegerField(default=28)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1, default=65.0)
    last_donation_date = models.DateField(null=True, blank=True)
    is_eligible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.blood_group}) - {self.phone}"

class BloodUnit(models.Model):
    COMPONENT_CHOICES = [
        ('Whole Blood', 'Whole Blood (WB)'),
        ('PRBC', 'Packed Red Blood Cells (PRBC)'),
        ('FFP', 'Fresh Frozen Plasma (FFP)'),
        ('Platelets', 'Random Donor Platelets (RDP)'),
        ('Cryoprecipitate', 'Cryoprecipitate'),
    ]
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Reserved', 'Reserved'),
        ('Transfused', 'Transfused'),
        ('Expired', 'Expired'),
        ('Quarantined', 'Quarantined'),
    ]

    unit_number = models.CharField(max_length=50, unique=True, db_index=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='blood_units')
    blood_group = models.CharField(max_length=10, db_index=True)
    component_type = models.CharField(max_length=30, choices=COMPONENT_CHOICES, default='PRBC')
    donor = models.ForeignKey(BloodDonor, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    collected_date = models.DateField()
    expiry_date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available', db_index=True)
    storage_fridge = models.CharField(max_length=50, default='Blood Bank Cold Storage Unit 1')

    class Meta:
        ordering = ['expiry_date']

    def __str__(self):
        return f"{self.unit_number} - {self.blood_group} {self.component_type} ({self.status})"

class BloodRequest(models.Model):
    PRIORITY_CHOICES = [
        ('Routine', 'Routine (Elective)'),
        ('Urgent', 'Urgent (Within 4 hrs)'),
        ('Emergency', 'Emergency / STAT (Immediate)'),
    ]
    STATUS_CHOICES = [
        ('Requested', 'Requested'),
        ('Cross-Matched', 'Cross-Matched & Reserved'),
        ('Issued', 'Issued to OT/ICU'),
        ('Completed', 'Transfused'),
        ('Cancelled', 'Cancelled'),
    ]

    request_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='blood_requests')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='blood_requests')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='blood_requests')
    blood_group = models.CharField(max_length=10)
    component_type = models.CharField(max_length=30, default='PRBC')
    units_requested = models.PositiveIntegerField(default=1)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Urgent')
    clinical_indication = models.TextField(default='Post-op blood loss / acute anemia')
    cross_match_result = models.CharField(max_length=50, default='Pending')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Requested', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request_number} - {self.units_requested} units {self.blood_group} for {self.patient.full_name}"
