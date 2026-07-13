from __future__ import annotations

from rest_framework import serializers


class HistoryFilterSerializer(serializers.Serializer):
    modality = serializers.CharField(required=False, allow_blank=True)
    search = serializers.CharField(required=False, allow_blank=True)
    ordering = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, min_value=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100)
    date = serializers.CharField(required=False, allow_blank=True)


class HistoryRecordSerializer(serializers.Serializer):
    id = serializers.CharField()
    modality = serializers.CharField()
    study_type = serializers.CharField()
    patient_ref = serializers.CharField(allow_blank=True, required=False)
    filename = serializers.CharField(allow_blank=True, required=False)
    image_url = serializers.CharField(allow_blank=True, required=False)
    status = serializers.CharField()
    reviewer = serializers.CharField()
    prediction = serializers.CharField(allow_blank=True, required=False)
    confidence = serializers.FloatField(required=False)
    probability = serializers.FloatField(required=False)
    model_name = serializers.CharField(allow_blank=True, required=False)
    upload_time = serializers.CharField(allow_blank=True, required=False)
    prediction_time = serializers.CharField(allow_blank=True, required=False)
    processing_time = serializers.FloatField(required=False)
    inference_time_seconds = serializers.FloatField(required=False)
    medical_note = serializers.CharField(allow_blank=True, required=False)
    created_at = serializers.CharField(allow_blank=True, required=False)
    date = serializers.CharField(allow_blank=True, required=False)
    time = serializers.CharField(allow_blank=True, required=False)
