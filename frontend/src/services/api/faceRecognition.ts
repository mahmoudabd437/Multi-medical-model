import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';

export type FaceRecognitionRecord = {
  id: string;
  status: string;
  message: string;
};

export type FaceRecognitionMatchRequest = {
  image_id: string;
  person_id?: string;
};

export type FaceEnrollmentRequest = {
  person_name: string;
  image_id: string;
};

export type FaceRecognitionMatchResponse = {
  match_found: boolean;
  confidence: number;
  input: FaceRecognitionMatchRequest;
  message: string;
};

export type FaceEnrollmentResponse = {
  enrolled: boolean;
  person_name: string;
  image_id: string;
  message: string;
};

export async function listFaceRecognitionRecords(): Promise<PaginatedResponse<FaceRecognitionRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<FaceRecognitionRecord>>>('/face-recognition/');
  return response.data.data;
}

export async function matchFace(payload: FaceRecognitionMatchRequest): Promise<FaceRecognitionMatchResponse> {
  const response = await apiClient.post<ApiResponse<FaceRecognitionMatchResponse>>('/face-recognition/match/', payload);
  return response.data.data;
}

export async function enrollFace(payload: FaceEnrollmentRequest): Promise<FaceEnrollmentResponse> {
  const response = await apiClient.post<ApiResponse<FaceEnrollmentResponse>>('/face-recognition/enroll/', payload);
  return response.data.data;
}
