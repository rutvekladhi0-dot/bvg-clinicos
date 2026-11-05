import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from .models import InsuranceProvider, PatientInsurance, InsuranceClaim
from .serializers import InsuranceProviderSerializer, PatientInsuranceSerializer, InsuranceClaimSerializer

class InsuranceProviderViewSet(viewsets.ModelViewSet):
    queryset = InsuranceProvider.objects.all()
    serializer_class = InsuranceProviderSerializer
    permission_classes = [permissions.AllowAny]

class PatientInsuranceViewSet(viewsets.ModelViewSet):
    queryset = PatientInsurance.objects.all()
    serializer_class = PatientInsuranceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = PatientInsurance.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

class InsuranceClaimViewSet(viewsets.ModelViewSet):
    queryset = InsuranceClaim.objects.all()
    serializer_class = InsuranceClaimSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['claim_number', 'patient__first_name', 'patient__last_name', 'insurance__policy_number']
    ordering_fields = ['submission_date', 'claimed_amount']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_clm = InsuranceClaim.objects.filter(claim_number__startswith=f"CLM-{year}-").order_by('-id').first()
        if last_clm:
            try:
                last_num = int(last_clm.claim_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = InsuranceClaim.objects.count() + 101
        else:
            new_num = 101

        claim_number = f"CLM-{year}-{new_num:04d}"
        serializer.save(claim_number=claim_number)
