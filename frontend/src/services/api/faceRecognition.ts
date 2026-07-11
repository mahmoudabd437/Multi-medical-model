import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';

export type FaceRecognitionRecord = {
  id: string;
  person_id: string;
  person_name: string;
  notes: string;
  source_image_name: string;
  embedding_size: number;
  match_count: number;
  last_similarity: number | null;
  created_at: string;
  updated_at: string;
};

export type FaceRecognitionMatchRequest = {
  image: File;
  person_id?: string;
  threshold?: number;
};

export type FaceEnrollmentRequest = {
  person_name: string;
  image: File;
  person_id?: string;
  notes?: string;
};

export type FaceRecognitionMatchResponse = {
  match_found: boolean;
  confidence: number;
  similarity: number;
  threshold: number;
  person_id?: string | null;
  match: {
    id: string;
    person_id: string;
    person_name: string;
    similarity: number;
    confidence: number;
  } | null;
  candidates: Array<{
    id: string;
    person_id: string;
    person_name: string;
    similarity: number;
    confidence: number;
  }>;
  face_count: number;
  version: string;
  inference_time: string;
  message: string;
};

export type FaceEnrollmentResponse = {
  enrolled: boolean;
  created: boolean;
  person_id: string;
  person_name: string;
  notes: string;
  source_image_name: string;
  embedding_size: number;
  face_count: number;
  confidence: number;
  bbox: number[];
  version: string;
  inference_time: string;
  enrollment: {
    id: string;
    person_id: string;
    person_name: string;
    notes: string;
    source_image_name: string;
    embedding_size: number;
    match_count: number;
    last_similarity: number | null;
    created_at: string;
    updated_at: string;
  };
  message: string;
};

export async function listFaceRecognitionRecords(): Promise<PaginatedResponse<FaceRecognitionRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<FaceRecognitionRecord>>>('/face-recognition/');
  return response.data.data;
}

export async function matchFace(payload: FaceRecognitionMatchRequest): Promise<FaceRecognitionMatchResponse> {
  const formData = new FormData();
  formData.append('image', payload.image);
  if (payload.person_id) {
    formData.append('person_id', payload.person_id);
  }
  if (typeof payload.threshold === 'number') {
    formData.append('threshold', String(payload.threshold));
  }

  const response = await apiClient.post<ApiResponse<FaceRecognitionMatchResponse>>('/face-recognition/match/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

export async function enrollFace(payload: FaceEnrollmentRequest): Promise<FaceEnrollmentResponse> {
  const formData = new FormData();
  formData.append('person_name', payload.person_name);
  formData.append('image', payload.image);
  if (payload.person_id) {
    formData.append('person_id', payload.person_id);
  }
  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  const response = await apiClient.post<ApiResponse<FaceEnrollmentResponse>>('/face-recognition/enroll/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}
