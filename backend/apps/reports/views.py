from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from apps.common.mock_data import MOCK_REPORTS
from apps.common.responses import success_response
from apps.reports.serializers import ReportFilterSerializer, ReportRequestSerializer


class ReportListView(APIView):
    def get(self, request):
        serializer = ReportFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {
                'items': MOCK_REPORTS,
                'count': len(MOCK_REPORTS),
                'filters': serializer.validated_data,
            },
            message='Reports loaded',
            status_code=status.HTTP_200_OK,
        )


class ReportCreateView(APIView):
    def post(self, request):
        serializer = ReportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            {
                'id': 'rep_mock_001',
                'status': 'processing',
                'download_url': None,
                'input': serializer.validated_data,
            },
            message='Report generation queued',
            status_code=status.HTTP_202_ACCEPTED,
        )


class ReportDetailView(APIView):
    def get(self, request, report_id: str):
        matched = next((item for item in MOCK_REPORTS if item['id'] == report_id), None)
        if matched is None:
            matched = {
                'id': report_id,
                'title': 'Unknown report',
                'status': 'mock',
                'format': 'pdf',
            }
        return success_response(matched, message='Report detail loaded', status_code=status.HTTP_200_OK)
