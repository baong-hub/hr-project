import { companiesService } from './companies.service';
import api from './api.service';
import type { UpdateCompanyDto } from '../models/company.model';

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

describe('companiesService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanies', () => {
    it('getCompanies_WhenCalled_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { page: 1, pageSize: 10, search: 'FPT', industry: 'Công nghệ thông tin' };
      const mockResponse = { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await companiesService.getCompanies(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/companies', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCompanyById', () => {
    it('getCompanyById_WhenCalled_ShouldCallApiGetWithId', async () => {
      // Arrange
      const companyId = 15;
      const mockResponse = { data: { success: true, data: { id: 15, name: 'FPT Software' } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await companiesService.getCompanyById(companyId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/companies/${companyId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateCompany', () => {
    it('updateCompany_WhenValidDto_ShouldCallApiPutWithPayload', async () => {
      // Arrange
      const companyId = 15;
      const mockUpdateDto: UpdateCompanyDto = {
        name: 'FPT Software Global',
        logoUrl: 'https://example.com/logo.png',
        bannerUrl: 'https://example.com/banner.png',
        description: 'New detailed descriptions...',
        website: 'https://fpt-software.com',
        sizeRange: '1000+',
        industry: 'Công nghệ thông tin',
        addressList: 'Hà Nội Office\nHCM Office'
      };
      const mockResponse = { data: { success: true, data: { id: 15, name: 'FPT Software Global' } } };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await companiesService.updateCompany(companyId, mockUpdateDto);

      // Assert
      expect(api.put).toHaveBeenCalledWith(`/companies/${companyId}`, { id: companyId, ...mockUpdateDto });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('followCompany', () => {
    it('followCompany_WhenCalled_ShouldCallApiPostWithId', async () => {
      // Arrange
      const companyId = 20;
      const mockResponse = { data: { success: true, data: { companyId: 20, isFollowing: true, followersCount: 10 } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await companiesService.followCompany(companyId);

      // Assert
      expect(api.post).toHaveBeenCalledWith(`/companies/${companyId}/follow`);
      expect(result).toEqual(mockResponse);
    });
  });
});
