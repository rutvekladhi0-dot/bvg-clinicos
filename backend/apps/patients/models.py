from django.db import models
from apps.core.models import Branch, User

class Patient(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    BLOOD_GROUPS = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
        ('Unknown', 'Unknown'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inpatient', 'Inpatient'),
        ('Discharged', 'Discharged'),
        ('Emergency', 'Emergency'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='patients')
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='patient_profile')
    uhid = models.CharField(max_length=50, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Male')
    blood_group = models.CharField(max_length=10, choices=BLOOD_GROUPS, default='Unknown')
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, default='Pune')
    pincode = models.CharField(max_length=10, blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)

    # Clinical Background
    allergies = models.TextField(blank=True, help_text="e.g. Penicillin, Peanuts, Sulfa drugs")
    chronic_conditions = models.TextField(blank=True, help_text="e.g. Type 2 Diabetes, Hypertension")
    medical_history = models.TextField(blank=True)
    family_medical_history = models.TextField(blank=True)
    current_medications = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-registered_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.full_name} ({self.uhid})"

class PatientDocument(models.Model):
    DOC_TYPES = [
        ('Lab Report', 'Lab Report'),
        ('Radiology', 'Radiology'),
        ('Prescription', 'Prescription'),
        ('Discharge Summary', 'Discharge Summary'),
        ('ID Proof', 'ID Proof'),
        ('Insurance Card', 'Insurance Card'),
        ('Other', 'Other'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOC_TYPES, default='Other')
    file_url = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.patient.uhid} - {self.title}"

class PatientTimeline(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=50) # Registration, Consultation, Lab, Prescription, Admission, Discharge, etc.
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    reference_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.uhid} - {self.event_type}: {self.title}"
