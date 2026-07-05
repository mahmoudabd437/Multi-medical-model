from django.urls import path

from apps.face_recognition.views import FaceEnrollmentView, FaceRecognitionListView, FaceRecognitionMatchView

urlpatterns = [
    path('', FaceRecognitionListView.as_view(), name='face-list'),
    path('match/', FaceRecognitionMatchView.as_view(), name='face-match'),
    path('enroll/', FaceEnrollmentView.as_view(), name='face-enroll'),
]
