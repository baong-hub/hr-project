import type { AxiosResponse } from 'axios';
import api from './api.service';
import type { ApiResponse, PagedResult } from '../models/api.model';
import type { Notification, UnreadCount } from '../models/notification.model';

export const notificationService = {
  getAll: (params?: { page?: number; pageSize?: number }): Promise<AxiosResponse<ApiResponse<PagedResult<Notification>>>> => 
    api.get('/notifications', { params }),

  getUnreadCount: (): Promise<AxiosResponse<ApiResponse<UnreadCount>>> => 
    api.get('/notifications/unread-count'),

  markAsRead: (id: number): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<AxiosResponse<ApiResponse<boolean>>> => 
    api.post('/notifications/read-all'),
};
