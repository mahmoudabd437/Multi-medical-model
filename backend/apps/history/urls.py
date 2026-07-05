from django.urls import path

from apps.history.views import HistoryDetailView, HistoryListView

urlpatterns = [
    path('', HistoryListView.as_view(), name='history-list'),
    path('<str:history_id>/', HistoryDetailView.as_view(), name='history-detail'),
]
