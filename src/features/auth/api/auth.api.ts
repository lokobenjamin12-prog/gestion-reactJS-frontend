import { api } from '@/shared/lib/axios';
import type { AuthUser } from '../types/auth.types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginResponse extends MessageResponse {
  user: AuthUser;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload).then((res) => res.data),

  me: () => api.get<AuthUser>('/auth/me').then((res) => res.data),

  updateMe: (payload: UpdateProfilePayload) =>
    api.patch<AuthUser>('/auth/me', payload).then((res) => res.data),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<MessageResponse>('/auth/change-password', payload).then((res) => res.data),

  uploadMyProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post<AuthUser>('/auth/me/profile-picture', formData).then((res) => res.data);
  },

  logout: () => api.post<MessageResponse>('/auth/logout').then((res) => res.data),

  forgotPassword: (email: string) =>
    api.post<MessageResponse>('/auth/forgot-password', { email }).then((res) => res.data),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    api.post<MessageResponse>('/auth/reset-password', payload).then((res) => res.data),

  verifyEmail: (token: string) =>
    api
      .get<MessageResponse & { user: Pick<AuthUser, 'id' | 'email' | 'firstName'> }>('/auth/verify-email', {
        params: { token },
      })
      .then((res) => res.data),

  resendVerification: (email: string) =>
    api.post<MessageResponse>('/auth/resend-verification', { email }).then((res) => res.data),
};
