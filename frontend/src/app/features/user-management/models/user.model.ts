export interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  accountType: 'Admin' | 'User';
  avatarUrl?: string;
  siteId: number;
  siteName: string;
  accessibleSiteIds?: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  roles?: string[];
  roleIds?: number[];
  sipUsername?: string;
  sipPassword?: string;
  positionName?: string;
  departmentName?: string;
}

export interface CreateUserDto {
  username: string;
  password?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  accountType: 'Admin' | 'User';
  siteId: number;
  accessibleSiteIds?: number[];
  roleIds?: number[];
  sipUsername?: string;
  sipPassword?: string;
}

export interface UpdateUserDto {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  accountType: 'Admin' | 'User';
  siteId: number;
  accessibleSiteIds?: number[];
  isActive: boolean;
  roleIds?: number[];
  sipUsername?: string;
  sipPassword?: string;
}

export interface GetUsersParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}
