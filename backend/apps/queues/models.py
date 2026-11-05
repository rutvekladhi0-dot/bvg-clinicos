from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment
from apps.core.models import Branch

class QueueToken(models.Model):
    PRIORITY_CHOICES = [
        ('Normal', 'Normal'),
        ('Senior Citizen', 'Senior Citizen'),
        ('Pediatric', 'Pediatric'),
        ('Emergency', 'Emergency'),
    ]
    STATUS_CHOICES = [
        ('Waiting', 'Waiting'),
        ('Serving', 'Serving'),
        ('Completed', 'Completed'),
        ('Skipped', 'Skipped'),
        ('Cancelled', 'Cancelled'),
    ]

    token_number = models.CharField(max_length=30, db_index=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='queue_tokens')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='queue_tokens')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='queue_tokens')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='tokens')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Normal')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Waiting', db_index=True)
    estimated_wait_minutes = models.PositiveIntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['priority', 'created_at']

    def __str__(self):
        return f"{self.token_number} - {self.patient.full_name} ({self.status}) for {self.doctor.full_name}"
