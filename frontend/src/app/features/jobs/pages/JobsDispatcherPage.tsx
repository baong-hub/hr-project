import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../../../core/services/auth.service';
import { EmployerJobListPage } from './EmployerJobListPage';
import { JobListPage } from './JobListPage';

export const JobsDispatcherPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const forcePublic = searchParams.get('view') === 'public';

  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = (user?.role || user?.accountType || '').toString().toUpperCase();

  const isEmployer = 
    roles.includes('Nhà tuyển dụng') || 
    roles.includes('Employer') || 
    roles.includes('Admin') || 
    roles.includes('Super Admin') || 
    roles.includes('Quản trị viên') || 
    roles.includes('HR_MANAGER') || 
    userRole === 'EMPLOYER' || 
    userRole === 'HR_MANAGER' || 
    userRole === 'ADMIN';

  const isCandidate = (roles.includes('Ứng viên') || userRole === 'CANDIDATE' || userRole === 'USER') && !isEmployer;

  if (isCandidate || forcePublic) {
    return <JobListPage />;
  }

  return <EmployerJobListPage />;
};
