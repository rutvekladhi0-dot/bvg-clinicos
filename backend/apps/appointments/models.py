from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.core.models import Department, Branch

class Appointment(models.Model):
    TYPE_CHOICES = [
        ('Walk-in', 'Walk-in'),
        ('Scheduled', 'Scheduled'),
        ('Follow-up', 'Follow-up'),
        ('Telemedicine', 'Telemedicine'),
    ]
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Confirmed', 'Confirmed'),
        ('Checked-in', 'Checked-in'),
        ('In Consultation', 'In Consultation'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('No Show', 'No Show'),
    ]

    appointment_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='appointments')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateField(db_index=True)
    time_slot = models.CharField(max_length=20, default='10:00 AM')
    appointment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Scheduled')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='Scheduled', db_index=True)
    cancellation_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True, help_text="Chief complaints or symptoms")
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['appointment_date', 'time_slot']

    def __str__(self):
        return f"{self.appointment_number} - {self.patient.full_name} with {self.doctor.full_name} on {self.appointment_date}"
