import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import OTRoom, Surgery, OTEquipment
from .serializers import OTRoomSerializer, SurgerySerializer, OTEquipmentSerializer
from apps.patients.models import PatientTimeline

class OTRoomViewSet(viewsets.ModelViewSet):
    queryset = OTRoom.objects.all()
    serializer_class = OTRoomSerializer
    permission_classes = [permissions.AllowAny]

class SurgeryViewSet(viewsets.ModelViewSet):
    queryset = Surgery.objects.all()
    serializer_class = SurgerySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['surgery_number', 'surgery_name', 'patient__first_name', 'patient__last_name', 'lead_surgeon__user__first_name']
    ordering_fields = ['scheduled_start']

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_surg = Surgery.objects.filter(surgery_number__startswith=f"OT-{year}-").order_by('-id').first()
        if last_surg:
            try:
                last_num = int(last_surg.surgery_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = Surgery.objects.count() + 101
        else:
            new_num = 101

        surgery_number = f"OT-{year}-{new_num:04d}"
        surgery = serializer.save(surgery_number=surgery_number)

        # Log timeline
        PatientTimeline.objects.create(
            patient=surgery.patient,
            event_type='Surgery',
            title=f"Surgery Scheduled: {surgery.surgery_name}",
            description=f"Surgeon: {surgery.lead_surgeon.full_name} in {surgery.ot_room.room_number}",
            reference_id=surgery.surgery_number
        )

class OTEquipmentViewSet(viewsets.ModelViewSet):
    queryset = OTEquipment.objects.all()
    serializer_class = OTEquipmentSerializer
    permission_classes = [permissions.AllowAny]
