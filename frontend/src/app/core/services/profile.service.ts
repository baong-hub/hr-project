import api from './api.service';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  staffCode: string | null;
  departmentName: string | null;
  positionNames: string[];
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await api.put('/profile/change-password', payload);
    return response.data;
  },
};
