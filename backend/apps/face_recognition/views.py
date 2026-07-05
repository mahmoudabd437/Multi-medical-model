from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from apps.common.mock_data import MOCK_FACE_SCENARIOS
from apps.common.responses import success_response
from apps.face_recognition.serializers import FaceEnrollmentSerializer, FaceRecognitionRequestSerializer


class FaceRecognitionListView(APIView):
    def get(self, request):
        return success_response(
            {
                'items': MOCK_FACE_SCENARIOS,
                'count': len(MOCK_FACE_SCENARIOS),
                'message': 'Face recognition features are placeholder only.',
            },
            message='Face recognition placeholders loaded',
            status_code=status.HTTP_200_OK,
        )


class FaceRecognitionMatchView(APIView):
    def post(self, request):
        serializer = FaceRecognitionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {
                'match_found': False,
                'confidence': 0.0,
                'input': serializer.validated_data,
                'message': 'Face recognition is not implemented yet.',
            },
            message='Face match request accepted',
            status_code=status.HTTP_202_ACCEPTED,
        )


class FaceEnrollmentView(APIView):
    def post(self, request):
        serializer = FaceEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {
                'enrolled': False,
                'person_name': serializer.validated_data['person_name'],
                'image_id': serializer.validated_data['image_id'],
                'message': 'Enrollment placeholder response only.',
            },
            message='Face enrollment queued',
            status_code=status.HTTP_202_ACCEPTED,
        )
