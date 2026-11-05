from django.db import models
from apps.patients.models import Patient
from apps.clinical.models import Prescription
from apps.core.models import Branch, User

class MedicineCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Medicine(models.Model):
    FORMS = [
        ('Tablet', 'Tablet'),
        ('Capsule', 'Capsule'),
        ('Syrup', 'Syrup / Suspension'),
        ('Injection', 'Injection / Infusion'),
        ('Ointment', 'Ointment / Gel'),
        ('Inhaler', 'Inhaler / Respule'),
        ('Drops', 'Drops'),
    ]
    category = models.ForeignKey(MedicineCategory, on_delete=models.CASCADE, related_name='medicines')
    name = models.CharField(max_length=200, db_index=True)
    generic_name = models.CharField(max_length=200, blank=True, db_index=True)
    dosage_form = models.CharField(max_length=30, choices=FORMS, default='Tablet')
    strength = models.CharField(max_length=100, default='500mg')
    manufacturer = models.CharField(max_length=150, default='Sun Pharma')
    hsn_code = models.CharField(max_length=20, default='3004')
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12.00)
    reorder_threshold = models.PositiveIntegerField(default=50)

    def __str__(self):
        return f"{self.name} ({self.strength})"

class MedicineBatch(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='batches')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='medicine_batches')
    batch_number = models.CharField(max_length=50, db_index=True)
    barcode = models.CharField(max_length=50, blank=True)
    expiry_date = models.DateField(db_index=True)
    purchase_rate = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=85.00)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=75.00)
    current_stock = models.IntegerField(default=100)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['expiry_date']

    def __str__(self):
        return f"{self.medicine.name} [Batch: {self.batch_number}] - Stock: {self.current_stock}"

class PharmacySale(models.Model):
    sale_number = models.CharField(max_length=50, unique=True, db_index=True)
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='pharmacy_purchases')
    prescription = models.ForeignKey(Prescription, on_delete=models.SET_NULL, null=True, blank=True, related_name='pharmacy_sales')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='pharmacy_sales')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(max_length=20, default='Paid', choices=[('Paid', 'Paid'), ('Pending', 'Pending'), ('Refunded', 'Refunded')])
    payment_method = models.CharField(max_length=30, default='Cash')
    sold_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sale_number} - Rs. {self.net_amount}"

class PharmacySaleItem(models.Model):
    sale = models.ForeignKey(PharmacySale, on_delete=models.CASCADE, related_name='items')
    batch = models.ForeignKey(MedicineBatch, on_delete=models.CASCADE, related_name='sale_items')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.batch.medicine.name} x {self.quantity}"
