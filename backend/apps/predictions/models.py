from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone


class ChestXrayPrediction(models.Model):
    MODALITY_CHEST_XRAY = 'chest_xray'
    MODALITY_BRAIN_MRI = 'brain_mri'
    MODALITY_DIABETIC_RETINOPATHY = 'diabetic_retinopathy'

    MODALITY_CHOICES = [
        (MODALITY_CHEST_XRAY, 'Chest X-ray'),
        (MODALITY_BRAIN_MRI, 'Brain MRI'),
        (MODALITY_DIABETIC_RETINOPATHY, 'Diabetic Retinopathy'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to='chest_xray/')
    filename = models.CharField(max_length=255, blank=True, default='')
    modality = models.CharField(max_length=32, choices=MODALITY_CHOICES, default=MODALITY_CHEST_XRAY)
    study_id = models.CharField(max_length=128, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    prediction = models.CharField(max_length=32)
    confidence = models.DecimalField(max_digits=6, decimal_places=2)
    probability = models.DecimalField(max_digits=6, decimal_places=4)
    class_index = models.PositiveSmallIntegerField()
    model_name = models.CharField(max_length=64)
    threshold = models.DecimalField(max_digits=4, decimal_places=2, default=0.5)
    version = models.CharField(max_length=16, default='1.0.0')
    upload_time = models.DateTimeField(default=timezone.now)
    prediction_time = models.DateTimeField(null=True, blank=True)
    processing_time = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    inference_time_seconds = models.DecimalField(max_digits=6, decimal_places=2)
    medical_note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.model_name} - {self.prediction} ({self.confidence}%)'

    @property
    def study_type(self) -> str:
        return dict(self.MODALITY_CHOICES).get(self.modality, 'Chest X-ray')
