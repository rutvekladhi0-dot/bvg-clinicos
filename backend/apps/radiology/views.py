import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import RadiologyModality, RadiologyInvestigation, RadiologyOrder
from .serializers import RadiologyModalitySerializer, RadiologyInvestigationSerializer, RadiologyOrderSerializer
from apps.patients.models import PatientTimeline
from apps.billing.models import Invoice, InvoiceItem

class RadiologyModalityViewSet(viewsets.ModelViewSet):
    queryset = RadiologyModality.objects.all()
    serializer_class = RadiologyModalitySerializer
    permission_classes = [permissions.AllowAny]

class RadiologyInvestigationViewSet(viewsets.ModelViewSet):
    queryset = RadiologyInvestigation.objects.all()
    serializer_class = RadiologyInvestigationSerializer
    permission_classes = [permissions.AllowAny]

class RadiologyOrderViewSet(viewsets.ModelViewSet):
    queryset = RadiologyOrder.objects.all()
    serializer_class = RadiologyOrderSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['order_number', 'patient__first_name', 'patient__last_name', 'investigation__name']
    ordering_fields = ['created_at']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_rad = RadiologyOrder.objects.filter(order_number__startswith=f"RAD-{year}-").order_by('-id').first()
        if last_rad:
            try:
                last_num = int(last_rad.order_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = RadiologyOrder.objects.count() + 1001
        else:
            new_num = 1001

        order_number = f"RAD-{year}-{new_num:04d}"
        order = serializer.save(order_number=order_number)

        # Log timeline
        PatientTimeline.objects.create(
            patient=order.patient,
            event_type='Radiology',
            title=f"Radiology Request: {order.investigation.name}",
            description=f"Ordered by {order.doctor.full_name}",
            reference_id=order.order_number
        )

    @action(detail=True, methods=['post'], url_path='submit-report')
    def submit_report(self, request, pk=None):
        order = self.get_object()
        findings = request.data.get('findings', '')
        impression = request.data.get('impression', '')
        image_url = request.data.get('image_url', '')

        order.findings = findings
        order.impression = impression
        if image_url:
            order.image_url = image_url
        order.status = 'Reported'
        order.reported_at = timezone.now()
        if request.user.is_authenticated:
            order.radiologist = request.user
        order.save()

        # Generate billing invoice
        fee = order.investigation.standard_fee
        if fee > 0:
            year = datetime.date.today().year
            inv_count = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").count() + 1
            inv_number = f"INV-{year}-{inv_count:04d}"

            invoice = Invoice.objects.create(
                invoice_number=inv_number,
                patient=order.patient,
                branch=order.branch,
                invoice_type='Radiology',
                subtotal=fee,
                tax_rate=0.00,
                tax_amount=0.00,
                discount=0.00,
                total_amount=fee,
                paid_amount=0.00,
                balance_amount=fee,
                status='Unpaid',
                notes=f"Radiology Scan Bill {order.order_number} ({order.investigation.name})"
            )
            InvoiceItem.objects.create(
                invoice=invoice,
                service_category='Radiology Investigation',
                description=f"{order.investigation.name} ({order.investigation.code})",
                quantity=1,
                unit_price=fee,
                total_price=fee
            )

        return Response(RadiologyOrderSerializer(order).data)
