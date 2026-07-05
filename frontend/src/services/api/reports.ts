import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';

export type ReportRecord = {
  id: string;
  title: string;
  status: string;
  format: string;
  generated_at?: string;
};

export type ReportRequest = {
  title: string;
  format: 'pdf' | 'xlsx' | 'csv';
  scope?: string;
};

export type ReportCreateResponse = {
  id: string;
  status: string;
  download_url: string | null;
  input: ReportRequest;
};

export async function listReports(params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<ReportRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<ReportRecord>>>('/reports/', { params });
  return response.data.data;
}

export async function generateReport(payload: ReportRequest): Promise<ReportCreateResponse> {
  const response = await apiClient.post<ApiResponse<ReportCreateResponse>>('/reports/generate/', payload);
  return response.data.data;
}

export async function getReport(reportId: string): Promise<ReportRecord> {
  const response = await apiClient.get<ApiResponse<ReportRecord>>(`/reports/${reportId}/`);
  return response.data.data;
}
