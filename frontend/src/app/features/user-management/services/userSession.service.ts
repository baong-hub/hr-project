import api from '../../../core/services/api.service';

export interface UserSessionDto {
  id: number;
  sessionId: string;
  userId: number;
  username: string;
  fullName: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  loginTime: string;
  lastActiveAt: string;
  expiresAt: string;
  isRevoked: boolean;
  isCurrentSession: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export const userSessionService = {
  getActiveSessions: (search?: string, userId?: number): Promise<ApiResponse<UserSessionDto[]>> => {
    return api.get('/auth/sessions', { params: { search, userId } }).then(res => res.data);
  },

  revokeSession: (sessionId: string): Promise<ApiResponse<boolean>> => {
    return api.delete(`/auth/sessions/${sessionId}`).then(res => res.data);
  },

  revokeAllUserSessions: (userId: number, exceptCurrent = true): Promise<ApiResponse<number>> => {
    return api.delete(`/auth/sessions/user/${userId}`, { params: { exceptCurrent } }).then(res => res.data);
  }
};
