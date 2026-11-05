import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import BloodDonor, BloodUnit, BloodRequest
from .serializers import BloodDonorSerializer, BloodUnitSerializer, BloodRequestSerializer

class BloodDonorViewSet(viewsets.ModelViewSet):
    queryset = BloodDonor.objects.all()
    serializer_class = BloodDonorSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['name', 'blood_group', 'phone']

class BloodUnitViewSet(viewsets.ModelViewSet):
    queryset = BloodUnit.objects.all()
    serializer_class = BloodUnitSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['unit_number', 'blood_group', 'component_type']
    ordering_fields = ['expiry_date']

    def get_queryset(self):
        qs = BloodUnit.objects.all()
        blood_group = self.request.query_params.get('blood_group')
        status_param = self.request.query_params.get('status')
        component_type = self.request.query_params.get('component_type')
        if blood_group:
            qs = qs.filter(blood_group=blood_group)
        if status_param:
            qs = qs.filter(status=status_param)
        if component_type:
            qs = qs.filter(component_type=component_type)
        return qs

    @action(detail=False, methods=['get'], url_path='summary')
    def blood_group_summary(self, request):
        groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        summary = {}
        for g in groups:
            avail = BloodUnit.objects.filter(blood_group=g, status='Available').count()
            reserved = BloodUnit.objects.filter(blood_group=g, status='Reserved').count()
            summary[g] = {
                'available': avail,
                'reserved': reserved,
                'total': avail + reserved,
                'status': 'Critical' if avail < 3 else ('Moderate' if avail < 8 else 'Optimal')
            }
        return Response(summary)

class BloodRequestViewSet(viewsets.ModelViewSet):
    queryset = BloodRequest.objects.all()
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['request_number', 'patient__first_name', 'patient__last_name', 'blood_group']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_req = BloodRequest.objects.filter(request_number__startswith=f"BRQ-{year}-").order_by('-id').first()
        if last_req:
            try:
                last_num = int(last_req.request_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = BloodRequest.objects.count() + 101
        else:
            new_num = 101

        request_number = f"BRQ-{year}-{new_num:04d}"
        serializer.save(request_number=request_number)

    @action(detail=True, methods=['post'], url_path='cross-match')
    def cross_match(self, request, pk=None):
        req = self.get_object()
        req.cross_match_result = 'Compatible'
        req.status = 'Cross-Matched'
        req.save()
        return Response(BloodRequestSerializer(req).data)

    @action(detail=True, methods=['post'], url_path='issue')
    def issue_blood(self, request, pk=None):
        req = self.get_object()
        unit = BloodUnit.objects.filter(blood_group=req.blood_group, status='Available').first()
        if unit:
            unit.status = 'Transfused'
            unit.save()
        req.status = 'Issued'
        req.save()
        return Response(BloodRequestSerializer(req).data)
