from django.db import models
from apps.appointments.models import Appointment
from apps.patients.models import Patient
from apps.doctors.models import Doctor

class TelemedicineSession(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Room Ready', 'Room Ready'),
        ('Active', 'Active Call'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='telemedicine_session')
    room_id = models.CharField(max_length=100, unique=True, db_index=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='telemedicine_sessions')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='telemedicine_sessions')
    scheduled_start = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    call_duration_seconds = models.PositiveIntegerField(default=0)
    doctor_notes = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Telemed Room {self.room_id}: {self.patient.full_name} with {self.doctor.full_name}"
