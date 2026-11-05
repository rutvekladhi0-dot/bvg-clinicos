from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.core.models import Branch, User

class RadiologyModality(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True) # XR, CT, MRI, USG
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class RadiologyInvestigation(models.Model):
    modality = models.ForeignKey(RadiologyModality, on_delete=models.CASCADE, related_name='investigations')
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    preparation_instructions = models.TextField(blank=True, default='4 hours fasting required if contrast scan.')
    standard_fee = models.DecimalField(max_digits=10, decimal_places=2, default=1200.00)

    def __str__(self):
        return f"{self.code} - {self.name}"

class RadiologyOrder(models.Model):
    STATUS_CHOICES = [
        ('Requested', 'Requested'),
        ('Scheduled', 'Scheduled'),
        ('Scan Completed', 'Scan Completed'),
        ('Reported', 'Reported / Approved'),
        ('Cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='radiology_orders')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='radiology_orders')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='radiology_orders')
    investigation = models.ForeignKey(RadiologyInvestigation, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Requested', db_index=True)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    scan_completed_at = models.DateTimeField(null=True, blank=True)
    image_url = models.CharField(max_length=500, blank=True)
    findings = models.TextField(blank=True)
    impression = models.TextField(blank=True)
    radiologist = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_radiology')
    reported_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} - {self.investigation.name} for {self.patient.full_name}"
