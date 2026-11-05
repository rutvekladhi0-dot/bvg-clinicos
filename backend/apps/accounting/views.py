import datetime
from decimal import Decimal
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db.models import Sum
from .models import AccountHead, TransactionVoucher, DoctorCommission
from .serializers import AccountHeadSerializer, TransactionVoucherSerializer, DoctorCommissionSerializer

class AccountHeadViewSet(viewsets.ModelViewSet):
    queryset = AccountHead.objects.all()
    serializer_class = AccountHeadSerializer
    permission_classes = [permissions.AllowAny]

class TransactionVoucherViewSet(viewsets.ModelViewSet):
    queryset = TransactionVoucher.objects.all()
    serializer_class = TransactionVoucherSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['voucher_number', 'reference_no', 'narration', 'account_head__name']
    ordering_fields = ['date', 'amount']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_vch = TransactionVoucher.objects.filter(voucher_number__startswith=f"VCH-{year}-").order_by('-id').first()
        if last_vch:
            try:
                last_num = int(last_vch.voucher_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = TransactionVoucher.objects.count() + 101
        else:
            new_num = 101

        voucher_number = f"VCH-{year}-{new_num:04d}"
        serializer.save(voucher_number=voucher_number)

class DoctorCommissionViewSet(viewsets.ModelViewSet):
    queryset = DoctorCommission.objects.all()
    serializer_class = DoctorCommissionSerializer
    permission_classes = [permissions.AllowAny]

class FinancialSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        branch_id = request.query_params.get('branch')
        
        # Pull total revenue vouchers
        revenue_qs = TransactionVoucher.objects.filter(account_head__account_type='Revenue')
        expense_qs = TransactionVoucher.objects.filter(account_head__account_type='Expense')

        if branch_id:
            revenue_qs = revenue_qs.filter(branch_id=branch_id)
            expense_qs = expense_qs.filter(branch_id=branch_id)

        total_income = revenue_qs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        total_expenses = expense_qs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        net_profit = total_income - total_expenses

        # Also get Billing collected payments
        from apps.billing.models import Payment
        billing_payments = Payment.objects.all()
        if branch_id:
            billing_payments = billing_payments.filter(invoice__branch_id=branch_id)
        total_billing_collected = billing_payments.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

        return Response({
            'total_income': float(total_income + total_billing_collected),
            'voucher_income': float(total_income),
            'billing_collected': float(total_billing_collected),
            'total_expenses': float(total_expenses),
            'net_profit': float(total_income + total_billing_collected - total_expenses),
            'profit_margin_percent': round(float((net_profit / (total_income + total_billing_collected)) * 100), 2) if (total_income + total_billing_collected) > 0 else 0.0,
            'recent_vouchers': TransactionVoucherSerializer(TransactionVoucher.objects.all()[:5], many=True).data
        })
