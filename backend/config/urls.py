from __future__ import annotations

from django.contrib import admin
from django.urls import include, path

from apps.predictions.views import ChestXrayPredictView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/predictions/', include('apps.predictions.urls')),
    path('api/v1/history/', include('apps.history.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/face-recognition/', include('apps.face_recognition.urls')),
    path('api/v1/predict/chest/', ChestXrayPredictView.as_view(), name='predict-chest-v1'),
    path('api/predict/chest/', ChestXrayPredictView.as_view(), name='predict-chest'),
]
