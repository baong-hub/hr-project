import React from 'react';
import { Route, Routes, Navigate, Outlet, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { AppShell } from './core/layout/AppShell/AppShell';
import { PublicLayout } from './core/layout/PublicLayout/PublicLayout';
import { authService } from './core/services/auth.service';
import { userRoleRoutes } from './features/user-role/routes';

// Auth Module Pages
import { LoginPage } from './features/authentication/pages/LoginPage/LoginPage';
const RegisterCandidatePage = React.lazy(() => import('./features/authentication/pages/RegisterCandidatePage/RegisterCandidatePage').then(m => ({ default: m.RegisterCandidatePage })));
const RegisterEmployerPage = React.lazy(() => import('./features/authentication/pages/RegisterEmployerPage/RegisterEmployerPage').then(m => ({ default: m.RegisterEmployerPage })));

// Public Pages (Landing, Pricing, About, Contact, Policies)
const LandingPage = React.lazy(() => import('./features/public/LandingPage').then(m => ({ default: m.LandingPage })));
const PricingPage = React.lazy(() => import('./features/public/PricingPage').then(m => ({ default: m.PricingPage })));
const AboutPage = React.lazy(() => import('./features/public/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = React.lazy(() => import('./features/public/ContactPage').then(m => ({ default: m.ContactPage })));
const PrivacyPolicyPage = React.lazy(() => import('./features/public/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = React.lazy(() => import('./features/public/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));

// HR Marketplace Public & Mixed Pages
import { JobsDispatcherPage } from './features/jobs/pages/JobsDispatcherPage';
const JobDetailPage = React.lazy(() => import('./features/jobs/pages/JobDetailPage').then(m => ({ default: m.JobDetailPage })));
const CompanyListPage = React.lazy(() => import('./features/companies/pages/CompanyListPage').then(m => ({ default: m.CompanyListPage })));
const CompanyDetailPage = React.lazy(() => import('./features/companies/pages/CompanyDetailPage').then(m => ({ default: m.CompanyDetailPage })));
const CompanyCareersPage = React.lazy(() => import('./features/companies/pages/CompanyCareersPage').then(m => ({ default: m.CompanyCareersPage })));

// Career Hub & Salary Insights Public Pages
const BlogListPage = React.lazy(() => import('./features/blog/pages/BlogListPage').then(m => ({ default: m.BlogListPage })));
const BlogDetailPage = React.lazy(() => import('./features/blog/pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const SalaryInsightsPage = React.lazy(() => import('./features/salary/pages/SalaryInsightsPage').then(m => ({ default: m.SalaryInsightsPage })));

// Protected App Features
const EmployerJobListPage = React.lazy(() => import('./features/jobs/pages/EmployerJobListPage').then(m => ({ default: m.EmployerJobListPage })));
const JobFormPage = React.lazy(() => import('./features/jobs/pages/JobFormPage').then(m => ({ default: m.JobFormPage })));
const CandidateAppHistoryPage = React.lazy(() => import('./features/applications/pages/CandidateAppHistoryPage').then(m => ({ default: m.CandidateAppHistoryPage })));
import { EmployerAppManagePage } from './features/applications/pages/EmployerAppManagePage';
const CandidateAssessmentPage = React.lazy(() => import('./features/applications/pages/CandidateAssessmentPage').then(m => ({ default: m.CandidateAssessmentPage })));
const EmployerAssessmentsPage = React.lazy(() => import('./features/applications/pages/EmployerAssessmentsPage').then(m => ({ default: m.EmployerAssessmentsPage })));
const CompanyEditPage = React.lazy(() => import('./features/companies/pages/CompanyEditPage').then(m => ({ default: m.CompanyEditPage })));
const CandidateProfilePage = React.lazy(() => import('./features/cvs/pages/CandidateProfilePage').then(m => ({ default: m.CandidateProfilePage })));
const CandidateCvPage = React.lazy(() => import('./features/cvs/pages/CandidateCvPage').then(m => ({ default: m.CandidateCvPage })));
const CandidateOfferDetailPage = React.lazy(() => import('./features/job-offers/pages/CandidateOfferDetailPage').then(m => ({ default: m.CandidateOfferDetailPage })));
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
const MessagesPage = React.lazy(() => import('./features/messages/pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const FraudModerationPage = React.lazy(() => import('./features/jobs/pages/FraudModerationPage').then(m => ({ default: m.FraudModerationPage })));

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

// Canonical redirect component
const CompanyCareersRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/companies/${id}/careers`} replace />;
};

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const location = useLocation();
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to={`/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  );
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const [searchParams] = useSearchParams();
  if (isAuthenticated) {
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('/auth/')) {
      return <Navigate to={redirectUrl} replace />;
    }

    const user = authService.getUser();
    const role = (user?.role || user?.accountType || '').toString().toUpperCase();
    
    // Redirect according to Redirect Flow
    if (role === 'CANDIDATE' || role === 'USER') return <Navigate to="/jobs" replace />;
    if (
      role === 'EMPLOYER' ||
      role === 'COMPANY_OWNER' ||
      role === 'HR_MANAGER' ||
      role === 'RECRUITER' ||
      role === 'HIRING_MANAGER'
    ) {
      return <Navigate to="/employer/jobs" replace />;
    }
    if (role === 'ADMIN' || role === 'SUPER ADMIN') return <Navigate to="/user-roles" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const PermissionRoute: React.FC<{ code: string; children: React.ReactNode }> = ({ code, children }) => {
  const user = authService.getUser();
  const permissions = (user?.permissions as string[]) || [];
  const roles = (user?.roles as string[]) || [];
  const userRole = (user?.role || user?.accountType || '').toString().toUpperCase();
  const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user?.username === 'admin' || userRole === 'Admin' || userRole === 'ADMIN';
  const isCandidate = userRole === 'CANDIDATE' || userRole === 'USER' || roles.includes('Ứng viên');

  // Chặn Admin / Nhà tuyển dụng vào trang việc làm đã lưu (vì chỉ dành riêng cho Ứng viên)
  if ((code === 'job:save' || code === 'saved-jobs:view') && (isSuperAdmin || !isCandidate)) {
    return <Navigate to="/" replace />;
  }

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

  const isEmployer = userRole === 'EMPLOYER' || userRole === 'COMPANY' || roles.includes('Nhà tuyển dụng');

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
      {/* =========================================================================
          1. PUBLIC LAYOUT ROUTES (Header & Footer công khai, SEO Friendly)
         ========================================================================= */}
      <Route element={<PublicLayout />}>
        {/* Landing Page */}
        <Route path="/" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải trang chủ...</div>}>
            <LandingPage />
          </React.Suspense>
        } />

        {/* Danh sách & Tìm kiếm việc làm */}
        <Route path="/jobs" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải danh sách việc làm...</div>}>
            <JobsDispatcherPage />
          </React.Suspense>
        } />

        {/* Chi tiết tin tuyển dụng */}
        <Route path="/jobs/:id" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải chi tiết công việc...</div>}>
            <JobDetailPage />
          </React.Suspense>
        } />

        {/* Danh sách công ty / doanh nghiệp */}
        <Route path="/companies" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải danh sách doanh nghiệp...</div>}>
            <CompanyListPage />
          </React.Suspense>
        } />

        {/* Chi tiết công ty */}
        <Route path="/companies/:id" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải thông tin doanh nghiệp...</div>}>
            <CompanyDetailPage />
          </React.Suspense>
        } />

        {/* Trang tuyển dụng riêng của doanh nghiệp (Branded Careers Page) */}
        <Route path="/companies/:id/careers" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải trang tuyển dụng...</div>}>
            <CompanyCareersPage />
          </React.Suspense>
        } />
        {/* Canonical redirect: /company/:id/careers -> /companies/:id/careers */}
        <Route path="/company/:id/careers" element={<CompanyCareersRedirect />} />

        {/* Cẩm nang nghề nghiệp & Blog SEO */}
        <Route path="/blog" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải cẩm nang...</div>}>
            <BlogListPage />
          </React.Suspense>
        } />
        <Route path="/blog/:slug" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải bài viết...</div>}>
            <BlogDetailPage />
          </React.Suspense>
        } />

        {/* Báo cáo thị trường lương 2026 */}
        <Route path="/salary-insights" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải báo cáo lương...</div>}>
            <SalaryInsightsPage />
          </React.Suspense>
        } />

        {/* Bảng giá dịch vụ tuyển dụng */}
        <Route path="/pricing" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải bảng giá dịch vụ...</div>}>
            <PricingPage />
          </React.Suspense>
        } />

        {/* Giới thiệu & Về chúng tôi */}
        <Route path="/about" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải...</div>}>
            <AboutPage />
          </React.Suspense>
        } />

        {/* Liên hệ & Hỗ trợ */}
        <Route path="/contact" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải...</div>}>
            <ContactPage />
          </React.Suspense>
        } />

        {/* Chính sách bảo mật & Điều khoản dịch vụ */}
        <Route path="/privacy" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải...</div>}>
            <PrivacyPolicyPage />
          </React.Suspense>
        } />
        <Route path="/terms" element={
          <React.Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Đang tải...</div>}>
            <TermsOfServicePage />
          </React.Suspense>
        } />
      </Route>

      {/* =========================================================================
          2. AUTHENTICATION & GUEST ROUTES
         ========================================================================= */}
      <Route path="/auth/login" element={
        <GuestRoute>
          <LoginPage />
        </GuestRoute>
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

      {/* Shortcuts & Redirects */}
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register/candidate" replace />} />

      {/* =========================================================================
          3. PROTECTED APP ROUTES (AppShell Layout, yêu cầu đăng nhập)
         ========================================================================= */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        {/* Module Tuyển Dụng Dành Cho Nhà Tuyển Dụng */}
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
        <Route path="employer/applications" element={
          <PermissionRoute code="job:manage">
            <EmployerAppManagePage />
          </PermissionRoute>
        } />
        <Route path="applications" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <ApplicationsPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/candidates" element={
          <PermissionRoute code="cv:search">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải tìm kiếm ứng viên...</div>}>
              <EmployerCandidateSearchPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/assessments" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải quản lý đề thi...</div>}>
              <EmployerAssessmentsPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="employer/company/edit" element={
          <PermissionRoute code="company:update">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <CompanyEditPage />
            </React.Suspense>
          </PermissionRoute>
        } />

        {/* Module Dành Cho Ứng Viên */}
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
        <Route path="candidate/applications" element={
          <PermissionRoute code="job:apply">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <CandidateAppHistoryPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="candidate/offers" element={
          <PermissionRoute code="job:apply">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải thư mời nhận việc...</div>}>
              <CandidateOfferDetailPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="candidate/offers/:id" element={
          <PermissionRoute code="job:apply">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải thư mời nhận việc...</div>}>
              <CandidateOfferDetailPage />
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
        <Route path="candidate/assessment/:testId" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải bài thi trực tuyến...</div>}>
            <CandidateAssessmentPage />
          </React.Suspense>
        } />
        <Route path="assessment/:testId" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải bài thi trực tuyến...</div>}>
            <CandidateAssessmentPage />
          </React.Suspense>
        } />

        {/* Phỏng Vấn, Tin Nhắn, Thông Báo & Hồ Sơ Cá Nhân */}
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="notifications" element={
          <PermissionRoute code="notification:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <NotificationsPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="messages" element={
          <PermissionRoute code="messages:view">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
              <MessagesPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="profile" element={
          <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>}>
            <ProfilePage />
          </React.Suspense>
        } />

        {/* Báo Cáo Tuyển Dụng & Phân Tích */}
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

        {/* Quản Trị Hệ Thống */}
        <Route path="admin/moderation" element={
          <PermissionRoute code="job:manage">
            <React.Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải trung tâm kiểm duyệt...</div>}>
              <FraudModerationPage />
            </React.Suspense>
          </PermissionRoute>
        } />
        <Route path="admin/fraud-detection" element={<Navigate to="/admin/moderation" replace />} />
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

        {/* Phân Quyền & Quản Lý Vai Trò (RBAC Administration) */}
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
      </Route>

      {/* Fallback điều hướng về trang chủ công khai */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
