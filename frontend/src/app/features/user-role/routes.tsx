import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

const RoleListPage = lazy(() => import('./pages/RoleListPage/RoleListPage'));
const RoleFormPage = lazy(() => import('./pages/RoleFormPage/RoleFormPage'));
const RoleDetailPage = lazy(() => import('./pages/RoleDetailPage/RoleDetailPage'));
const RolePermissionPage = lazy(() => import('./pages/RolePermissionPage/RolePermissionPage'));
const UserRoleListPage = lazy(() => import('./pages/UserRoleListPage/UserRoleListPage'));
const UserRoleAssignPage = lazy(() => import('./pages/UserRoleAssignPage/UserRoleAssignPage'));
const RoleUserAssignmentPage = lazy(() => import('./pages/RoleUserAssignmentPage/RoleUserAssignmentPage'));
const UserPermissionPage = lazy(() => import('./pages/UserPermissionPage/UserPermissionPage'));

export const userRoleRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="roles" replace /> },
  { path: 'roles', element: <RoleListPage /> },
  { path: 'roles/new', element: <RoleFormPage /> },
  { path: 'roles/:id', element: <RoleDetailPage /> },
  { path: 'roles/:id/edit', element: <RoleFormPage /> },
  { path: 'roles/:id/permissions', element: <RolePermissionPage /> },
  { path: 'roles/:id/assign', element: <RoleUserAssignmentPage /> },
  { path: 'users', element: <UserRoleListPage /> },
  { path: 'users/:id/roles', element: <UserRoleAssignPage /> },
  { path: 'users/:id/permissions', element: <UserPermissionPage /> },
];
