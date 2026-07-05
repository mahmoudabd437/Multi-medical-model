from __future__ import annotations

from rest_framework import serializers


class FaceRecognitionRequestSerializer(serializers.Serializer):
    image_id = serializers.CharField()
    person_id = serializers.CharField(required=False, allow_blank=True)


class FaceEnrollmentSerializer(serializers.Serializer):
    person_name = serializers.CharField()
    image_id = serializers.CharField()
