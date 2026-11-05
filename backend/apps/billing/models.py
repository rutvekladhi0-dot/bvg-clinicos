from django.db import models
from apps.patients.models import Patient
from apps.core.models import Branch, User

class Invoice(models.Model):
    TYPE_CHOICES = [
        ('OPD', 'OPD Consultation Bill'),
        ('IPD', 'IPD Hospitalization Bill'),
        ('Pharmacy', 'Pharmacy Bill'),
        ('Laboratory', 'Laboratory Bill'),
        ('Radiology', 'Radiology Bill'),
        ('Surgery', 'Surgery & OT Bill'),
        ('Emergency', 'Emergency Care Bill'),
    ]
    STATUS_CHOICES = [
        ('Unpaid', 'Unpaid'),
        ('Partially Paid', 'Partially Paid'),
        ('Paid', 'Paid'),
        ('Cancelled', 'Cancelled'),
        ('Refunded', 'Refunded'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='invoices')
    invoice_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='OPD')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # GST %
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    balance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='Unpaid', db_index=True)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} - {self.patient.full_name} (Rs. {self.total_amount})"

    def recalculate_totals(self):
        items_total = sum(item.total_price for item in self.items.all())
        self.subtotal = items_total
        self.tax_amount = (self.subtotal - self.discount) * (self.tax_rate / 100)
        self.total_amount = max(0, self.subtotal - self.discount + self.tax_amount)
        self.balance_amount = max(0, self.total_amount - self.paid_amount)
        if self.balance_amount <= 0 and self.total_amount > 0:
            self.status = 'Paid'
        elif self.paid_amount > 0 and self.balance_amount > 0:
            self.status = 'Partially Paid'
        elif self.total_amount > 0 and self.paid_amount == 0:
            self.status = 'Unpaid'
        self.save()

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    service_category = models.CharField(max_length=100, default='Consultation')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x {self.quantity} = Rs. {self.total_price}"

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('Cash', 'Cash'),
        ('UPI', 'UPI / QR Code'),
        ('Card', 'Credit / Debit Card'),
        ('NetBanking', 'Internet Banking'),
        ('Insurance', 'Insurance TPA Cashless'),
        ('Cheque', 'Bank Cheque / DD'),
    ]

    payment_number = models.CharField(max_length=50, unique=True, db_index=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHODS, default='UPI')
    transaction_reference = models.CharField(max_length=100, blank=True, help_text="UPI Reference or Bank Txn ID")
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.payment_number}: Rs. {self.amount} for {self.invoice.invoice_number}"
