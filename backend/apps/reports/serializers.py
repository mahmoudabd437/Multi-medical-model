from __future__ import annotations

from rest_framework import serializers


class ReportRequestSerializer(serializers.Serializer):
    title = serializers.CharField()
    format = serializers.ChoiceField(choices=['pdf', 'csv'])
    scope = serializers.CharField(required=False, allow_blank=True)
    modality = serializers.CharField(required=False, allow_blank=True)


class ReportFilterSerializer(serializers.Serializer):
    modality = serializers.CharField(required=False, allow_blank=True)
    search = serializers.CharField(required=False, allow_blank=True)
    ordering = serializers.CharField(required=False, allow_blank=True)
    date = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, min_value=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100)
