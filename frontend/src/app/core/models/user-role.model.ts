export const DataScope = {
  ALL: 1,
  SITE: 2,
  DEPARTMENT_TREE: 3,
  DEPARTMENT: 4,
  OWN: 5,
} as const;

export type DataScope = typeof DataScope[keyof typeof DataScope];

export const parseDataScope = (value: any): DataScope => {
  if (typeof value === 'number') return value as DataScope;
  if (typeof value === 'string') {
    const v = value.toUpperCase();
    if (v === 'ALL' || v === '1') return DataScope.ALL;
    if (v === 'SITE' || v === '2') return DataScope.SITE;
    if (v === 'DEPARTMENT_TREE' || v === '3') return DataScope.DEPARTMENT_TREE;
    if (v === 'DEPARTMENT' || v === '4') return DataScope.DEPARTMENT;
    if (v === 'OWN' || v === '5') return DataScope.OWN;
  }
  return DataScope.SITE;
};

export const PermissionLevel = {
  MENU: 1,
  MODULE: 2,
  ACTION: 3,
} as const;

export type PermissionLevel = typeof PermissionLevel[keyof typeof PermissionLevel];

export interface RoleListItem {
  id: number;
  name: string;
  level: number;
  levelName: string | null;
  description: string | null;
  userCount: number;
  permissionCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoleDetail {
  id: number;
  name: string;
  level: number;
  levelName: string | null;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
}

export interface RolePermission {
  permissionId: number;
  permissionCode: string;
  dataScope: DataScope;
}

export interface PermissionTreeNode {
  id: number;
  code: string;
  name: string;
  level: PermissionLevel;
  icon: string | null;
  children: PermissionTreeNode[];
}

export interface UserRoleListItem {
  id: number;
  username: string;
  fullName: string | null;
  siteId: number;
  siteName: string;
  roles: string[];
}

export interface RoleChangeLog {
  id: number;
  createdAt: string;
  username: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
}

export interface UserPermissionSummary {
  permissionCode: string;
  dataScope: DataScope;
  grantedByRoles: string[];
}

export interface RoleLevel {
  id: number;
  level: number;
  name: string;
}
