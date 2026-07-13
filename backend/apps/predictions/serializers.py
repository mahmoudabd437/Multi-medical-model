from __future__ import annotations

from rest_framework import serializers

from apps.predictions.models import ChestXrayPrediction


class PredictionRequestSerializer(serializers.Serializer):
    modality = serializers.ChoiceField(choices=['chest_xray', 'brain_mri', 'diabetic_retinopathy', 'skin_disease', 'face_recognition'])
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


class BrainMRIUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    study_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    model = serializers.ChoiceField(
        choices=['efficientnetb0_mri', 'vit_mri'],
        required=False,
        allow_blank=True,
    )


class DiabeticRetinopathyUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    study_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    model = serializers.ChoiceField(
        choices=['efficientnetb0_dr', 'convnext_dr'],
        required=False,
        allow_blank=True,
    )


class ChestXrayPredictionSerializer(serializers.ModelSerializer):
    study_type = serializers.SerializerMethodField()
    patient_ref = serializers.CharField(source='study_id', read_only=True)
    reviewer = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    inference_time = serializers.SerializerMethodField()
    filename = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()
    upload_time = serializers.DateTimeField(read_only=True)
    prediction_time = serializers.DateTimeField(read_only=True)
    processing_time = serializers.FloatField(read_only=True)

    class Meta:
        model = ChestXrayPrediction
        fields = [
            'id',
            'modality',
            'study_type',
            'patient_ref',
            'filename',
            'status',
            'reviewer',
            'image_url',
            'prediction',
            'confidence',
            'probability',
            'class_index',
            'model_name',
            'threshold',
            'version',
            'upload_time',
            'prediction_time',
            'processing_time',
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

    def get_image_url(self, instance: ChestXrayPrediction) -> str:
        try:
            return instance.image.url
        except Exception:
            return ''
