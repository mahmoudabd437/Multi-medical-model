from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from apps.common.mock_data import MOCK_HISTORY
from apps.common.responses import success_response
from apps.history.serializers import HistoryFilterSerializer, HistoryRecordSerializer
from apps.predictions.models import ChestXrayPrediction


class HistoryListView(APIView):
    def get(self, request):
        serializer = HistoryFilterSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        queryset = ChestXrayPrediction.objects.all()

        status_filter = serializer.validated_data.get('status')
        search_term = serializer.validated_data.get('search')

        if status_filter and status_filter.lower() not in {'completed', 'all'}:
            queryset = queryset.none()

        if search_term:
            queryset = queryset.filter(
                study_id__icontains=search_term,
            )

        if queryset.exists():
            items = HistoryRecordSerializer(queryset, many=True).data
        else:
            items = MOCK_HISTORY

        return success_response(
            {
                'items': items,
                'count': len(items),
                'filters': serializer.validated_data,
            },
            message='History loaded',
            status_code=status.HTTP_200_OK,
        )


class HistoryDetailView(APIView):
    def get(self, request, history_id: str):
        matched = ChestXrayPrediction.objects.filter(id=history_id).first()
        if matched is not None:
            payload = HistoryRecordSerializer(matched).data
        else:
            payload = next((item for item in MOCK_HISTORY if item['id'] == history_id), None)
            if payload is None:
                payload = {
                    'id': history_id,
                    'study_type': 'Unknown',
                    'status': 'mock',
                    'reviewer': 'Unavailable',
                }
        return success_response(payload, message='History item loaded', status_code=status.HTTP_200_OK)
