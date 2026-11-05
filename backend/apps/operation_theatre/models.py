from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.core.models import Branch

class OTRoom(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='ot_rooms')
    room_number = models.CharField(max_length=50) # e.g. OT-1 (Modular Cardiac)
    floor = models.CharField(max_length=50, default='3rd Floor OT Complex')
    is_operational = models.BooleanField(default=True)
    equipment_details = models.TextField(blank=True, default="HEPA Filter Class 100, Anesthesia Station, Electrosurgical Unit")

    def __str__(self):
        return f"{self.room_number} ({self.branch.name})"

class Surgery(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('In Preparation', 'In Preparation'),
        ('In Progress', 'In Progress'),
        ('In Recovery', 'In Recovery'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    surgery_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='surgeries')
    lead_surgeon = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='lead_surgeries')
    assistant_surgeon = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='assistant_surgeries')
    anesthetist = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='anesthesia_surgeries')
    ot_room = models.ForeignKey(OTRoom, on_delete=models.CASCADE, related_name='surgeries')
    surgery_name = models.CharField(max_length=200)
    surgery_category = models.CharField(max_length=100, default='General Surgery')
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    anesthesia_type = models.CharField(max_length=100, default='General Anesthesia')
    pre_op_checklist_completed = models.BooleanField(default=True)
    who_surgical_safety_checklist = models.BooleanField(default=True)
    anesthesia_notes = models.TextField(blank=True)
    post_op_notes = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Scheduled', db_index=True)

    class Meta:
        ordering = ['scheduled_start']

    def __str__(self):
        return f"{self.surgery_number} - {self.surgery_name} for {self.patient.full_name}"

class OTEquipment(models.Model):
    STATUS_CHOICES = [
        ('Ready', 'Ready & Sterile'),
        ('In Use', 'In Use'),
        ('Under Sterilization', 'Under Sterilization'),
        ('Maintenance', 'Maintenance'),
    ]
    ot_room = models.ForeignKey(OTRoom, on_delete=models.CASCADE, related_name='equipment')
    name = models.CharField(max_length=150)
    serial_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Ready')
    last_sterilized_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status}) in {self.ot_room.room_number}"
