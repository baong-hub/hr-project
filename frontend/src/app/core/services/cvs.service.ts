import api from './api.service';
import type { ApiResponse } from '../models/api.model';
import type { CandidateCvDto, CandidateProfileDto, UpdateProfileDto } from '../models/cv.model';

export const cvsService = {
  // EP-01: Cập nhật hồ sơ năng lực
  updateProfile: (data: UpdateProfileDto) => 
    api.put<ApiResponse<boolean>>('/candidates/profile', data).then(res => res.data),

  // EP-02: Tải lên file CV (PDF)
  uploadCv: (cvTitle: string, file: File) => {
    const formData = new FormData();
    formData.append('cvTitle', cvTitle);
    formData.append('file', file);
    return api.post<ApiResponse<CandidateCvDto>>('/candidates/cvs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data);
  },

  // EP-03: Lấy danh sách CV của ứng viên
  getCvs: () => 
    api.get<ApiResponse<CandidateCvDto[]>>('/candidates/cvs').then(res => res.data),

  // EP-04: Đặt làm CV chính (mặc định)
  setDefaultCv: (id: number) => 
    api.patch<ApiResponse<boolean>>(`/candidates/cvs/${id}/main`).then(res => res.data),

  // EP-05: Xóa CV
  deleteCv: (id: number) => 
    api.delete<ApiResponse<boolean>>(`/candidates/cvs/${id}`).then(res => res.data),

  // EP-06: Tìm kiếm hồ sơ ứng viên (Dành cho Employer)
  searchCandidates: (params: { page?: number; pageSize?: number; skill?: string; search?: string }) => 
    api.get<ApiResponse<CandidateProfileDto[]>>('/candidates', { params }).then(res => res.data)
};
