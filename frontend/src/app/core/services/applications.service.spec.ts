import { applicationsService } from './applications.service';
import api from './api.service';
import { SubmitApplicationDto } from '../models/application.model';

// Mock api service of Axios
jest.mock('./api.service', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  }
}));

describe('applicationsService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApplications', () => {
    it('getApplications_WhenCalledWithParams_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { page: 1, pageSize: 10, jobId: 5 };
      const mockResponse = { data: { success: true, data: { items: [], meta: {} } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await applicationsService.getApplications(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/applications', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getApplicationById', () => {
    it('getApplicationById_WhenValidId_ShouldCallApiGetWithId', async () => {
      // Arrange
      const appId = 42;
      const mockResponse = { data: { success: true, data: { id: appId } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await applicationsService.getApplicationById(appId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/applications/${appId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitApplication', () => {
    it('submitApplication_WhenValidPayload_ShouldCallApiPostWithPayload', async () => {
      // Arrange
      const payload: SubmitApplicationDto = {
        jobId: 10,
        candidateCvId: 100,
        coverLetter: 'I am highly interested in this role.'
      };
      const mockResponse = { data: { success: true, data: { id: 1 } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await applicationsService.submitApplication(payload);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/applications', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changeStatus', () => {
    it('changeStatus_WhenCalled_ShouldCallApiPatchWithStatus', async () => {
      // Arrange
      const appId = 12;
      const newStatus = 'SCREENING';
      const mockResponse = { data: { success: true, data: true } };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await applicationsService.changeStatus(appId, newStatus);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/applications/${appId}/status`, { status: newStatus });
      expect(result).toEqual(mockResponse);
    });
  });
});
