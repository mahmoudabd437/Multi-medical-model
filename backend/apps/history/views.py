from __future__ import annotations

from datetime import datetime
from typing import Any

from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView

from apps.common.responses import error_response, success_response
from apps.history.serializers import HistoryFilterSerializer, HistoryRecordSerializer
from apps.predictions.models import ChestXrayPrediction
from apps.face_recognition.models import FaceEnrollment


def _safe_iso(value) -> str:
    if value is None:
        return ''
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return str(value)


def _face_confidence(enrollment: FaceEnrollment) -> float:
    if enrollment.last_similarity is None:
        return 100.0
    return round(float(enrollment.last_similarity) * 100, 2)


def _prediction_record(instance: ChestXrayPrediction) -> dict[str, Any]:
    try:
        image_url = instance.image.url
    except Exception:
        image_url = ''

    return {
        'id': str(instance.id),
        'modality': instance.modality,
        'study_type': instance.study_type,
        'patient_ref': instance.study_id,
        'filename': instance.filename or getattr(instance.image, 'name', '').rsplit('/', 1)[-1],
        'image_url': image_url,
        'status': 'completed',
        'reviewer': 'AI System',
        'prediction': instance.prediction,
        'confidence': float(instance.confidence),
        'probability': float(instance.probability),
        'model_name': instance.model_name,
        'upload_time': _safe_iso(instance.upload_time),
        'prediction_time': _safe_iso(instance.prediction_time),
        'processing_time': float(instance.processing_time),
        'inference_time_seconds': float(instance.inference_time_seconds),
        'medical_note': instance.medical_note,
        'created_at': _safe_iso(instance.created_at),
        'date': instance.upload_time.date().isoformat() if instance.upload_time else '',
        'time': instance.prediction_time.time().isoformat(timespec='seconds') if instance.prediction_time else '',
    }


def _face_record(instance: FaceEnrollment) -> dict[str, Any]:
    created = instance.created_at
    updated = instance.updated_at
    confidence = _face_confidence(instance)
    return {
        'id': str(instance.id),
        'modality': 'face_recognition',
        'study_type': 'Face Recognition',
        'patient_ref': instance.person_id,
        'filename': instance.source_image_name or '',
        'image_url': '',
        'status': 'completed',
        'reviewer': 'AI System',
        'prediction': instance.person_name,
        'confidence': confidence,
        'probability': round(confidence / 100, 4),
        'model_name': 'Face Recognition',
        'upload_time': _safe_iso(created),
        'prediction_time': _safe_iso(updated),
        'processing_time': 0.0,
        'inference_time_seconds': 0.0,
        'medical_note': instance.notes,
        'created_at': _safe_iso(created),
        'date': created.date().isoformat() if created else '',
        'time': updated.time().isoformat(timespec='seconds') if updated else '',
    }


def _all_history_records() -> list[dict[str, Any]]:
    records = [_prediction_record(item) for item in ChestXrayPrediction.objects.all()]
    records.extend(_face_record(item) for item in FaceEnrollment.objects.all())
    return records


def _apply_filters(records: list[dict[str, Any]], filters: dict[str, Any]) -> list[dict[str, Any]]:
    modality = (filters.get('modality') or '').strip().lower()
    search = (filters.get('search') or '').strip().lower()
    ordering = (filters.get('ordering') or '-prediction_time').strip().lower()
    date_value = (filters.get('date') or '').strip().lower()

    if modality and modality != 'all':
        records = [record for record in records if record['modality'] == modality]

    if search:
        records = [
            record for record in records
            if search in ' '.join(
                str(record.get(key, '')).lower()
                for key in ('study_type', 'filename', 'prediction', 'model_name', 'reviewer', 'medical_note')
            )
        ]

    if date_value:
        if date_value == 'today':
            target_date = timezone.localdate().isoformat()
        else:
            try:
                target_date = datetime.fromisoformat(date_value).date().isoformat()
            except ValueError:
                target_date = date_value
        records = [record for record in records if record.get('date') == target_date]

    reverse = ordering.startswith('-')
    ordering_key = ordering.lstrip('-')
    allowed_ordering = {
        'prediction_time',
        'upload_time',
        'confidence',
        'model_name',
        'study_type',
        'date',
    }
    if ordering_key in allowed_ordering:
        records.sort(key=lambda record: record.get(ordering_key) or '', reverse=reverse)
    else:
        records.sort(key=lambda record: record.get('prediction_time') or '', reverse=True)

    return records


class HistoryListView(APIView):
    def get(self, request):
        serializer = HistoryFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        records = _apply_filters(_all_history_records(), serializer.validated_data)
        page = serializer.validated_data.get('page', 1)
        page_size = serializer.validated_data.get('page_size', len(records) or 1)
        start = (page - 1) * page_size
        end = start + page_size
        items = records[start:end]

        serialized_items = HistoryRecordSerializer(items, many=True).data
        return success_response(
            {
                'items': serialized_items,
                'count': len(records),
                'page': page,
                'page_size': page_size,
                'filters': serializer.validated_data,
            },
            message='History loaded',
            status_code=status.HTTP_200_OK,
        )


class HistoryDetailView(APIView):
    def get(self, request, history_id: str):
        for record in _all_history_records():
            if record['id'] == history_id:
                return success_response(record, message='History item loaded', status_code=status.HTTP_200_OK)

        return error_response('History item not found.', status_code=status.HTTP_404_NOT_FOUND)
