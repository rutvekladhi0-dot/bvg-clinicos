from django.db import models
from apps.patients.models import Patient
from apps.billing.models import Invoice

class InsuranceProvider(models.Model):
    name = models.CharField(max_length=200)
    tpa_name = models.CharField(max_length=200, blank=True, help_text="Third Party Administrator")
    contact_phone = models.CharField(max_length=50)
    contact_email = models.EmailField(blank=True)
    cashless_available = models.BooleanField(default=True)
    claim_portal_url = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.name} ({self.tpa_name})" if self.tpa_name else self.name

class PatientInsurance(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='insurances')
    provider = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE, related_name='patient_policies')
    policy_number = models.CharField(max_length=100)
    card_id = models.CharField(max_length=100)
    sum_insured = models.DecimalField(max_digits=12, decimal_places=2, default=500000.00)
    valid_from = models.DateField()
    valid_till = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.patient.full_name} - {self.provider.name} (Policy: {self.policy_number})"

class InsuranceClaim(models.Model):
    STATUS_CHOICES = [
        ('Initiated', 'Pre-Auth Initiated'),
        ('Pre-Auth Approved', 'Pre-Auth Approved'),
        ('Query Raised', 'Query Raised by TPA'),
        ('Final Billing Submitted', 'Final Billing Submitted'),
        ('Approved', 'Approved'),
        ('Settled', 'Settled & Disbursed'),
        ('Rejected', 'Rejected'),
    ]

    claim_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='claims')
    insurance = models.ForeignKey(PatientInsurance, on_delete=models.CASCADE, related_name='claims')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='claims')
    tpa_reference_no = models.CharField(max_length=100, blank=True)
    claimed_amount = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Initiated', db_index=True)
    remarks = models.TextField(blank=True)
    submission_date = models.DateTimeField(auto_now_add=True)
    settled_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-submission_date']

    def __str__(self):
        return f"{self.claim_number} - {self.patient.full_name} ({self.status}) Rs. {self.claimed_amount}"
