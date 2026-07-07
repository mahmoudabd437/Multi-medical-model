import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';

export type HistoryRecord = {
  id: string;
  modality?: string;
  study_type: string;
  patient_ref: string;
  status: string;
  reviewer: string;
  created_at?: string;
  prediction?: string;
  confidence?: number;
  probability?: number;
  model_name?: string;
  inference_time_seconds?: number;
  medical_note?: string;
};

export async function listHistory(params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<HistoryRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<HistoryRecord>>>('/history/', { params });
  return response.data.data;
}

export async function getHistory(historyId: string): Promise<HistoryRecord> {
  const response = await apiClient.get<ApiResponse<HistoryRecord>>(`/history/${historyId}/`);
  return response.data.data;
}
