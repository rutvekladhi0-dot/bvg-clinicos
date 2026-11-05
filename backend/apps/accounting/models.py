from django.db import models
from apps.doctors.models import Doctor
from apps.core.models import Branch, User

class AccountHead(models.Model):
    TYPE_CHOICES = [
        ('Revenue', 'Revenue / Income'),
        ('Expense', 'Operating Expense'),
        ('Asset', 'Asset'),
        ('Liability', 'Liability'),
    ]
    name = models.CharField(max_length=150)
    account_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"[{self.code}] {self.name} ({self.account_type})"

class TransactionVoucher(models.Model):
    TYPE_CHOICES = [
        ('Receipt', 'Receipt (Income)'),
        ('Payment', 'Payment (Expense)'),
        ('Journal', 'Journal Voucher'),
    ]
    voucher_number = models.CharField(max_length=50, unique=True, db_index=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='vouchers')
    account_head = models.ForeignKey(AccountHead, on_delete=models.CASCADE, related_name='transactions')
    voucher_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=30, default='Bank Transfer')
    reference_no = models.CharField(max_length=100, blank=True)
    narration = models.TextField()
    date = models.DateField(db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.voucher_number} - {self.voucher_type} Rs. {self.amount} ({self.account_head.name})"

class DoctorCommission(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='commissions')
    month = models.PositiveIntegerField()
    year = models.PositiveIntegerField()
    total_consultations = models.PositiveIntegerField(default=0)
    total_billed_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    commission_rate_percent = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default='Approved', choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Disbursed', 'Disbursed')])
    disbursed_at = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('doctor', 'month', 'year')
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.doctor.full_name} - {self.month}/{self.year}: Rs. {self.commission_amount}"
