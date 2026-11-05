from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import QueueToken
from .serializers import QueueTokenSerializer

class QueueTokenViewSet(viewsets.ModelViewSet):
    queryset = QueueToken.objects.all()
    serializer_class = QueueTokenSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = QueueToken.objects.all()
        branch_id = self.request.query_params.get('branch')
        doctor_id = self.request.query_params.get('doctor')
        status_param = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')

        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if priority:
            qs = qs.filter(priority=priority)

        # By default order by priority (Emergency first, then waiting)
        return qs.order_by(
            models_priority_case(),
            'created_at'
        )

    @action(detail=False, methods=['get'], url_path='live-display')
    def live_display(self, request):
        branch_id = request.query_params.get('branch')
        doctor_id = request.query_params.get('doctor')
        today = timezone.localdate()

        qs = QueueToken.objects.filter(created_at__date=today)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)

        now_serving = qs.filter(status='Serving').order_by('-called_at').first()
        waiting = qs.filter(status='Waiting').order_by('created_at')[:8]
        completed_count = qs.filter(status='Completed').count()
        total_tokens = qs.count()

        return Response({
            'now_serving': QueueTokenSerializer(now_serving).data if now_serving else None,
            'waiting_list': QueueTokenSerializer(waiting, many=True).data,
            'waiting_count': qs.filter(status='Waiting').count(),
            'completed_count': completed_count,
            'total_tokens': total_tokens,
            'average_wait_minutes': 12,
        })

    @action(detail=True, methods=['post'], url_path='call-token')
    def call_token(self, request, pk=None):
        token = self.get_object()
        # Mark other currently serving for this doctor as completed or waiting
        QueueToken.objects.filter(doctor=token.doctor, status='Serving').update(status='Completed', completed_at=timezone.now())
        
        token.status = 'Serving'
        token.called_at = timezone.now()
        token.save()
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=['post'], url_path='complete-token')
    def complete_token(self, request, pk=None):
        token = self.get_object()
        token.status = 'Completed'
        token.completed_at = timezone.now()
        token.save()
        return Response(QueueTokenSerializer(token).data)

def models_priority_case():
    from django.db.models import Case, When, Value, IntegerField
    return Case(
        When(priority='Emergency', then=Value(1)),
        When(priority='Senior Citizen', then=Value(2)),
        When(priority='Pediatric', then=Value(3)),
        When(priority='Normal', then=Value(4)),
        default=Value(5),
        output_field=IntegerField()
    )
