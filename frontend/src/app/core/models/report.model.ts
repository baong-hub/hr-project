export interface EmployerSummary {
  totalActiveJobs: number;
  totalApplications: number;
  totalViews: number;
  averageApplyRate: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface RecruitmentFunnel {
  stages: FunnelStage[];
}

export interface AdminSummary {
  totalCompanies: number;
  totalCandidates: number;
  totalJobs: number;
  totalApplications: number;
}
