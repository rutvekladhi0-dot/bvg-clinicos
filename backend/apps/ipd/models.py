from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.core.models import Branch, User

class Ward(models.Model):
    WARD_TYPES = [
        ('General', 'General Ward'),
        ('Semi-Private', 'Semi-Private'),
        ('Private', 'Private Room'),
        ('Deluxe', 'Deluxe Room'),
        ('ICU', 'Intensive Care Unit (ICU)'),
        ('CCU', 'Coronary Care Unit (CCU)'),
        ('NICU', 'Neonatal ICU'),
        ('Emergency', 'Emergency Observation'),
    ]
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='wards')
    name = models.CharField(max_length=100)
    ward_type = models.CharField(max_length=30, choices=WARD_TYPES, default='General')
    floor = models.CharField(max_length=50, default='1st Floor')
    total_beds = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.get_ward_type_display()} ({self.branch.name})"

class Bed(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Occupied', 'Occupied'),
        ('Maintenance', 'Maintenance'),
        ('Reserved', 'Reserved'),
    ]
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name='beds')
    bed_number = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available', db_index=True)
    daily_charge = models.DecimalField(max_digits=10, decimal_places=2, default=1500.00)
    features = models.CharField(max_length=255, default='Oxygen Port, Cardiac Monitor Point')

    class Meta:
        unique_together = ('ward', 'bed_number')
        ordering = ['bed_number']

    def __str__(self):
        return f"{self.ward.name} - Bed {self.bed_number} ({self.status})"

class Admission(models.Model):
    STATUS_CHOICES = [
        ('Admitted', 'Admitted'),
        ('Discharged', 'Discharged'),
        ('Transferred', 'Transferred'),
    ]
    DISCHARGE_CONDITIONS = [
        ('Stable', 'Stable'),
        ('Improved', 'Improved'),
        ('Transferred to Higher Center', 'Transferred to Higher Center'),
        ('LAMA / DAMA', 'Leave/Discharge Against Medical Advice'),
    ]

    admission_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='admissions')
    primary_doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='admissions')
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name='admissions')
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE, related_name='admissions')
    admission_date = models.DateTimeField(db_index=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    admission_reason = models.TextField()
    diagnosis = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Admitted', db_index=True)
    discharge_condition = models.CharField(max_length=50, choices=DISCHARGE_CONDITIONS, blank=True)
    discharge_summary = models.TextField(blank=True)
    treatment_given = models.TextField(blank=True)
    follow_up_advice = models.TextField(blank=True)

    class Meta:
        ordering = ['-admission_date']

    def __str__(self):
        return f"{self.admission_number} - {self.patient.full_name} ({self.ward.name} Bed {self.bed.bed_number})"

class NursingNote(models.Model):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='nursing_notes')
    nurse = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nursing_notes')
    note_type = models.CharField(max_length=50, default='Routine Vitals & Rounds')
    observation = models.TextField()
    vitals_summary = models.CharField(max_length=200, blank=True, help_text="BP: 120/80, HR: 74, SpO2: 98%, Temp: 98.4F")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by {self.nurse.get_full_name()} for {self.admission.patient.full_name} on {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class MedicationAdministration(models.Model):
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='mar_records')
    medicine_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    route = models.CharField(max_length=50, default='Oral') # Oral, IV, IM, SC, Inhalation
    scheduled_time = models.DateTimeField()
    administered_time = models.DateTimeField(null=True, blank=True)
    administered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, default='Scheduled', choices=[('Scheduled', 'Scheduled'), ('Given', 'Given'), ('Missed', 'Missed'), ('Refused', 'Refused')])
    notes = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.medicine_name} for {self.admission.patient.full_name} ({self.status})"
