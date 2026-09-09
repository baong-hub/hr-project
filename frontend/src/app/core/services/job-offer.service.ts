import api from './api.service';
import type { ApiResponse } from '../models/api.model';
import type {
  JobOffer,
  CreateJobOfferRequest,
  RespondJobOfferRequest,
  CancelJobOfferRequest,
  JobOfferStatus
} from '../models/job-offer.model';

export const jobOfferService = {
  /** Phát hành Thư Mời Nhận Việc (Job Offer) */
  createOffer: (data: CreateJobOfferRequest) =>
    api.post<ApiResponse<JobOffer>>('/job-offers', data),

  /** Tải lên file PDF Thư mời nhận việc chính thức */
  uploadOfferLetter: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ fileUrl: string; fileName: string; fileSizeBytes: number }>>(
      '/job-offers/upload-letter',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  },

  /** Ứng viên phản hồi Offer (Đồng ý, Đề xuất thương lượng, Từ chối) */
  respondOffer: (id: number, data: RespondJobOfferRequest) =>
    api.post<ApiResponse<JobOffer>>(`/job-offers/${id}/respond`, data),

  /** Nhà tuyển dụng huỷ/thu hồi Thư mời nhận việc */
  cancelOffer: (id: number, data?: CancelJobOfferRequest) =>
    api.post<ApiResponse<JobOffer>>(`/job-offers/${id}/cancel`, data ?? {}),

  /** Lấy chi tiết Offer theo ID */
  getOfferById: (id: number) =>
    api.get<ApiResponse<JobOffer>>(`/job-offers/${id}`),

  /** Lấy Offer theo Application ID */
  getOfferByApplicationId: (applicationId: number) =>
    api.get<ApiResponse<JobOffer | null>>(`/job-offers/application/${applicationId}`),

  /** Danh sách Offers cho Nhà tuyển dụng */
  getEmployerOffers: (jobId?: number, status?: JobOfferStatus) => {
    const params = new URLSearchParams();
    if (jobId) params.append('jobId', jobId.toString());
    if (status) params.append('status', status);
    return api.get<ApiResponse<JobOffer[]>>(`/job-offers/employer?${params.toString()}`);
  },

  /** Danh sách Offers của Ứng viên */
  getCandidateOffers: (status?: JobOfferStatus) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return api.get<ApiResponse<JobOffer[]>>(`/job-offers/candidate?${params.toString()}`);
  }
};
