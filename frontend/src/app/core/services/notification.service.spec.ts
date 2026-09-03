import { notificationService } from './notification.service';
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

describe('notificationService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('getAll_WhenCalled_ShouldCallApiGetWithParams', async () => {
      // Arrange
      const mockParams = { page: 1, pageSize: 10 };
      const mockResponse = { data: { success: true, data: { items: [], meta: { total: 0 } } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await notificationService.getAll(mockParams);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/notifications', { params: mockParams });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUnreadCount', () => {
    it('getUnreadCount_WhenCalled_ShouldCallApiGet', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: { count: 5 } } };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await notificationService.getUnreadCount();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsRead', () => {
    it('markAsRead_WhenCalled_ShouldCallApiPatchWithId', async () => {
      // Arrange
      const notificationId = 123;
      const mockResponse = { data: { success: true, data: true } };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await notificationService.markAsRead(notificationId);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/notifications/${notificationId}/read`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAllAsRead', () => {
    it('markAllAsRead_WhenCalled_ShouldCallApiPost', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: true } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await notificationService.markAllAsRead();

      // Assert
      expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toEqual(mockResponse);
    });
  });
});
