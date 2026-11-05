from django.db import models
from apps.core.models import User, Department, Branch

class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='staff_members')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    designation = models.CharField(max_length=150)
    joining_date = models.DateField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=35000.00)
    bank_name = models.CharField(max_length=100, blank=True, default='State Bank of India')
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.employee_id} - {self.designation})"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Late', 'Late'),
        ('Half Day', 'Half Day'),
        ('On Leave', 'On Leave'),
        ('Absent', 'Absent'),
    ]
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('staff', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.staff.user.get_full_name()} - {self.date}: {self.status}"

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=50, default='Casual Leave')
    start_date = models.DateField()
    end_date = models.DateField()
    days_count = models.PositiveIntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.staff.user.get_full_name()} - {self.leave_type} ({self.status})"

class PayrollRecord(models.Model):
    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='payrolls')
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=5000.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=2500.00)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=20, default='Paid', choices=[('Pending', 'Pending'), ('Paid', 'Paid')])
    paid_at = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('staff', 'month', 'year')
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.staff.user.get_full_name()} - {self.month}/{self.year}: Rs. {self.net_salary}"
