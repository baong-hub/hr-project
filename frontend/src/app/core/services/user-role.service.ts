import api from './api.service';
import type {
  RoleListItem,
  RoleDetail,
  PermissionTreeNode,
  RoleChangeLog,
  UserPermissionSummary,
  DataScope,
  RoleLevel,
} from '../models/user-role.model';
import type { ApiResponse, PagedResult } from '../models/api.model.ts';

export const userRoleService = {
  // Roles
  getRoles: async (params: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) => {
    const response = await api.get<ApiResponse<PagedResult<RoleListItem>>>('/roles', { params });
    return response.data;
  },

  getRoleById: async (id: number) => {
    const response = await api.get<ApiResponse<RoleDetail>>(`/roles/${id}`);
    return response.data;
  },

  getRoleLevels: async () => {
    const response = await api.get<ApiResponse<RoleLevel[]>>('/roles/levels');
    return response.data;
  },

  createRole: async (data: { name: string; level: number; description?: string | null }) => {
    const response = await api.post<ApiResponse<number>>('/roles', data);
    return response.data;
  },

  updateRole: async (id: number, data: { name: string; level: number; description?: string | null; isActive: boolean }) => {
    const response = await api.put<ApiResponse<void>>(`/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/roles/${id}`);
    return response.data;
  },

  assignPermissions: async (roleId: number, permissions: { permissionId: number; dataScope: DataScope }[]) => {
    const response = await api.put<ApiResponse<void>>(`/roles/${roleId}/permissions`, { roleId, permissions });
    return response.data;
  },

  cloneRole: async (id: number, newName: string) => {
    const response = await api.post<ApiResponse<number>>(`/roles/${id}/clone`, newName);
    return response.data;
  },

  getRoleLogs: async (id: number) => {
    const response = await api.get<ApiResponse<RoleChangeLog[]>>(`/roles/${id}/logs`);
    return response.data;
  },

  // Permissions
  getPermissionTree: async () => {
    const response = await api.get<ApiResponse<PermissionTreeNode[]>>('/permissions/tree');
    return response.data;
  },

  // User-Roles
  getUserRoles: async (userId: number) => {
    const response = await api.get<ApiResponse<number[]>>(`/users/${userId}/roles`);
    return response.data;
  },

  assignUserRoles: async (userId: number, roleIds: number[]) => {
    const response = await api.put<ApiResponse<void>>(`/users/${userId}/roles`, roleIds);
    return response.data;
  },

  getUserPermissionSummary: async (userId: number) => {
    const response = await api.get<ApiResponse<UserPermissionSummary[]>>(`/users/${userId}/permissions-summary`);
    return response.data;
  },

  assignUsers: async (roleId: number, userIds: number[]) => {
    const response = await api.put<ApiResponse<void>>(`/roles/${roleId}/users`, userIds);
    return response.data;
  },

  getUserDirectPermissions: async (userId: number) => {
    const response = await api.get<ApiResponse<{ permissionId: number; dataScope: string }[]>>(`/users/${userId}/direct-permissions`);
    return response.data;
  },

  assignUserDirectPermissions: async (userId: number, permissions: { permissionId: number; dataScope: string | number }[]) => {
    const response = await api.put<ApiResponse<void>>(`/users/${userId}/direct-permissions`, permissions);
    return response.data;
  },
};

