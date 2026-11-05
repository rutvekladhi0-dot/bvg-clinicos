from django.db import models
from apps.core.models import User, Department, Branch

class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='doctors')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='doctors')
    specialization = models.CharField(max_length=150)
    qualification = models.CharField(max_length=200, help_text="e.g. MBBS, MD, DM (Cardiology)")
    registration_council_number = models.CharField(max_length=100)
    experience_years = models.PositiveIntegerField(default=5)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    follow_up_fee = models.DecimalField(max_digits=10, decimal_places=2, default=300.00)
    telemedicine_fee = models.DecimalField(max_digits=10, decimal_places=2, default=600.00)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    room_number = models.CharField(max_length=30, blank=True, default='OPD-101')
    is_available = models.BooleanField(default=True)
    bio = models.TextField(blank=True)

    @property
    def full_name(self):
        return f"Dr. {self.user.get_full_name() or self.user.username}"

    def __str__(self):
        return f"{self.full_name} ({self.specialization})"

class DoctorSchedule(models.Model):
    DAYS = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=20, choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=15)
    max_patients = models.PositiveIntegerField(default=25)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('doctor', 'day_of_week')

    def __str__(self):
        return f"{self.doctor.full_name} - {self.day_of_week} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"
