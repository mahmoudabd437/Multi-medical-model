from __future__ import annotations

from rest_framework import serializers

from apps.predictions.models import ChestXrayPrediction


class HistoryFilterSerializer(serializers.Serializer):
    status = serializers.CharField(required=False, allow_blank=True)
    search = serializers.CharField(required=False, allow_blank=True)
    modality = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, min_value=1)


class HistoryRecordSerializer(serializers.ModelSerializer):
    study_type = serializers.SerializerMethodField()
    patient_ref = serializers.CharField(source='study_id', read_only=True)
    status = serializers.SerializerMethodField()
    reviewer = serializers.SerializerMethodField()
    confidence = serializers.FloatField(read_only=True)
    probability = serializers.FloatField(read_only=True)
    inference_time_seconds = serializers.FloatField(read_only=True)

    class Meta:
        model = ChestXrayPrediction
        fields = [
            'id',
            'modality',
            'study_type',
            'patient_ref',
            'status',
            'reviewer',
            'prediction',
            'confidence',
            'probability',
            'model_name',
            'inference_time_seconds',
            'medical_note',
            'created_at',
        ]

    def get_study_type(self, instance: ChestXrayPrediction) -> str:
        return instance.study_type

    def get_status(self, instance: ChestXrayPrediction) -> str:
        return 'completed'

    def get_reviewer(self, instance: ChestXrayPrediction) -> str:
        return 'AI System'
