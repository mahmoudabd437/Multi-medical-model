from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.db.models import Avg
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.mock_data import MOCK_PREDICTIONS
from apps.common.responses import error_response, success_response
from apps.predictions.models import ChestXrayPrediction
from apps.predictions.serializers import (
    BrainMRIUploadSerializer,
    ChestXrayPredictionSerializer,
    ChestXrayUploadSerializer,
    DiabeticRetinopathyUploadSerializer,
    PredictionFilterSerializer,
    PredictionRequestSerializer,
)
from apps.predictions.services import get_prediction_strategy
from services.ai.brain_mri_service import (
    BrainMRIServiceError,
    ImageProcessingError as BrainMRIImageProcessingError,
    InvalidModelError as BrainMRIInvalidModelError,
    ModelLoadError as BrainMRIModelLoadError,
    PredictionError as BrainMRIPredictionError,
    predict_brain_mri,
)
from services.ai.chest_xray_service import (
    EfficientNetServiceError,
    ImageProcessingError,
    InvalidModelError,
    ModelLoadError,
    PredictionError,
    predict_chest_xray,
)
from services.ai.diabetic_retinopathy_service import (
    DiabeticRetinopathyServiceError,
    ImageProcessingError as DiabeticRetinopathyImageProcessingError,
    InvalidModelError as DiabeticRetinopathyInvalidModelError,
    ModelLoadError as DiabeticRetinopathyModelLoadError,
    PredictionError as DiabeticRetinopathyPredictionError,
    predict_diabetic_retinopathy,
)

MODEL_ACCURACY_BY_MODALITY = {
    ChestXrayPrediction.MODALITY_CHEST_XRAY: {'label': 'Chest X-ray', 'accuracy': 98.4},
    ChestXrayPrediction.MODALITY_BRAIN_MRI: {'label': 'Brain MRI', 'accuracy': 97.1},
    ChestXrayPrediction.MODALITY_DIABETIC_RETINOPATHY: {'label': 'Diabetic Retinopathy', 'accuracy': 96.3},
}


def _record_filename(instance: ChestXrayPrediction) -> str:
    if instance.filename:
        return instance.filename

    image_name = getattr(instance.image, 'name', '') or ''
    return image_name.rsplit('/', 1)[-1] if image_name else ''


def _record_image_url(instance: ChestXrayPrediction) -> str:
    try:
        return instance.image.url
    except Exception:
        return ''


def _serialize_prediction_record(instance: ChestXrayPrediction) -> dict[str, Any]:
    serializer = ChestXrayPredictionSerializer(instance)
    payload = serializer.data
    payload.update(
        {
            'prediction': instance.prediction,
            'summary': instance.medical_note,
            'filename': _record_filename(instance),
            'image_url': _record_image_url(instance),
            'upload_time': instance.upload_time.isoformat() if instance.upload_time else None,
            'prediction_time': instance.prediction_time.isoformat() if instance.prediction_time else None,
            'processing_time': float(instance.processing_time),
            'inference_time_seconds': float(instance.inference_time_seconds),
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
        }
    )
    return payload


def _store_prediction(
    *,
    image,
    serializer_data: dict[str, Any],
    modality: str,
    result: dict[str, Any],
    upload_time,
    prediction_time,
) -> ChestXrayPrediction:
    filename = serializer_data.get('filename') or getattr(image, 'name', '') or ''
    processing_time = max(0.0, (prediction_time - upload_time).total_seconds())

    return ChestXrayPrediction.objects.create(
        image=image,
        filename=filename,
        modality=modality,
        study_id=serializer_data.get('study_id', ''),
        notes=serializer_data.get('notes', ''),
        prediction=result['prediction'],
        confidence=Decimal(str(result['confidence'])),
        probability=Decimal(str(result['probability'])),
        class_index=result['class_index'],
        model_name=result['model'],
        threshold=Decimal(str(result.get('threshold', 0.0))),
        version=result['version'],
        upload_time=upload_time,
        prediction_time=prediction_time,
        processing_time=Decimal(str(processing_time)),
        inference_time_seconds=Decimal(str(result['inference_time_seconds'])),
        medical_note=result['medical_note'],
    )


class PredictionListView(APIView):
    def get(self, request):
        serializer = PredictionFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        items = []

        predictions = ChestXrayPrediction.objects.all()
        modality = serializer.validated_data.get('modality')
        if modality:
            predictions = predictions.filter(modality=modality)

        if predictions.exists():
            items = [_serialize_prediction_record(item) for item in predictions]
        else:
            items = MOCK_PREDICTIONS
            if modality:
                items = [item for item in items if item.get('modality') == modality]

        return success_response(
            {
                'items': items,
                'count': len(items),
                'filters': serializer.validated_data,
            },
            message='Prediction history loaded',
            status_code=status.HTTP_200_OK,
        )


class PredictionCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PredictionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        modality = serializer.validated_data['modality']
        strategy = get_prediction_strategy(modality)
        prediction = strategy(serializer.validated_data)
        return success_response(
            {
                'id': 'pred_mock_001',
                'modality': modality,
                'status': prediction['status'],
                'confidence': prediction['confidence'],
                'message': prediction['summary'],
                'input': serializer.validated_data,
                'prediction': prediction,
            },
            message='Prediction request accepted',
            status_code=status.HTTP_202_ACCEPTED,
        )


class PredictionDetailView(APIView):
    def get(self, request, prediction_id: str):
        matched = ChestXrayPrediction.objects.filter(id=prediction_id).first()
        if matched is not None:
            payload = _serialize_prediction_record(matched)
        else:
            payload = next((item for item in MOCK_PREDICTIONS if item['id'] == prediction_id), None)
            if payload is None:
                payload = {
                    'id': prediction_id,
                    'study_type': 'Unknown',
                    'status': 'mock',
                    'confidence': 0.0,
                    'summary': 'Mock prediction detail placeholder.',
                }
        return success_response(payload, message='Prediction detail loaded', status_code=status.HTTP_200_OK)


class ChestXrayPredictView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChestXrayUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                'Invalid chest X-ray upload.',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        image = serializer.validated_data.get('image')
        if image is None:
            return error_response('An image file is required.', status_code=status.HTTP_400_BAD_REQUEST)

        upload_time = timezone.now()
        try:
            result = predict_chest_xray(image, serializer.validated_data.get('model'))
            prediction_time = timezone.now()
        except InvalidModelError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except ModelLoadError as exc:
            return error_response(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ImageProcessingError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except PredictionError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except EfficientNetServiceError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        prediction_record = _store_prediction(
            image=image,
            serializer_data=serializer.validated_data,
            modality=ChestXrayPrediction.MODALITY_CHEST_XRAY,
            result=result,
            upload_time=upload_time,
            prediction_time=prediction_time,
        )

        payload = _serialize_prediction_record(prediction_record)
        payload['model'] = result['model']
        payload['threshold'] = result['threshold']
        payload['version'] = result['version']
        payload['inference_time'] = result['inference_time']
        payload['inference_time_seconds'] = result['inference_time_seconds']
        payload['medical_note'] = result['medical_note']
        return Response(payload, status=status.HTTP_200_OK)


class BrainMRIPredictView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BrainMRIUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                'Invalid Brain MRI upload.',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        image = serializer.validated_data.get('image')
        if image is None:
            return error_response('An image file is required.', status_code=status.HTTP_400_BAD_REQUEST)

        upload_time = timezone.now()
        try:
            result = predict_brain_mri(image, serializer.validated_data.get('model'))
            prediction_time = timezone.now()
        except BrainMRIInvalidModelError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except BrainMRIModelLoadError as exc:
            return error_response(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except BrainMRIImageProcessingError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except BrainMRIPredictionError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except BrainMRIServiceError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        prediction_record = _store_prediction(
            image=image,
            serializer_data=serializer.validated_data,
            modality=ChestXrayPrediction.MODALITY_BRAIN_MRI,
            result={**result, 'threshold': 0.0},
            upload_time=upload_time,
            prediction_time=prediction_time,
        )

        payload = _serialize_prediction_record(prediction_record)
        payload['scores'] = result['scores']
        payload['inference_time'] = result['inference_time']
        payload['medical_note'] = result['medical_note']
        return Response(payload, status=status.HTTP_200_OK)


class DiabeticRetinopathyPredictView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DiabeticRetinopathyUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                'Invalid diabetic retinopathy upload.',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        image = serializer.validated_data.get('image')
        if image is None:
            return error_response('An image file is required.', status_code=status.HTTP_400_BAD_REQUEST)

        upload_time = timezone.now()
        try:
            result = predict_diabetic_retinopathy(image, serializer.validated_data.get('model'))
            prediction_time = timezone.now()
        except DiabeticRetinopathyInvalidModelError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except DiabeticRetinopathyModelLoadError as exc:
            return error_response(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except DiabeticRetinopathyImageProcessingError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except DiabeticRetinopathyPredictionError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except DiabeticRetinopathyServiceError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        prediction_record = _store_prediction(
            image=image,
            serializer_data=serializer.validated_data,
            modality=ChestXrayPrediction.MODALITY_DIABETIC_RETINOPATHY,
            result={**result, 'threshold': 0.0},
            upload_time=upload_time,
            prediction_time=prediction_time,
        )

        payload = _serialize_prediction_record(prediction_record)
        payload['scores'] = result['scores']
        payload['inference_time'] = result['inference_time']
        payload['medical_note'] = result['medical_note']
        return Response(payload, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    def get(self, request):
        queryset = ChestXrayPrediction.objects.all()
        total_predictions = queryset.count()
        average_turnaround = queryset.aggregate(value=Avg('processing_time')).get('value') or 0
        active_models = queryset.values('model_name').distinct().count()

        model_breakdown = []
        for modality, config in MODEL_ACCURACY_BY_MODALITY.items():
            model_breakdown.append(
                {
                    'modality': modality,
                    'label': config['label'],
                    'accuracy': config['accuracy'],
                    'predictions': queryset.filter(modality=modality).count(),
                }
            )

        recent_predictions = [_serialize_prediction_record(item) for item in queryset.order_by('-prediction_time', '-created_at')[:5]]

        payload = {
            'total_predictions': total_predictions,
            'today_predictions': queryset.filter(upload_time__date=timezone.localdate()).count(),
            'average_turnaround_seconds': round(float(average_turnaround), 2) if average_turnaround else 0.0,
            'active_models': active_models or len(MODEL_ACCURACY_BY_MODALITY),
            'average_accuracy': round(
                sum(item['accuracy'] for item in model_breakdown) / len(model_breakdown),
                2,
            ) if model_breakdown else 0.0,
            'model_breakdown': model_breakdown,
            'recent_predictions': recent_predictions,
        }
        return success_response(payload, message='Dashboard statistics loaded', status_code=status.HTTP_200_OK)
