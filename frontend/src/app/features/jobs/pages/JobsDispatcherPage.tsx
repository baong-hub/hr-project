import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../../../core/services/auth.service';
import { EmployerJobListPage } from './EmployerJobListPage';
import { JobListPage } from './JobListPage';

export const JobsDispatcherPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const forcePublic = searchParams.get('view') === 'public';

  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const roles = (user?.roles as string[]) || [];
  const userRole = (user?.role || user?.accountType || '').toString().toUpperCase();

  const isEmployer = isAuthenticated && (
    roles.includes('Nhà tuyển dụng') || 
    roles.includes('Employer') || 
    roles.includes('Admin') || 
    roles.includes('Super Admin') || 
    roles.includes('Quản trị viên') || 
    roles.includes('HR_MANAGER') || 
    userRole === 'EMPLOYER' || 
    userRole === 'HR_MANAGER' || 
    userRole === 'ADMIN'
  );

  // If recruiter is signed in and not explicitly requesting public job view
  if (isEmployer && !forcePublic) {
    return <EmployerJobListPage />;
  }

  // Unauthenticated guests, public searchers, and candidate users see the public job board
  return <JobListPage />;
};
