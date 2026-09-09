import api from './api.service';
import type { ApiResponse } from '../models/api.model';
import type { CandidateCvDto, CandidateProfileDto, UpdateProfileDto, SearchCandidatesParams, InviteCandidateRequest } from '../models/cv.model';

export const cvsService = {
  // EP-00: Lấy hồ sơ năng lực của ứng viên hiện tại
  getProfile: () => 
    api.get<ApiResponse<CandidateProfileDto>>('/candidates/profile').then(res => res.data),

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

  // EP-06: Tìm kiếm hồ sơ ứng viên (Dành cho Employer - Active Talent Sourcing)
  searchCandidates: (params: SearchCandidatesParams) => 
    api.get<ApiResponse<CandidateProfileDto[]>>('/candidates', { params }).then(res => res.data),

  // EP-07: Mời ứng viên ứng tuyển vào Job
  inviteToJob: (candidateId: number, data: InviteCandidateRequest) =>
    api.post<ApiResponse<boolean>>(`/candidates/${candidateId}/invite-job`, data).then(res => res.data),

  // EP-08: Lấy hoặc tạo phòng chat trực tiếp với ứng viên
  getOrCreateDirectChat: (candidateUserId: number, jobId?: number) =>
    api.post<ApiResponse<{ conversationId: number }>>('/messages/get-or-create-direct', { candidateUserId, jobId }).then(res => res.data)
};
