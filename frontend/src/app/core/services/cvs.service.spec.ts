import { cvsService } from './cvs.service';
import api from './api.service';
import type { UpdateProfileDto } from '../models/cv.model';

// Mock api service of Axios
jest.mock('./api.service', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
  }
}));

describe('cvsService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('updateProfile_WhenCalled_ShouldCallApiPutWithPayload', async () => {
      // Arrange
      const mockUpdateDto: UpdateProfileDto = {
        skills: 'C#, SQL, React',
        experienceSummary: '5 years of developer experience',
        visibilityStatus: 'PUBLIC'
      };
      const mockResponse = { data: { succeeded: true, data: true } };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await cvsService.updateProfile(mockUpdateDto);

      // Assert
      expect(api.put).toHaveBeenCalledWith('/candidates/profile', mockUpdateDto);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('uploadCv', () => {
    it('uploadCv_WhenCalled_ShouldSendFormDataToApiPost', async () => {
      // Arrange
      const cvTitle = 'My Tech CV';
      const mockFile = new File(['dummy content'], 'cv.pdf', { type: 'application/pdf' });
      const mockResponse = { data: { succeeded: true, data: { id: 1, cvTitle } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await cvsService.uploadCv(cvTitle, mockFile);

      // Assert
      expect(api.post).toHaveBeenCalledWith(
        '/candidates/cvs', 
        expect.any(FormData), 
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCvs', () => {
    it('getCvs_WhenCalled_ShouldCallApiGet', async () => {
      // Arrange
      const mockResponse = { data: { succeeded: true, data: [] } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await cvsService.getCvs();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/candidates/cvs');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('setDefaultCv', () => {
    it('setDefaultCv_WhenCalled_ShouldCallApiPatchWithId', async () => {
      // Arrange
      const cvId = 12;
      const mockResponse = { data: { succeeded: true, data: true } };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await cvsService.setDefaultCv(cvId);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/candidates/cvs/${cvId}/main`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteCv', () => {
    it('deleteCv_WhenCalled_ShouldCallApiDeleteWithId', async () => {
      // Arrange
      const cvId = 15;
      const mockResponse = { data: { succeeded: true, data: true } };
      (api.delete as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await cvsService.deleteCv(cvId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/candidates/cvs/${cvId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('searchCandidates', () => {
    it('searchCandidates_WhenCalledWithParams_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const params = { page: 1, pageSize: 10, skill: 'C#', search: 'Nam' };
      const mockResponse = { data: { succeeded: true, data: [] } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await cvsService.searchCandidates(params);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/candidates', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
