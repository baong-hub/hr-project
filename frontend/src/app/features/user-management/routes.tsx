import type { RouteObject } from 'react-router-dom';
import { UserManagementPage } from './pages/UserManagementPage/UserManagementPage';

export const userManagementRoutes: RouteObject = {
  path: 'users',
  element: <UserManagementPage />
};
