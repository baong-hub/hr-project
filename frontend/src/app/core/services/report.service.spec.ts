import { reportService } from './report.service';
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

describe('reportService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEmployerSummary', () => {
    it('getEmployerSummary_WhenCalled_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { from: '2026-08-01', to: '2026-08-31' };
      const mockResponse = { data: { success: true, data: { totalActiveJobs: 5, totalApplications: 20, totalViews: 100, averageApplyRate: 20.0 } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await reportService.getEmployerSummary(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/reports/employer/summary', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getEmployerFunnel', () => {
    it('getEmployerFunnel_WhenCalled_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { from: '2026-08-01', to: '2026-08-31' };
      const mockResponse = { data: { success: true, data: { stages: [] } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await reportService.getEmployerFunnel(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/reports/employer/funnel', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAdminSummary', () => {
    it('getAdminSummary_WhenCalled_ShouldCallApiGet', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: { totalCompanies: 10, totalCandidates: 100, totalJobs: 50, totalApplications: 200 } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await reportService.getAdminSummary();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/reports/admin/summary');
      expect(result).toEqual(mockResponse);
    });
  });
});
