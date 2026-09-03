export type ThemeMode = 'Light' | 'Dark';

export interface UserSetting {
  themeMode: ThemeMode;
  language: string;
  updatedAt: string;
}

export interface UpdateThemeDto {
  themeMode: ThemeMode;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: any;
}

export interface UserColumnSetting {
  gridKey: string;
  columnSettingsJson: string;
  updatedAt: string;
}
