from django.urls import path

from apps.authentication.views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetRequestView,
    RefreshTokenView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]
