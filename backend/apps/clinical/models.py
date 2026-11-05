from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment
from apps.core.models import Branch

class OPDConsultation(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultation')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='consultations')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='consultations')
    
    # Vitals
    systolic_bp = models.PositiveIntegerField(null=True, blank=True, default=120)
    diastolic_bp = models.PositiveIntegerField(null=True, blank=True, default=80)
    heart_rate = models.PositiveIntegerField(null=True, blank=True, default=72)
    temperature_f = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, default=98.6)
    spo2 = models.PositiveIntegerField(null=True, blank=True, default=98)
    respiratory_rate = models.PositiveIntegerField(null=True, blank=True, default=16)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=68.5)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=172.0)
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, default=23.1)

    # Clinical Notes & Diagnosis
    chief_complaint = models.TextField()
    history_of_present_illness = models.TextField(blank=True)
    examination_findings = models.TextField(blank=True)
    diagnosis = models.CharField(max_length=255)
    icd10_code = models.CharField(max_length=50, blank=True, default='R50.9')
    clinical_notes = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    consultation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-consultation_date']

    def __str__(self):
        return f"Consultation for {self.patient.full_name} by {self.doctor.full_name} ({self.consultation_date.strftime('%Y-%m-%d')})"

class Prescription(models.Model):
    prescription_number = models.CharField(max_length=50, unique=True, db_index=True)
    consultation = models.ForeignKey(OPDConsultation, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='prescriptions')
    diet_instructions = models.TextField(blank=True, default="Drink plenty of fluids. Low salt diet.")
    general_advice = models.TextField(blank=True, default="Rest adequately. Contact immediately in case of emergency.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.prescription_number} - {self.patient.full_name}"

class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine_name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True)
    dosage = models.CharField(max_length=100, default='500mg')
    frequency = models.CharField(max_length=100, default='1-0-1 (After Food)')
    duration_days = models.PositiveIntegerField(default=5)
    instructions = models.CharField(max_length=255, blank=True, default='Take with warm water after food')

    def __str__(self):
        return f"{self.medicine_name} ({self.dosage}) - {self.frequency} x {self.duration_days} days"
