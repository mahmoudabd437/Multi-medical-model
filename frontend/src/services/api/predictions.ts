import axios from 'axios';
import { apiClient } from '@/services/api/client';
import type { ApiResponse, PaginatedResponse } from '@/services/api/types';

export type PredictionModality = 'chest_xray' | 'brain_mri' | 'diabetic_retinopathy' | 'skin_disease' | 'face_recognition';

export type PredictionRequest = {
  modality: PredictionModality;
  study_id?: string;
  image_id?: string;
  notes?: string;
};

export type PredictionRecord = {
  id: string;
  study_type: string;
  status: string;
  confidence: number;
  summary: string;
  created_at?: string;
};

export type PredictionCreateResponse = {
  id: string;
  modality: PredictionModality;
  status: string;
  confidence: number;
  message: string;
  input: PredictionRequest;
};

export type ChestXrayAnalyzeRequest = {
  image: File;
  study_id?: string;
  notes?: string;
  model?: 'efficientnetb0' | 'densenet121' | 'custom_cnn';
};

export type BrainMRIModelKey = 'efficientnetb0_mri' | 'vit_mri';

export type BrainMRIAnalyzeRequest = {
  image: File;
  study_id?: string;
  notes?: string;
  model?: BrainMRIModelKey;
};

export type ChestXrayAnalyzeResponse = {
  id: string;
  prediction: 'Normal' | 'Pneumonia';
  confidence: number;
  probability: number;
  class_index: 0 | 1;
  model_name?: string;
  model: string;
  threshold: number;
  version: string;
  inference_time_seconds?: number;
  inference_time: string;
  medical_note: string;
  created_at: string;
};

export type BrainMRIAnalyzeResponse = {
  id: string;
  prediction: 'Glioma' | 'Meningioma' | 'No Tumor' | 'Pituitary Tumor' | string;
  confidence: number;
  probability: number;
  class_index: number;
  scores: Record<string, number>;
  model: string;
  version: string;
  inference_time: string;
  medical_note: string;
  created_at: string;
};

export type DiabeticRetinopathyModelKey = 'efficientnetb0_dr' | 'convnext_dr';

export type DiabeticRetinopathyAnalyzeRequest = {
  image: File;
  study_id?: string;
  notes?: string;
  model?: DiabeticRetinopathyModelKey;
};

export type DiabeticRetinopathyAnalyzeResponse = {
  id: string;
  prediction: 'No DR' | 'Mild' | 'Moderate' | 'Severe' | 'Proliferative DR' | 'Referable DR' | string;
  confidence: number;
  probability: number;
  class_index: number;
  scores: Record<string, number>;
  model: string;
  version: string;
  inference_time: string;
  medical_note: string;
  created_at: string;
};

export async function listPredictions(params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<PredictionRecord>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<PredictionRecord>>>('/predictions/', { params });
  return response.data.data;
}

export async function createPrediction(payload: PredictionRequest): Promise<PredictionCreateResponse> {
  const response = await apiClient.post<ApiResponse<PredictionCreateResponse>>('/predictions/create/', payload);
  return response.data.data;
}

export async function getPrediction(predictionId: string): Promise<PredictionRecord> {
  const response = await apiClient.get<ApiResponse<PredictionRecord>>(`/predictions/${predictionId}/`);
  return response.data.data;
}

export async function analyzeChestXray(payload: ChestXrayAnalyzeRequest): Promise<ChestXrayAnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', payload.image);

  if (payload.study_id) {
    formData.append('study_id', payload.study_id);
  }

  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  if (payload.model) {
    formData.append('model', payload.model);
  }

  try {
    // تم ضبط Content-Type على undefined ليتمكن المتصفح من إرسال الـ boundary الخاص بـ FormData
    const response = await apiClient.post<ChestXrayAnalyzeResponse>('/predict/chest/', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });

    return response.data;
  } catch (requestError) {
    if (axios.isAxiosError(requestError)) {
      const responseMessage = requestError.response?.data;
      if (responseMessage && typeof responseMessage === 'object') {
        const apiMessage = (responseMessage as { message?: unknown }).message;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
          throw new Error(apiMessage);
        }

        const apiErrors = (responseMessage as { errors?: unknown }).errors;
        if (typeof apiErrors === 'string' && apiErrors.trim()) {
          throw new Error(apiErrors);
        }
        if (apiErrors && typeof apiErrors === 'object') {
          throw new Error(JSON.stringify(apiErrors));
        }
      }

      if (requestError.message) {
        throw new Error(requestError.message);
      }
    }

    throw requestError instanceof Error ? requestError : new Error('Prediction failed.');
  }
}

export async function analyzeBrainMRI(payload: BrainMRIAnalyzeRequest): Promise<BrainMRIAnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', payload.image);

  if (payload.study_id) {
    formData.append('study_id', payload.study_id);
  }

  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  if (payload.model) {
    formData.append('model', payload.model);
  }

  try {
    const response = await apiClient.post<BrainMRIAnalyzeResponse>('/predict/brain-mri/', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });

    return response.data;
  } catch (requestError) {
    if (axios.isAxiosError(requestError)) {
      const responseMessage = requestError.response?.data;
      if (responseMessage && typeof responseMessage === 'object') {
        const apiMessage = (responseMessage as { message?: unknown }).message;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
          throw new Error(apiMessage);
        }

        const apiErrors = (responseMessage as { errors?: unknown }).errors;
        if (typeof apiErrors === 'string' && apiErrors.trim()) {
          throw new Error(apiErrors);
        }
        if (apiErrors && typeof apiErrors === 'object') {
          throw new Error(JSON.stringify(apiErrors));
        }
      }

      if (requestError.message) {
        throw new Error(requestError.message);
      }
    }

    throw requestError instanceof Error ? requestError : new Error('Brain MRI analysis failed.');
  }
}

export async function analyzeDiabeticRetinopathy(
  payload: DiabeticRetinopathyAnalyzeRequest,
): Promise<DiabeticRetinopathyAnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', payload.image);

  if (payload.study_id) {
    formData.append('study_id', payload.study_id);
  }

  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  if (payload.model) {
    formData.append('model', payload.model);
  }

  try {
    const response = await apiClient.post<DiabeticRetinopathyAnalyzeResponse>('/predict/diabetic-retinopathy/', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });

    return response.data;
  } catch (requestError) {
    if (axios.isAxiosError(requestError)) {
      const responseMessage = requestError.response?.data;
      if (responseMessage && typeof responseMessage === 'object') {
        const apiMessage = (responseMessage as { message?: unknown }).message;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
          throw new Error(apiMessage);
        }

        const apiErrors = (responseMessage as { errors?: unknown }).errors;
        if (typeof apiErrors === 'string' && apiErrors.trim()) {
          throw new Error(apiErrors);
        }
        if (apiErrors && typeof apiErrors === 'object') {
          throw new Error(JSON.stringify(apiErrors));
        }
      }

      if (requestError.message) {
        throw new Error(requestError.message);
      }
    }

    throw requestError instanceof Error ? requestError : new Error('Diabetic retinopathy analysis failed.');
  }
}
