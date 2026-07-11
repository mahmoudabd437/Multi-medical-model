from __future__ import annotations

import uuid

from django.db import models


class FaceEnrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person_id = models.CharField(max_length=64, unique=True)
    person_name = models.CharField(max_length=128)
    notes = models.TextField(blank=True, default='')
    source_image_name = models.CharField(max_length=255, blank=True, default='')
    embedding = models.JSONField(default=list)
    embedding_size = models.PositiveSmallIntegerField(default=0)
    match_count = models.PositiveIntegerField(default=0)
    last_similarity = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.person_name} ({self.person_id})'
