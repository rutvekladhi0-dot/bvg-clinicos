from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.ipd.models import Admission, Bed
from apps.core.models import Branch, User

class EmergencyCase(models.Model):
    TRIAGE_LEVELS = [
        ('Red', 'Red - Resuscitation (Immediate Life Threat)'),
        ('Orange', 'Orange - Very Urgent (Within 10 mins)'),
        ('Yellow', 'Yellow - Urgent (Within 30 mins)'),
        ('Green', 'Green - Standard (Non-urgent)'),
    ]
    STATUS_CHOICES = [
        ('Triage', 'Triage & Assessment'),
        ('Under Treatment', 'Under Emergency Treatment'),
        ('Shifted to ICU', 'Shifted to ICU'),
        ('Shifted to OT', 'Shifted to OT'),
        ('Admitted to Ward', 'Admitted to Ward'),
        ('Discharged', 'Discharged'),
        ('Transferred', 'Transferred to Higher Center'),
    ]

    case_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='emergency_cases')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='emergency_cases')
    attending_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='emergency_cases')
    triage_level = models.CharField(max_length=20, choices=TRIAGE_LEVELS, default='Yellow', db_index=True)
    arrival_mode = models.CharField(max_length=50, default='Ambulance 108') # Ambulance, Private Vehicle, Walk-in
    chief_complaint = models.TextField()
    gcs_score = models.PositiveIntegerField(default=15, help_text="Glasgow Coma Scale 3-15")
    systolic_bp = models.PositiveIntegerField(default=120)
    diastolic_bp = models.PositiveIntegerField(default=80)
    pulse = models.PositiveIntegerField(default=88)
    spo2 = models.PositiveIntegerField(default=96)
    temp_f = models.DecimalField(max_digits=4, decimal_places=1, default=98.6)
    initial_management = models.TextField(blank=True, default="Supplemental O2 initiated. IV access secured.")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Triage')
    arrival_time = models.DateTimeField(auto_now_add=True)
    resolved_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-arrival_time']

    def __str__(self):
        return f"{self.case_number} - {self.patient.full_name} [{self.triage_level}]"

class VitalMonitoringRecord(models.Model):
    emergency_case = models.ForeignKey(EmergencyCase, on_delete=models.SET_NULL, null=True, blank=True, related_name='vital_logs')
    admission = models.ForeignKey(Admission, on_delete=models.SET_NULL, null=True, blank=True, related_name='vital_logs')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    heart_rate = models.PositiveIntegerField()
    systolic_bp = models.PositiveIntegerField()
    diastolic_bp = models.PositiveIntegerField()
    spo2 = models.PositiveIntegerField()
    respiratory_rate = models.PositiveIntegerField(default=18)
    ventilator_mode = models.CharField(max_length=50, blank=True, default='Room Air')
    critical_alert = models.BooleanField(default=False)
    alert_notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Vitals @ {self.recorded_at.strftime('%H:%M')} (HR:{self.heart_rate}, BP:{self.systolic_bp}/{self.diastolic_bp}, SpO2:{self.spo2}%)"
