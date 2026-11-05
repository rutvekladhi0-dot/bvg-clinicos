import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import TelemedicineSession
from .serializers import TelemedicineSessionSerializer

class TelemedicineSessionViewSet(viewsets.ModelViewSet):
    queryset = TelemedicineSession.objects.all()
    serializer_class = TelemedicineSessionSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        room_id = f"BVG-CONF-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(room_id=room_id)

    @action(detail=True, methods=['post'], url_path='start-call')
    def start_call(self, request, pk=None):
        session = self.get_object()
        session.status = 'Active'
        session.started_at = timezone.now()
        session.save()
        return Response(TelemedicineSessionSerializer(session).data)

    @action(detail=True, methods=['post'], url_path='end-call')
    def end_call(self, request, pk=None):
        session = self.get_object()
        now = timezone.now()
        session.status = 'Completed'
        session.ended_at = now
        notes = request.data.get('doctor_notes')
        if notes:
            session.doctor_notes = notes
        if session.started_at:
            session.call_duration_seconds = int((now - session.started_at).total_seconds())
        session.save()
        return Response(TelemedicineSessionSerializer(session).data)
