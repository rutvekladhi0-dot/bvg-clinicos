from rest_framework import serializers
from .models import AIProviderConfig, AIInsight

class AIProviderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIProviderConfig
        fields = '__all__'

class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = '__all__'
