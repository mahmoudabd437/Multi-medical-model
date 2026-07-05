from django.urls import path

from apps.reports.views import ReportCreateView, ReportDetailView, ReportListView

urlpatterns = [
    path('', ReportListView.as_view(), name='report-list'),
    path('generate/', ReportCreateView.as_view(), name='report-create'),
    path('<str:report_id>/', ReportDetailView.as_view(), name='report-detail'),
]
