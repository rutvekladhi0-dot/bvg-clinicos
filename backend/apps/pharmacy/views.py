import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import F, Sum, Count
from .models import MedicineCategory, Supplier, Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
from .serializers import (
    MedicineCategorySerializer, SupplierSerializer, MedicineSerializer,
    MedicineBatchSerializer, PharmacySaleSerializer
)
from apps.billing.models import Invoice, InvoiceItem
from apps.core.models import Branch

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

    def create(self, request, *args, **kwargs):
        data = request.data
        name = data.get('name', '').strip()
        generic_name = data.get('generic_name', '').strip()
        category_val = data.get('category')
        dosage_form = data.get('dosage_form', 'Tablet')
        strength = data.get('strength', '500mg').strip()
        manufacturer = data.get('manufacturer', 'Sun Pharma').strip()
        hsn_code = data.get('hsn_code', '3004').strip()
        gst_rate = data.get('gst_rate', 12.00)
        reorder_threshold = data.get('reorder_threshold', 50)

        if not name:
            return Response({'error': 'Medicine name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve Category
        category = None
        if isinstance(category_val, int) or (isinstance(category_val, str) and category_val.isdigit()):
            category = MedicineCategory.objects.filter(id=int(category_val)).first()
        elif isinstance(category_val, str) and category_val:
            category, _ = MedicineCategory.objects.get_or_create(name=category_val)

        if not category:
            category = MedicineCategory.objects.first()
            if not category:
                category = MedicineCategory.objects.create(name='General Medicines')

        medicine = Medicine.objects.create(
            name=name,
            generic_name=generic_name,
            category=category,
            dosage_form=dosage_form,
            strength=strength,
            manufacturer=manufacturer,
            hsn_code=hsn_code,
            gst_rate=gst_rate,
            reorder_threshold=reorder_threshold
        )

        # Optional initial batch creation
        batch_number = data.get('batch_number')
        if batch_number:
            branch_id = data.get('branch')
            branch = Branch.objects.filter(id=branch_id).first() or Branch.objects.first()
            expiry_date = data.get('expiry_date') or (datetime.date.today() + datetime.timedelta(days=730)).isoformat()
            purchase_rate = data.get('purchase_rate', 50.00)
            mrp = data.get('mrp', 100.00)
            selling_price = data.get('selling_price', 90.00)
            current_stock = data.get('current_stock', 100)

            MedicineBatch.objects.create(
                medicine=medicine,
                branch=branch,
                batch_number=batch_number,
                barcode=f"MED-{medicine.id}-{batch_number}",
                expiry_date=expiry_date,
                purchase_rate=purchase_rate,
                mrp=mrp,
                selling_price=selling_price,
                current_stock=current_stock
            )

        return Response(MedicineSerializer(medicine).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='monthly-analytics')
    def monthly_analytics(self, request):
        branch_id = request.query_params.get('branch')

        # Get sales items
        items_qs = PharmacySaleItem.objects.select_related('sale', 'batch__medicine', 'batch__medicine__category')
        if branch_id:
            items_qs = items_qs.filter(sale__branch_id=branch_id)

        # Group sales by month and medicine
        months_map = {}
        overall_meds = {}
        category_map = {}

        # Default months in 2026 for rich baseline analytics
        month_names = [
            'January 2026', 'February 2026', 'March 2026', 'April 2026',
            'May 2026', 'June 2026', 'July 2026', 'August 2026',
            'September 2026', 'October 2026', 'November 2026'
        ]

        # Aggregate database items
        for item in items_qs:
            month_str = item.sale.created_at.strftime('%B %Y')
            med_name = item.batch.medicine.name
            cat_name = item.batch.medicine.category.name if item.batch.medicine.category else 'General'
            qty = item.quantity
            rev = float(item.total_price)

            if month_str not in months_map:
                months_map[month_str] = {'month': month_str, 'medicines': {}, 'total_units': 0, 'total_revenue': 0.0}

            if med_name not in months_map[month_str]['medicines']:
                months_map[month_str]['medicines'][med_name] = {
                    'name': med_name,
                    'category': cat_name,
                    'units_sold': 0,
                    'revenue': 0.0,
                    'unit_price': float(item.unit_price)
                }

            months_map[month_str]['medicines'][med_name]['units_sold'] += qty
            months_map[month_str]['medicines'][med_name]['revenue'] += rev
            months_map[month_str]['total_units'] += qty
            months_map[month_str]['total_revenue'] += rev

            # Overall
            if med_name not in overall_meds:
                overall_meds[med_name] = {'name': med_name, 'category': cat_name, 'units_sold': 0, 'revenue': 0.0}
            overall_meds[med_name]['units_sold'] += qty
            overall_meds[med_name]['revenue'] += rev

            # Category
            category_map[cat_name] = category_map.get(cat_name, 0) + qty

        # Format monthly data
        formatted_months = []
        for m_name, m_val in months_map.items():
            top_list = sorted(m_val['medicines'].values(), key=lambda x: x['units_sold'], reverse=True)
            formatted_months.append({
                'month': m_name,
                'total_units': m_val['total_units'],
                'total_revenue': round(m_val['total_revenue'], 2),
                'top_medicines': top_list[:10]
            })

        top_overall = sorted(overall_meds.values(), key=lambda x: x['units_sold'], reverse=True)[:10]

        return Response({
            'months': list(months_map.keys()),
            'monthly_data': formatted_months,
            'top_overall_medicines': top_overall,
            'category_distribution': category_map
        })

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
