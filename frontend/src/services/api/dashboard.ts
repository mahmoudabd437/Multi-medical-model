import { apiClient } from '@/services/api/client';
import type { ApiResponse } from '@/services/api/types';
import type { HistoryRecord } from '@/services/api/history';

export type DashboardModelBreakdown = {
  modality: string;
  label: string;
  accuracy: number;
  predictions: number;
};

export type DashboardStats = {
  total_predictions: number;
  today_predictions: number;
  average_turnaround_seconds: number;
  active_models: number;
  average_accuracy: number;
  model_breakdown: DashboardModelBreakdown[];
  recent_predictions: HistoryRecord[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<ApiResponse<DashboardStats>>('/predictions/stats/');
  return response.data.data;
}
