import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import LabCategory, LabTest, LabOrder, LabOrderItem
from .serializers import LabCategorySerializer, LabTestSerializer, LabOrderSerializer, LabOrderItemSerializer
from apps.patients.models import PatientTimeline
from apps.billing.models import Invoice, InvoiceItem

class LabCategoryViewSet(viewsets.ModelViewSet):
    queryset = LabCategory.objects.all()
    serializer_class = LabCategorySerializer
    permission_classes = [permissions.AllowAny]

class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'test_code']
    ordering_fields = ['name', 'standard_fee']

    def get_queryset(self):
        qs = LabTest.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

class LabOrderViewSet(viewsets.ModelViewSet):
    queryset = LabOrder.objects.all()
    serializer_class = LabOrderSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['order_number', 'patient__first_name', 'patient__last_name', 'patient__uhid']
    ordering_fields = ['created_at', 'status']

    def get_queryset(self):
        qs = LabOrder.objects.all()
        branch_id = self.request.query_params.get('branch')
        status_param = self.request.query_params.get('status')
        patient_id = self.request.query_params.get('patient')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_order = LabOrder.objects.filter(order_number__startswith=f"LAB-{year}-").order_by('-id').first()
        if last_order:
            try:
                last_num = int(last_order.order_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = LabOrder.objects.count() + 1001
        else:
            new_num = 1001

        order_number = f"LAB-{year}-{new_num:04d}"
        order = serializer.save(order_number=order_number)

        # Log timeline
        PatientTimeline.objects.create(
            patient=order.patient,
            event_type='Laboratory',
            title=f"Lab Order Placed ({order.order_number})",
            description=f"Referred by {order.doctor.full_name}",
            reference_id=order.order_number
        )

    @action(detail=True, methods=['post'], url_path='collect-sample')
    def collect_sample(self, request, pk=None):
        order = self.get_object()
        order.status = 'Sample Collected'
        order.sample_collected_at = timezone.now()
        order.sample_barcode = f"BAR-{order.order_number}"
        order.save()
        return Response(LabOrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_order(self, request, pk=None):
        order = self.get_object()
        order.status = 'Approved'
        order.approved_at = timezone.now()
        if request.user.is_authenticated:
            order.approved_by = request.user
        order.save()

        # Generate Billing Invoice for lab tests
        total_fee = sum(item.test.standard_fee for item in order.items.all())
        if total_fee > 0:
            year = datetime.date.today().year
            inv_count = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").count() + 1
            inv_number = f"INV-{year}-{inv_count:04d}"

            invoice = Invoice.objects.create(
                invoice_number=inv_number,
                patient=order.patient,
                branch=order.branch,
                invoice_type='Laboratory',
                subtotal=total_fee,
                tax_rate=0.00,
                tax_amount=0.00,
                discount=0.00,
                total_amount=total_fee,
                paid_amount=0.00,
                balance_amount=total_fee,
                status='Unpaid',
                notes=f"Lab Tests for Order {order.order_number}"
            )
            for item in order.items.all():
                InvoiceItem.objects.create(
                    invoice=invoice,
                    service_category='Laboratory Investigation',
                    description=f"{item.test.name} ({item.test.test_code})",
                    quantity=1,
                    unit_price=item.test.standard_fee,
                    total_price=item.test.standard_fee
                )

        return Response(LabOrderSerializer(order).data)
