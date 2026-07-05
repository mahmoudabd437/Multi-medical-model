import { apiClient } from '@/services/api/client';
import type { ApiResponse } from '@/services/api/types';
import type { AuthUser } from '@/context/AuthContext';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  expires_in: number;
  token_type: string;
  request?: string;
  user: AuthUser;
};

export type RefreshResponse = {
  access: string;
  refresh: string;
  token_type: string;
  expires_in: number;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login/', payload);
  return response.data.data;
}

export async function refreshToken(refresh: string): Promise<RefreshResponse> {
  const response = await apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh/', { refresh });
  return response.data.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me/');
  return response.data.data;
}

export async function logout(): Promise<{ revoked: boolean }> {
  const response = await apiClient.post<ApiResponse<{ revoked: boolean }>>('/auth/logout/');
  return response.data.data;
}

export async function requestPasswordReset(email: string): Promise<{ email: string; sent: boolean }> {
  const response = await apiClient.post<ApiResponse<{ email: string; sent: boolean }>>('/auth/password-reset/', { email });
  return response.data.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ changed: boolean }> {
  const response = await apiClient.post<ApiResponse<{ changed: boolean }>>('/auth/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data.data;
}
