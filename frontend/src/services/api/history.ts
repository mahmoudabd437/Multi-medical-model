import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';

export type HistoryRecord = {
  id: string;
  modality: string;
  study_type: string;
  patient_ref?: string;
  filename?: string;
  image_url?: string;
  status: string;
  reviewer: string;
  prediction?: string;
  confidence?: number;
  probability?: number;
  model_name?: string;
  upload_time?: string;
  prediction_time?: string;
  processing_time?: number;
  inference_time_seconds?: number;
  medical_note?: string;
  created_at?: string;
  date?: string;
  time?: string;
};

export type HistoryListParams = {
  status?: string;
  modality?: string;
  search?: string;
  ordering?: string;
  date?: string;
  page?: number;
  page_size?: number;
};

export async function listHistory(params?: HistoryListParams): Promise<PaginatedResponse<HistoryRecord> & { page?: number; page_size?: number }> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<HistoryRecord>>>('/history/', { params });
  return response.data.data as PaginatedResponse<HistoryRecord> & { page?: number; page_size?: number };
}

export async function getHistory(historyId: string): Promise<HistoryRecord> {
  const response = await apiClient.get<ApiResponse<HistoryRecord>>(`/history/${historyId}/`);
  return response.data.data;
}
