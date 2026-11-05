import datetime
from decimal import Decimal
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Invoice, InvoiceItem, Payment
from .serializers import InvoiceSerializer, PaymentSerializer, InvoiceItemSerializer
from apps.patients.models import PatientTimeline

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'patient__first_name', 'patient__last_name', 'patient__uhid']
    ordering_fields = ['created_at', 'total_amount', 'status']

    def get_queryset(self):
        qs = Invoice.objects.all()
        branch_id = self.request.query_params.get('branch')
        status_param = self.request.query_params.get('status')
        invoice_type = self.request.query_params.get('invoice_type')
        patient_id = self.request.query_params.get('patient')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if invoice_type:
            qs = qs.filter(invoice_type=invoice_type)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_inv = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").order_by('-id').first()
        if last_inv:
            try:
                last_num = int(last_inv.invoice_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = Invoice.objects.count() + 1001
        else:
            new_num = 1001

        inv_number = f"INV-{year}-{new_num:04d}"
        invoice = serializer.save(invoice_number=inv_number)
        invoice.recalculate_totals()

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        amount = Decimal(str(request.data.get('amount', invoice.balance_amount)))
        payment_method = request.data.get('payment_method', 'Cash')
        transaction_reference = request.data.get('transaction_reference', '')
        notes = request.data.get('notes', '')

        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        year = datetime.date.today().year
        pay_count = Payment.objects.filter(payment_number__startswith=f"REC-{year}-").count() + 1
        pay_number = f"REC-{year}-{pay_count:04d}"

        payment = Payment.objects.create(
            payment_number=pay_number,
            invoice=invoice,
            amount=amount,
            payment_method=payment_method,
            transaction_reference=transaction_reference,
            notes=notes,
            received_by=request.user if request.user.is_authenticated else None
        )

        invoice.paid_amount += amount
        invoice.balance_amount = max(Decimal('0.00'), invoice.total_amount - invoice.paid_amount)
        if invoice.balance_amount == Decimal('0.00'):
            invoice.status = 'Paid'
        else:
            invoice.status = 'Partially Paid'
        invoice.save()

        # Log timeline
        PatientTimeline.objects.create(
            patient=invoice.patient,
            event_type='Payment',
            title=f"Payment Received: Rs. {amount} ({payment_method})",
            description=f"Receipt No: {payment.payment_number} for Invoice {invoice.invoice_number}",
            reference_id=payment.payment_number
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.AllowAny]
    ordering_fields = ['payment_date']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        pay_count = Payment.objects.filter(payment_number__startswith=f"REC-{year}-").count() + 1
        pay_number = f"REC-{year}-{pay_count:04d}"
        payment = serializer.save(payment_number=pay_number)

        invoice = payment.invoice
        invoice.paid_amount += payment.amount
        invoice.balance_amount = max(Decimal('0.00'), invoice.total_amount - invoice.paid_amount)
        if invoice.balance_amount == Decimal('0.00'):
            invoice.status = 'Paid'
        else:
            invoice.status = 'Partially Paid'
        invoice.save()

        PatientTimeline.objects.create(
            patient=invoice.patient,
            event_type='Payment',
            title=f"Payment Received: Rs. {payment.amount} ({payment.payment_method})",
            description=f"Receipt No: {payment.payment_number} for Invoice {invoice.invoice_number}",
            reference_id=payment.payment_number
        )
