from __future__ import annotations

from decimal import Decimal

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.mock_data import MOCK_PREDICTIONS
from apps.common.responses import error_response, success_response
from apps.predictions.models import ChestXrayPrediction
from apps.predictions.serializers import (
    BrainMRIUploadSerializer,
    ChestXrayUploadSerializer,
    PredictionFilterSerializer,
    PredictionRequestSerializer,
)
from apps.predictions.services import get_prediction_strategy
from services.ai.efficientnet_service import (
    EfficientNetServiceError,
    ImageProcessingError,
    InvalidModelError,
    ModelLoadError,
    PredictionError,
    predict_chest_xray,
)
from services.ai.brain_mri_service import (
    BrainMRIServiceError,
    ImageProcessingError as BrainMRIImageProcessingError,
    InvalidModelError as BrainMRIInvalidModelError,
    ModelLoadError as BrainMRIModelLoadError,
    PredictionError as BrainMRIPredictionError,
    predict_brain_mri,
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
            items = [
                {
                    'id': str(item.id),
                    'study_type': item.study_type,
                    'status': 'completed',
                    'confidence': float(item.probability),
                    'summary': item.medical_note,
                    'created_at': item.created_at.isoformat(),
                }
                for item in predictions
            ]
        else:
            items = MOCK_PREDICTIONS

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
            payload = {
                'id': str(matched.id),
                'study_type': matched.study_type,
                'status': 'completed',
                'confidence': float(matched.probability),
                'summary': matched.medical_note,
                'created_at': matched.created_at.isoformat(),
            }
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

        try:
            result = predict_chest_xray(image, serializer.validated_data.get('model'))
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

        prediction_record = ChestXrayPrediction.objects.create(
            image=image,
            study_id=serializer.validated_data.get('study_id', ''),
            notes=serializer.validated_data.get('notes', ''),
            prediction=result['prediction'],
            confidence=Decimal(str(result['confidence'])),
            probability=Decimal(str(result['probability'])),
            class_index=result['class_index'],
            model_name=result['model'],
            threshold=Decimal(str(result['threshold'])),
            version=result['version'],
            inference_time_seconds=Decimal(str(result['inference_time_seconds'])),
            medical_note=result['medical_note'],
        )

        payload = {
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'probability': result['probability'],
            'class_index': result['class_index'],
            'model': result['model'],
            'threshold': result['threshold'],
            'version': result['version'],
            'inference_time': result['inference_time'],
            'medical_note': result['medical_note'],
            'created_at': prediction_record.created_at.isoformat(),
            'id': str(prediction_record.id),
        }
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

        try:
            result = predict_brain_mri(image, serializer.validated_data.get('model'))
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

        prediction_record = ChestXrayPrediction.objects.create(
            image=image,
            modality=ChestXrayPrediction.MODALITY_BRAIN_MRI,
            study_id=serializer.validated_data.get('study_id', ''),
            notes=serializer.validated_data.get('notes', ''),
            prediction=result['prediction'],
            confidence=Decimal(str(result['confidence'])),
            probability=Decimal(str(result['probability'])),
            class_index=result['class_index'],
            model_name=result['model'],
            threshold=Decimal('0.00'),
            version=result['version'],
            inference_time_seconds=Decimal(str(result['inference_time_seconds'])),
            medical_note=result['medical_note'],
        )

        payload = {
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'probability': result['probability'],
            'class_index': result['class_index'],
            'scores': result['scores'],
            'model': result['model'],
            'version': result['version'],
            'inference_time': result['inference_time'],
            'medical_note': result['medical_note'],
            'created_at': prediction_record.created_at.isoformat(),
            'id': str(prediction_record.id),
        }
        return Response(payload, status=status.HTTP_200_OK)
