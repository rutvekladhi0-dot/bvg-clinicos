from django.db import models
from apps.core.models import Branch, User

class AIProviderConfig(models.Model):
    provider = models.CharField(max_length=50, default='Google Gemini / Heuristic Engine')
    api_key = models.CharField(max_length=255, blank=True)
    model_name = models.CharField(max_length=100, default='gemini-2.5-flash')
    is_enabled = models.BooleanField(default=True)
    system_status = models.CharField(max_length=50, default='Active - Heuristic Engine Ready')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider} ({'Configured' if self.api_key else 'Heuristic Mode'})"

class AIInsight(models.Model):
    INSIGHT_TYPES = [
        ('REVENUE_FORECAST', 'Revenue & Financial Trend Forecast'),
        ('PATIENT_DEMAND', 'Patient Inflow & OPD Demand Forecast'),
        ('MEDICINE_STOCK', 'Pharmacy Runout & Expiry Warning'),
        ('BED_UTILIZATION', 'Bed Occupancy & Ward Bottleneck Alert'),
        ('CLINICAL_SUMMARY', 'Automated Clinical Record Summary'),
        ('OPERATIONAL_BOTTLENECK', 'Department Waiting Time Bottleneck'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='ai_insights', null=True, blank=True)
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=255)
    summary = models.TextField()
    data_metrics = models.JSONField(default=dict, blank=True)
    actionable_recommendations = models.JSONField(default=list, blank=True)
    confidence_score = models.FloatField(default=0.92) # e.g. 92% confidence
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.insight_type}] {self.title}"
