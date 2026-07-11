from __future__ import annotations

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.common.responses import error_response, success_response
from apps.face_recognition.serializers import (
    FaceEnrollmentRecordSerializer,
    FaceEnrollmentRequestSerializer,
    FaceRecognitionMatchRequestSerializer,
)
from services.ai.face_recognition_service import (
    EnrollmentError,
    FaceRecognitionServiceError,
    ImageProcessingError,
    MatchError,
    ModelLoadError,
    enroll_face,
    match_face,
)


class FaceRecognitionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.face_recognition.models import FaceEnrollment

        queryset = FaceEnrollment.objects.all()
        serializer = FaceEnrollmentRecordSerializer(queryset, many=True)
        return success_response(
            {
                'items': serializer.data,
                'count': queryset.count(),
                'message': 'Face enrollments loaded.',
            },
            message='Face recognition registry loaded',
            status_code=status.HTTP_200_OK,
        )


class FaceRecognitionMatchView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = FaceRecognitionMatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image = serializer.validated_data.get('image')
        if image is None:
            return error_response(
                'An image file is required.',
                errors={
                    'match_found': False,
                    'confidence': 0.0,
                    'similarity': 0.0,
                    'threshold': serializer.validated_data.get('threshold', 0.45),
                    'match': None,
                    'candidates': [],
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = match_face(
                image_file=image,
                person_id=serializer.validated_data.get('person_id'),
                threshold=serializer.validated_data.get('threshold', 0.45),
            )
        except ModelLoadError as exc:
            return error_response(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ImageProcessingError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except MatchError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except FaceRecognitionServiceError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return success_response(result, message='Face match completed', status_code=status.HTTP_200_OK)


class FaceEnrollmentView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = FaceEnrollmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image = serializer.validated_data.get('image')
        if image is None:
            return error_response(
                'An image file is required.',
                errors={
                    'enrolled': False,
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = enroll_face(
                person_name=serializer.validated_data['person_name'],
                image_file=image,
                person_id=serializer.validated_data.get('person_id'),
                notes=serializer.validated_data.get('notes', ''),
            )
        except ModelLoadError as exc:
            return error_response(str(exc), status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ImageProcessingError as exc:
            return error_response(str(exc), status_code=status.HTTP_400_BAD_REQUEST)
        except EnrollmentError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except FaceRecognitionServiceError as exc:
            return error_response(str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return success_response(result, message='Face enrollment completed', status_code=status.HTTP_201_CREATED)
