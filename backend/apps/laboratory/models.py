from django.db import models
from apps.patients.models import Patient
from apps.doctors.models import Doctor
from apps.core.models import Branch, User

class LabCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class LabTest(models.Model):
    category = models.ForeignKey(LabCategory, on_delete=models.CASCADE, related_name='tests')
    test_code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=150)
    sample_type = models.CharField(max_length=50, default='Whole Blood EDTA')
    standard_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    turnaround_hours = models.PositiveIntegerField(default=4)
    reference_interval = models.TextField(blank=True, default='Normal range varies by age/gender')
    unit = models.CharField(max_length=30, blank=True, default='mg/dL')

    def __str__(self):
        return f"{self.test_code} - {self.name}"

class LabOrder(models.Model):
    STATUS_CHOICES = [
        ('Ordered', 'Ordered'),
        ('Sample Collected', 'Sample Collected'),
        ('In Testing', 'In Testing'),
        ('Results Entered', 'Results Entered'),
        ('Approved', 'Approved / Published'),
        ('Cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_orders')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='lab_orders')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='lab_orders')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Ordered', db_index=True)
    sample_collected_at = models.DateTimeField(null=True, blank=True)
    sample_barcode = models.CharField(max_length=50, blank=True)
    technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_labs')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_labs')
    approved_at = models.DateTimeField(null=True, blank=True)
    clinical_remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} - {self.patient.full_name} ({self.status})"

class LabOrderItem(models.Model):
    order = models.ForeignKey(LabOrder, on_delete=models.CASCADE, related_name='items')
    test = models.ForeignKey(LabTest, on_delete=models.CASCADE, related_name='order_items')
    result_value = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=30, blank=True)
    reference_interval = models.CharField(max_length=150, blank=True)
    is_abnormal = models.BooleanField(default=False)
    technician_notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.test.name}: {self.result_value} {self.unit}"
