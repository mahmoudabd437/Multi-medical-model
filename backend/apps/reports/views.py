from __future__ import annotations

from urllib.parse import urlencode

from rest_framework import status
from rest_framework.views import APIView

from apps.common.responses import success_response
from apps.history.serializers import HistoryRecordSerializer
from apps.history.views import _all_history_records, _apply_filters
from apps.reports.serializers import ReportFilterSerializer, ReportRequestSerializer


class ReportListView(APIView):
    def get(self, request):
        serializer = ReportFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        filters = dict(serializer.validated_data)
        filters.setdefault('date', 'today')
        records = [record for record in _apply_filters(_all_history_records(), filters) if record.get('modality') != 'face_recognition']
        page = filters.get('page', 1)
        page_size = filters.get('page_size', len(records) or 1)
        start = (page - 1) * page_size
        end = start + page_size
        items = records[start:end]

        return success_response(
            {
                'items': HistoryRecordSerializer(items, many=True).data,
                'count': len(records),
                'page': page,
                'page_size': page_size,
                'filters': filters,
            },
            message='Reports loaded',
            status_code=status.HTTP_200_OK,
        )


class ReportCreateView(APIView):
    def post(self, request):
        serializer = ReportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        query = urlencode(
            {
                'modality': serializer.validated_data.get('modality', ''),
                'date': 'today',
            }
        )
        return success_response(
            {
                'id': 'report_preview',
                'status': 'ready',
                'download_url': f'/api/v1/reports/?{query}' if query else '/api/v1/reports/',
                'input': serializer.validated_data,
            },
            message='Report generation queued',
            status_code=status.HTTP_202_ACCEPTED,
        )


class ReportDetailView(APIView):
    def get(self, request, report_id: str):
        records = [record for record in _apply_filters(_all_history_records(), {'date': 'today'}) if record.get('modality') != 'face_recognition']
        matched = next((item for item in records if item['id'] == report_id), None)
        if matched is None:
            matched = {
                'id': report_id,
                'title': 'Unknown report',
                'status': 'missing',
                'format': 'pdf',
            }
        return success_response(matched, message='Report detail loaded', status_code=status.HTTP_200_OK)
