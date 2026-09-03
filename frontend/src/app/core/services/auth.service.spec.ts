import { authService } from './auth.service';
import api from './api.service';

// Mock api service
jest.mock('./api.service', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('authService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('registerCandidate', () => {
    it('registerCandidate_WhenValidDto_ShouldCallApiPostAndReturnResponse', async () => {
      // Arrange
      const mockDto = { fullName: 'Nguyen Van A', email: 'test@example.com', password: 'Password123', phoneNumber: '0901234567' };
      const mockResponse = { data: { success: true, data: { id: 1, email: 'test@example.com' } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await authService.registerCandidate(mockDto);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/register/candidate', mockDto);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('registerEmployer', () => {
    it('registerEmployer_WhenValidDto_ShouldCallApiPostAndReturnResponse', async () => {
      // Arrange
      const mockDto = { email: 'hr@company.com', password: 'Password123', fullName: 'Nguyen Van B', phoneNumber: '0912345678', position: 'HR Manager', companyName: 'Company A' };
      const mockResponse = { data: { success: true, data: { id: 2, email: 'hr@company.com' } } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await authService.registerEmployer(mockDto);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/register/employer', mockDto);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('login', () => {
    it('login_WhenSuccessful_ShouldStoreTokensInLocalStorage', async () => {
      // Arrange
      const credentials = { email: 'user@example.com', password: 'Password123' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            user: { id: 1, email: 'user@example.com', role: 'CANDIDATE' }
          }
        }
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('mock_access_token');
      expect(localStorage.getItem('refreshToken')).toBe('mock_refresh_token');
      expect(localStorage.getItem('user')).toContain('user@example.com');
    });
  });

  describe('refreshToken', () => {
    it('refreshToken_WhenStoredTokenExists_ShouldCallApiAndStoreNewTokens', async () => {
      // Arrange
      localStorage.setItem('refreshToken', 'old_refresh_token');
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new_access_token',
            refreshToken: 'new_refresh_token',
            user: { id: 1, email: 'user@example.com', role: 'CANDIDATE' }
          }
        }
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await authService.refreshToken();

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old_refresh_token' });
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('new_access_token');
      expect(localStorage.getItem('refreshToken')).toBe('new_refresh_token');
    });
  });

  describe('logout', () => {
    it('logout_WhenCalled_ShouldCallApiPostAndClearLocalStorage', async () => {
      // Arrange
      localStorage.setItem('token', 'access_token');
      localStorage.setItem('refreshToken', 'refresh_token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      // Act
      await authService.logout();

      // Assert
      expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh_token' }, expect.any(Object));
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
