from __future__ import annotations

from rest_framework import serializers

from apps.face_recognition.models import FaceEnrollment


class FaceEnrollmentRequestSerializer(serializers.Serializer):
    person_name = serializers.CharField()
    image = serializers.ImageField()
    person_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    image_id = serializers.CharField(required=False, allow_blank=True)


class FaceRecognitionMatchRequestSerializer(serializers.Serializer):
    image = serializers.ImageField()
    person_id = serializers.CharField(required=False, allow_blank=True)
    threshold = serializers.FloatField(required=False, min_value=0.0, max_value=1.0, default=0.45)
    image_id = serializers.CharField(required=False, allow_blank=True)


class FaceEnrollmentRecordSerializer(serializers.ModelSerializer):
    embedding_size = serializers.IntegerField(read_only=True)
    match_count = serializers.IntegerField(read_only=True)
    last_similarity = serializers.FloatField(read_only=True, allow_null=True)

    class Meta:
        model = FaceEnrollment
        fields = [
            'id',
            'person_id',
            'person_name',
            'notes',
            'source_image_name',
            'embedding_size',
            'match_count',
            'last_similarity',
            'created_at',
            'updated_at',
        ]
