from __future__ import annotations

from rest_framework import serializers

from apps.predictions.models import ChestXrayPrediction


class PredictionRequestSerializer(serializers.Serializer):
    modality = serializers.ChoiceField(choices=['chest_xray', 'brain_mri', 'skin_disease', 'face_recognition'])
    study_id = serializers.CharField(required=False, allow_blank=True)
    image_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class PredictionFilterSerializer(serializers.Serializer):
    modality = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, min_value=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100)


class ChestXrayUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    study_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    model = serializers.ChoiceField(
        choices=['efficientnetb0', 'densenet121', 'custom_cnn'],
        required=False,
        allow_blank=True,
    )


class ChestXrayPredictionSerializer(serializers.ModelSerializer):
    study_type = serializers.SerializerMethodField()
    patient_ref = serializers.CharField(source='study_id', read_only=True)
    reviewer = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    inference_time = serializers.SerializerMethodField()

    class Meta:
        model = ChestXrayPrediction
        fields = [
            'id',
            'study_type',
            'patient_ref',
            'status',
            'reviewer',
            'prediction',
            'confidence',
            'probability',
            'class_index',
            'model_name',
            'threshold',
            'version',
            'inference_time',
            'medical_note',
            'created_at',
        ]

    def get_reviewer(self, instance: ChestXrayPrediction) -> str:
        return 'AI System'

    def get_study_type(self, instance: ChestXrayPrediction) -> str:
        return instance.study_type

    def get_status(self, instance: ChestXrayPrediction) -> str:
        return 'completed'

    def get_inference_time(self, instance: ChestXrayPrediction) -> str:
        return f'{instance.inference_time_seconds:.2f} sec'
