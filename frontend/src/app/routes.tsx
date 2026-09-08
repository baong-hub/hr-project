import React from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from './core/layout/AppShell/AppShell';
import { authService } from './core/services/auth.service';
import { userRoleRoutes } from './features/user-role/routes';

// Auth Module Pages (Lazy loaded)
const LoginPage = React.lazy(() => import('./features/authentication/pages/LoginPage/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterCandidatePage = React.lazy(() => import('./features/authentication/pages/RegisterCandidatePage/RegisterCandidatePage').then(m => ({ default: m.RegisterCandidatePage })));
const RegisterEmployerPage = React.lazy(() => import('./features/authentication/pages/RegisterEmployerPage/RegisterEmployerPage').then(m => ({ default: m.RegisterEmployerPage })));

// HR Module Pages
const JobDetailPage = React.lazy(() => import('./features/jobs/pages/JobDetailPage').then(m => ({ default: m.JobDetailPage })));
const EmployerJobListPage = React.lazy(() => import('./features/jobs/pages/EmployerJobListPage').then(m => ({ default: m.EmployerJobListPage })));
const JobFormPage = React.lazy(() => import('./features/jobs/pages/JobFormPage').then(m => ({ default: m.JobFormPage })));
const CandidateAppHistoryPage = React.lazy(() => import('./features/applications/pages/CandidateAppHistoryPage').then(m => ({ default: m.CandidateAppHistoryPage })));
const EmployerAppManagePage = React.lazy(() => import('./features/applications/pages/EmployerAppManagePage').then(m => ({ default: m.EmployerAppManagePage })));
const CompanyListPage = React.lazy(() => import('./features/companies/pages/CompanyListPage').then(m => ({ default: m.CompanyListPage })));
const CompanyDetailPage = React.lazy(() => import('./features/companies/pages/CompanyDetailPage').then(m => ({ default: m.CompanyDetailPage })));
const CompanyEditPage = React.lazy(() => import('./features/companies/pages/CompanyEditPage').then(m => ({ default: m.CompanyEditPage })));
const CandidateProfilePage = React.lazy(() => import('./features/cvs/pages/CandidateProfilePage').then(m => ({ default: m.CandidateProfilePage })));
const CandidateCvPage = React.lazy(() => import('./features/cvs/pages/CandidateCvPage').then(m => ({ default: m.CandidateCvPage })));
const EmployerCandidateSearchPage = React.lazy(() => import('./features/cvs/pages/EmployerCandidateSearchPage').then(m => ({ default: m.EmployerCandidateSearchPage })));
const NotificationsPage = React.lazy(() => import('./features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const EmployerDashboardPage = React.lazy(() => import('./features/reports/pages/EmployerDashboardPage').then(m => ({ default: m.EmployerDashboardPage })));
const AdminDashboardPage = React.lazy(() => import('./features/reports/pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
import { CvsPage } from './features/cvs/pages/CvsPage';
import { InterviewsPage } from './features/interviews/pages/InterviewsPage';

const ApplicationsPage = React.lazy(() => import('./features/applications/pages/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })));
const UserManagementPage = React.lazy(() => import('./features/user-management/pages/UserManagementPage/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const SystemSettingsPage = React.lazy(() => import('./features/user-settings/pages/SystemSettingsPage/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));

const SavedJobListPage = React.lazy(() => import('./features/saved-jobs/pages/SavedJobListPage').then(m => ({ default: m.SavedJobListPage })));
const ProfilePage = React.lazy(() => import('./features/profile/pages/ProfilePage/ProfilePage').then(m => ({ default: m.ProfilePage })));
const MasterDataPage = React.lazy(() => import('./features/master-data/pages/MasterDataPage/MasterDataPage').then(m => ({ default: m.MasterDataPage })));
const OrganizationPage = React.lazy(() => import('./features/organization/pages/OrganizationPage/OrganizationPage').then(m => ({ default: m.OrganizationPage })));
const JobsDispatcherPage = React.lazy(() => import('./features/jobs/pages/JobsDispatcherPage').then(m => ({ default: m.JobsDispatcherPage })));
const MessagesPage = React.lazy(() => import('./features/messages/pages/MessagesPage').then(m => ({ default: m.MessagesPage })));

// Dynamic dispatcher for /reports route based on user roles
const ReportsDispatcherPage: React.FC = () => {
  const user = authService.getUser();
  const userRole = user?.role || user?.accountType || '';
  const roles = (user?.roles as string[]) || [];
  const permissions = (user?.permissions as string[]) || [];
  const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user?.username === 'admin' || userRole === 'Admin' || userRole === 'ADMIN';

  if (isSuperAdmin || permissions.includes('reports:view_all') || permissions.includes('report:view_all')) {
    return (
      <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải báo cáo quản trị...</div>}>
        <AdminDashboardPage />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải báo cáo tuyển dụng...</div>}>
      <EmployerDashboardPage />
    </React.Suspense>
  );
};



// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (isAuthenticated) {
    const user = authService.getUser();
    const role = user?.role || '';
    
    // Redirect according to Redirect Flow
    if (role === 'CANDIDATE') return <Navigate to="/jobs" replace />;
    if (
      role === 'EMPLOYER' ||
      role === 'COMPANY_OWNER' ||
      role === 'HR_MANAGER' ||
      role === 'RECRUITER' ||
      role === 'HIRING_MANAGER'
    ) {
      return <Navigate to="/employer/jobs" replace />;
    }
    if (role === 'ADMIN') return <Navigate to="/user-roles" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const PermissionRoute: React.FC<{ code: string; children: React.ReactNode }> = ({ code, children }) => {
  const user = authService.getUser();
  const permissions = (user?.permissions as string[]) || [];
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user?.username === 'admin' || userRole === 'Admin' || userRole === 'ADMIN';

  if (isSuperAdmin) return <>{children}</>;

  const permMap: Record<string, string[]> = {
    'job:save': ['saved-jobs:view', 'job:save'],
    'saved-jobs:view': ['saved-jobs:view', 'job:save'],
    'cv:manage': ['cvs:view', 'cvs:create', 'cvs:update', 'cv:manage'],
    'cvs:view': ['cvs:view', 'cv:manage'],
    'job:apply': ['applications:create', 'applications:view', 'job:apply'],
    'applications:view': ['applications:view', 'job:apply'],
    'job:manage': ['jobs:create', 'jobs:update', 'jobs:view', 'job:manage'],
    'job:post': ['jobs:create', 'job:post'],
    'cv:search': ['cvs:view', 'cv:search'],
    'company:update': ['companies:update', 'companies:view', 'company:update'],
    'notification:view': ['notifications:view', 'notification:view'],
    'notifications:view': ['notifications:view', 'notification:view'],
    'report:view': ['reports:view', 'report:view'],
    'reports:view': ['reports:view', 'report:view'],
    'report:view_all': ['reports:view', 'report:view_all'],
    'user-role:view': ['user-role:view', 'user-role:manage'],
    'user:view': ['user:view', 'user:manage', 'module:user'],
    'system:view': ['system:view', 'system:manage', 'module:system-setting', 'system-setting:view'],
    'master-data:view': ['master-data:view', 'master-data:create', 'master-data:update'],
    'organization:view': ['organization:view', 'organization:create', 'organization:update'],
    'messages:view': ['messages:view', 'messages:send']
  };

  const isCandidate = userRole === 'CANDIDATE' || userRole === 'User' || roles.includes('Ứng viên');
  const isEmployer = userRole === 'EMPLOYER' || userRole === 'Company' || roles.includes('Nhà tuyển dụng');

  if (isCandidate && (code === 'job:save' || code === 'saved-jobs:view' || code === 'cv:manage' || code === 'job:apply' || code === 'notification:view' || code === 'messages:view')) {
    return <>{children}</>;
  }

  if (isEmployer && (code === 'job:manage' || code === 'job:post' || code === 'cv:search' || code === 'company:update' || code === 'report:view' || code === 'messages:view')) {
    return <>{children}</>;
  }

  const targetPerms = permMap[code] || [code];
  const hasPermission = targetPerms.some(p => permissions.includes(p));
  return hasPermission ? <>{children}</> : <Navigate to="/" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Guest routes */}
      <Route path="/auth/login" element={
        <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        </React.Suspense>
      } />
      <Route path="/auth/register/candidate" element={
        <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
          <GuestRoute>
            <RegisterCandidatePage />
          </GuestRoute>
        </React.Suspense>
      } />
      <Route path="/auth/register/employer" element={
        <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
          <GuestRoute>
            <RegisterEmployerPage />
          </GuestRoute>
        </React.Suspense>
      } />

      {/* Redirect old login path to new /auth/login */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />

      {/* Protected dashboard routes */}
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/jobs" replace />} />
        <Route path="jobs" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <JobsDispatcherPage />
          </React.Suspense>
        } />
        <Route path="jobs/:id" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <JobDetailPage />
          </React.Suspense>
        } />
        <Route path="employer/jobs" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <EmployerJobListPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/jobs/new" element={
          <PermissionRoute code="job:post">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <JobFormPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/jobs/:id/edit" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <JobFormPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="cvs" element={<CvsPage />} />
        <Route path="candidate/profile" element={
          <PermissionRoute code="cv:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <CandidateProfilePage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="candidate/cvs" element={
          <PermissionRoute code="cv:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <CandidateCvPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/candidates" element={
          <PermissionRoute code="cv:search">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <EmployerCandidateSearchPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="candidate/applications" element={
          <PermissionRoute code="job:apply">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <CandidateAppHistoryPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="applications" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <ApplicationsPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/applications" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <EmployerAppManagePage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="notifications" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <NotificationsPage />
          </React.Suspense>
        } />
        <Route path="messages" element={
          <PermissionRoute code="messages:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <MessagesPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="companies" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <CompanyListPage />
          </React.Suspense>
        } />
        <Route path="companies/:id" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <CompanyDetailPage />
          </React.Suspense>
        } />
        <Route path="employer/company/edit" element={
          <PermissionRoute code="company:update">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <CompanyEditPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="candidate/saved-jobs" element={
          <PermissionRoute code="job:save">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <SavedJobListPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="saved-jobs" element={<Navigate to="/candidate/saved-jobs" replace />} />
        <Route path="notifications" element={
          <PermissionRoute code="notification:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <NotificationsPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="reports" element={<ReportsDispatcherPage />} />
        <Route path="employer/dashboard" element={
          <PermissionRoute code="report:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <EmployerDashboardPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="admin/dashboard" element={
          <PermissionRoute code="report:view_all">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <AdminDashboardPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="users" element={
          <PermissionRoute code="user:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <UserManagementPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="user-settings/system-configs" element={
          <PermissionRoute code="system:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <SystemSettingsPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="settings" element={<Navigate to="/user-settings/system-configs" replace />} />
        <Route path="master-data" element={
          <PermissionRoute code="master-data:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <MasterDataPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="organization" element={
          <PermissionRoute code="organization:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <OrganizationPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="profile" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <ProfilePage />
          </React.Suspense>
        } />
        
        {/* User Roles & Permissions Administration */}
        <Route 
          path="user-roles" 
          element={
            <PermissionRoute code="user-role:view">
              <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
                <Outlet />
              </React.Suspense>
            </PermissionRoute>
          }
        >
          {userRoleRoutes.map((route, idx) => (
            <Route
              key={idx}
              index={route.index}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Route>
    </Routes>
  );
};
