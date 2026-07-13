import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';
import type { HistoryRecord } from '@/services/api/history';

export type ReportRecord = HistoryRecord;

export type ReportListParams = {
  modality?: string;
  search?: string;
  ordering?: string;
  date?: string;
  page?: number;
  page_size?: number;
};

export type ReportRequest = {
  title: string;
  format: 'pdf' | 'csv';
  scope?: string;
  modality?: string;
};

export type ReportCreateResponse = {
  id: string;
  status: string;
  download_url: string | null;
  input: ReportRequest;
};

export async function listReports(params?: ReportListParams): Promise<PaginatedResponse<ReportRecord> & { page?: number; page_size?: number }> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<ReportRecord>>>('/reports/', { params });
  return response.data.data as PaginatedResponse<ReportRecord> & { page?: number; page_size?: number };
}

export async function generateReport(payload: ReportRequest): Promise<ReportCreateResponse> {
  const response = await apiClient.post<ApiResponse<ReportCreateResponse>>('/reports/generate/', payload);
  return response.data.data;
}

export async function getReport(reportId: string): Promise<ReportRecord> {
  const response = await apiClient.get<ApiResponse<ReportRecord>>(`/reports/${reportId}/`);
  return response.data.data;
}
