export interface UserDto {
  id: number;
  email: string;
  role: string;
  status: string;
}

export interface UserInfoDto {
  id: number;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResultDto {
  accessToken: string;
  refreshToken: string;
  user: UserInfoDto;
}
