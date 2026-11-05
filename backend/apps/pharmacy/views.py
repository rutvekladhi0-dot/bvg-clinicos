import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import F, Sum
from .models import MedicineCategory, Supplier, Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
from .serializers import (
    MedicineCategorySerializer, SupplierSerializer, MedicineSerializer,
    MedicineBatchSerializer, PharmacySaleSerializer
)
from apps.billing.models import Invoice, InvoiceItem

class MedicineCategoryViewSet(viewsets.ModelViewSet):
    queryset = MedicineCategory.objects.all()
    serializer_class = MedicineCategorySerializer
    permission_classes = [permissions.AllowAny]

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.AllowAny]

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'generic_name', 'manufacturer']
    ordering_fields = ['name']

    def get_queryset(self):
        qs = Medicine.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

class MedicineBatchViewSet(viewsets.ModelViewSet):
    queryset = MedicineBatch.objects.all()
    serializer_class = MedicineBatchSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['batch_number', 'medicine__name', 'barcode']
    ordering_fields = ['expiry_date', 'current_stock']

    def get_queryset(self):
        qs = MedicineBatch.objects.all()
        branch_id = self.request.query_params.get('branch')
        medicine_id = self.request.query_params.get('medicine')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if medicine_id:
            qs = qs.filter(medicine_id=medicine_id)
        return qs

    @action(detail=False, methods=['get'], url_path='alerts')
    def stock_alerts(self, request):
        today = datetime.date.today()
        three_months = today + datetime.timedelta(days=90)

        # Low stock batches (less than 25 units)
        low_stock = MedicineBatch.objects.filter(current_stock__lte=25).order_by('current_stock')[:10]
        # Expiring soon (within 90 days)
        expiring_soon = MedicineBatch.objects.filter(expiry_date__lte=three_months, expiry_date__gte=today).order_by('expiry_date')[:10]
        # Expired
        expired = MedicineBatch.objects.filter(expiry_date__lt=today).order_by('expiry_date')[:10]

        return Response({
            'low_stock': MedicineBatchSerializer(low_stock, many=True).data,
            'expiring_soon': MedicineBatchSerializer(expiring_soon, many=True).data,
            'expired': MedicineBatchSerializer(expired, many=True).data,
            'low_stock_count': MedicineBatch.objects.filter(current_stock__lte=25).count(),
            'expiring_count': MedicineBatch.objects.filter(expiry_date__lte=three_months, expiry_date__gte=today).count(),
        })

class PharmacySaleViewSet(viewsets.ModelViewSet):
    queryset = PharmacySale.objects.all()
    serializer_class = PharmacySaleSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['sale_number', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['created_at']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_sale = PharmacySale.objects.filter(sale_number__startswith=f"PHM-{year}-").order_by('-id').first()
        if last_sale:
            try:
                last_num = int(last_sale.sale_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = PharmacySale.objects.count() + 1001
        else:
            new_num = 1001

        sale_number = f"PHM-{year}-{new_num:04d}"
        sale = serializer.save(sale_number=sale_number)

        # If patient is provided, generate corresponding billing invoice
        if sale.patient:
            inv_count = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").count() + 1
            inv_number = f"INV-{year}-{inv_count:04d}"

            invoice = Invoice.objects.create(
                invoice_number=inv_number,
                patient=sale.patient,
                branch=sale.branch,
                invoice_type='Pharmacy',
                subtotal=sale.subtotal,
                tax_rate=12.00,
                tax_amount=sale.tax_amount,
                discount=sale.discount_amount,
                total_amount=sale.net_amount,
                paid_amount=sale.net_amount if sale.payment_status == 'Paid' else 0.00,
                balance_amount=0.00 if sale.payment_status == 'Paid' else sale.net_amount,
                status='Paid' if sale.payment_status == 'Paid' else 'Unpaid',
                notes=f"Pharmacy Dispense Bill {sale.sale_number}"
            )
            for item in sale.items.all():
                InvoiceItem.objects.create(
                    invoice=invoice,
                    service_category='Pharmacy Medicine',
                    description=f"{item.batch.medicine.name} ({item.batch.medicine.strength})",
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price
                )
