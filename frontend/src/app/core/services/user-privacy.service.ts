import api from './api.service';

export interface UserExportData {
  userId: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
  candidateProfile?: any;
  applications: any[];
  savedJobs: any[];
  exportedAt: string;
  legalNotice: string;
}

export const userPrivacyService = {
  async exportMyData(): Promise<UserExportData> {
    const res = await api.get('/users/me/export-data');
    return res.data?.data;
  },

  async anonymizeMyAccount(): Promise<boolean> {
    const res = await api.post('/users/me/anonymize');
    return res.data?.success ?? true;
  }
};
