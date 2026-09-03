import api from '../../../core/services/api.service';
import type { ApiResponse, UpdateThemeDto, UserSetting, UserColumnSetting } from '../models/user-setting.model';

const BASE_URL = '/user-settings';

export const userSettingService = {
  getMySettings(): Promise<{ data: ApiResponse<UserSetting> }> {
    return api.get(`${BASE_URL}/me`);
  },

  updateTheme(dto: UpdateThemeDto): Promise<{ data: ApiResponse<UserSetting> }> {
    return api.put(`${BASE_URL}/me/theme`, dto);
  },
  
  updateLanguage(language: string): Promise<{ data: ApiResponse<UserSetting> }> {
    return api.put(`${BASE_URL}/me/language`, { language });
  },

  getColumnSettings(gridKey: string): Promise<{ data: ApiResponse<UserColumnSetting> }> {
    return api.get(`${BASE_URL}/columns/${gridKey}`);
  },

  updateColumnSettings(gridKey: string, columnSettingsJson: string): Promise<{ data: ApiResponse<UserColumnSetting> }> {
    return api.put(`${BASE_URL}/columns/${gridKey}`, { columnSettingsJson });
  },

  getSystemConfigsGrouped(): Promise<{ data: ApiResponse<Array<{ groupName: string; items: Array<{ id: number; configKey: string; configValue: string; group?: string; description?: string; updatedAt: string }> }>> }> {
    return api.get(`${BASE_URL}/system-configs`);
  },

  updateSystemConfigs(items: Array<{ configKey: string; configValue: string }>): Promise<{ data: ApiResponse<Record<string, string>> }> {
    return api.put(`${BASE_URL}/system-configs`, { items });
  }
};
