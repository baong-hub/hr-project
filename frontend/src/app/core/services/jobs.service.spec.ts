import { jobsService } from './jobs.service';
import api from './api.service';
import type { CreateJobDto } from '../models/job.model';

// Mock api service of Axios
jest.mock('./api.service', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  }
}));

describe('jobsService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getJobs', () => {
    it('getJobs_WhenCalled_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { city: 'Hà Nội', search: '.NET' };
      const mockResponse = { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await jobsService.getJobs(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/jobs', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createJob', () => {
    it('createJob_WhenValidDto_ShouldCallApiPostWithPayload', async () => {
      // Arrange
      const mockCreateDto: CreateJobDto = {
        title: 'React Senior Developer',
        description: 'React description text with at least 50 characters to pass validation.',
        requirements: 'React requirements text with at least 50 characters to pass validation.',
        city: 'Hà Nội',
        expiredAt: '2026-09-30'
      };
      const mockResponse = { data: { success: true, data: { id: 10 } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await jobsService.createJob(mockCreateDto);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/jobs', mockCreateDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateJobStatus', () => {
    it('updateJobStatus_WhenCalled_ShouldCallApiPatchWithPayload', async () => {
      // Arrange
      const jobId = 100;
      const statusPayload = { status: 'PUBLISHED' as const };
      const mockResponse = { data: { success: true } };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await jobsService.updateJobStatus(jobId, statusPayload);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/jobs/${jobId}/status`, { id: jobId, ...statusPayload });
      expect(result).toEqual(mockResponse);
    });
  });
});
