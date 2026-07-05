from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.authentication.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    RefreshTokenSerializer,
)
from apps.common.mock_data import MOCK_AUTH, MOCK_USER
from apps.common.responses import success_response


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {
                **MOCK_AUTH,
                'request': serializer.validated_data['email'],
            },
            message='Login successful',
            status_code=status.HTTP_200_OK,
        )


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {
                'access': 'mock-refreshed-access-token',
                'refresh': serializer.validated_data['refresh'],
                'token_type': 'Bearer',
                'expires_in': 900,
            },
            message='Token refreshed',
            status_code=status.HTTP_200_OK,
        )


class MeView(APIView):
    def get(self, request):
        return success_response(MOCK_USER, message='Current user profile', status_code=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request):
        return success_response({'revoked': True}, message='Logout successful', status_code=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {'email': serializer.validated_data['email'], 'sent': True},
            message='Password reset link queued',
            status_code=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response({'changed': True}, message='Password updated', status_code=status.HTTP_200_OK)
