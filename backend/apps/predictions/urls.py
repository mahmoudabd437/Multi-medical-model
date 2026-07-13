from django.urls import path

from apps.predictions.views import DashboardStatsView, PredictionCreateView, PredictionDetailView, PredictionListView

urlpatterns = [
    path('', PredictionListView.as_view(), name='prediction-list'),
    path('stats/', DashboardStatsView.as_view(), name='prediction-stats'),
    path('create/', PredictionCreateView.as_view(), name='prediction-create'),
    path('<str:prediction_id>/', PredictionDetailView.as_view(), name='prediction-detail'),
]
