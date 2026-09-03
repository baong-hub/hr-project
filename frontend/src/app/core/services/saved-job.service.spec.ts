import { savedJobService } from './saved-job.service';
import api from './api.service';

jest.mock('./api.service', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  }
}));

describe('savedJobService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleSave', () => {
    it('toggleSave_WhenCalled_ShouldCallApiPost', async () => {
      // Arrange
      const mockJobId = 12;
      const mockResponse = { data: { success: true, data: { jobId: mockJobId, isSaved: true } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await savedJobService.toggleSave(mockJobId);

      // Assert
      expect(api.post).toHaveBeenCalledWith(`/jobs/${mockJobId}/save`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSavedJobs', () => {
    it('getSavedJobs_WhenCalled_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { page: 2, pageSize: 20 };
      const mockResponse = { data: { success: true, data: { items: [], meta: { page: 2, pageSize: 20, total: 0, totalPages: 0 } } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await savedJobService.getSavedJobs(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/jobs/saved', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });
});
