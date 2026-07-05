from __future__ import annotations

from rest_framework import serializers


class ReportRequestSerializer(serializers.Serializer):
    title = serializers.CharField()
    format = serializers.ChoiceField(choices=['pdf', 'xlsx', 'csv'])
    scope = serializers.CharField(required=False, allow_blank=True)


class ReportFilterSerializer(serializers.Serializer):
    status = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, min_value=1)
